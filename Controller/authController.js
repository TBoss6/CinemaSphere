const User = require("./../Models/userModel");
const jwt = require("jsonwebtoken");
const CustomError = require("./../Utils/CustomError");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");
// const dotenv = require("dotenv");

// dotenv.config({ path: "./../config.env" });

const SECRET_STR = process.env.SECRET_STR;

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

// Function for sending response
const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  const options = {
    maxAge: process.env.COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000,
    // secure: true,
    httpOnly: true,
  };

  if (process.env.NODE_ENV === "production") {
    options.secure = true;
  }

  res.cookie("jwt", token, options);

  user.password = undefined;

  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create(req.body);

    createSendResponse(newUser, 201, res);
    // const token = signToken(newUser._id);

    // res.status(201).json({
    //   status: "Success",
    //   token,
    //   data: {
    //     user: newUser,
    //   },
    // });
  } catch (error) {
    return next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      const error = new CustomError(
        "Please input an email or password to Login",
        400
      );
      return next(error);
    }

    // Check if the User exists with the given email address
    const user = await User.findOne({ email }).select("+password");

    // const ismatch = await user.comparePasswordInDatabase(
    //   password,
    //   user.password
    // );

    if (
      !user ||
      !(await user.comparePasswordInDatabase(password, user.password))
    ) {
      const error = new CustomError("Incorrect email or password", 400);
      return next(error);
    }

    createSendResponse(user, 200, res);

    // const token = signToken(user._id);

    // res.status(200).json({
    //   status: "Success",
    //   token,
    // });
  } catch (error) {
    return next(error);
  }
};

exports.protect = async (req, res, next) => {
  try {
    //1. Read the Token and check if it exists
    const testToken = req.headers.authorization;
    let token;
    if (testToken && testToken.startsWith("bearer")) {
      token = testToken.split(" ")[1];
    }

    if (!token) {
      const error = new CustomError("You are not logged in!", 401);
      next(error);
    }

    //2. Validate the Token
    const decodedToken = await util.promisify(jwt.verify)(token, SECRET_STR);
    console.log(decodedToken);

    //3. If the user exists
    const currentUser = await User.findById(decodedToken.id);

    if (!currentUser) {
      const error = new CustomError(
        "The user with the given token does not exist",
        401
      );
      next(error);
    }

    //4. If the user changed password after the token was issued
    const isPasswordChanged = await currentUser.isPasswordChanged(
      decodedToken.iat
    );
    if (isPasswordChanged) {
      const error = new CustomError(
        "The password has been changed recently. Please login again",
        401
      );
      return next(error);
    }

    //5. Allow user to access route
    req.currentUser = currentUser;
    next();
  } catch (error) {
    return next(error);
  }
};

exports.restrict = (role) => {
  return (req, res, next) => {
    if (req.currentUser.role !== role) {
      const error = new CustomError(
        "You do not have permission to perform this action",
        403
      );
      next(error);
    }
    next();
  };
};

// //^^^^^^^^^ If there are multiple roles then we use the REST PARAMETERS
// exports.restrict = (...role) => {
//   return (req, res, next) => {
//     if (!role.includes(req.currentUser.role)) {
//       const error = new CustomError(
//         "You do not have permission to perform this action",
//         403
//       );
//       next(error);
//     }
//     next();
//   };
// };

exports.forgotPassword = async (req, res, next) => {
  try {
    // 1. GET USER BASED ON POSTED EMAIL
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      const error = new CustomError(
        "We could not find the user with given email",
        404
      );
      next(error);
    }

    // 2. GENERATE A RANDOM RESET TOKEN
    const resetToken = user.createResetPasswordToken();

    await user.save({ validateBeforeSave: false });

    // 3. SEND THE TOKEN BACK TO THE USER EMAIL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/users/resetpassword/${resetToken}`;
    const message = `We have received a password reset request. Please use the below link to reset your password\n\n${resetUrl}\n\nThis reset password link would be valid only for 10mins`;

    try {
      await sendEmail({
        email: user.email,
        subject: "password change request received",
        message: message,
      });

      res.status(200).json({
        status: "success",
        message: "password reset link send to the user email",
      });
    } catch (error) {
      user.passwordResetToken = undefined;
      user.passwordResetTokenExpires = undefined;
      user.save({ validateBeforeSave: false });

      const err = new CustomError(
        "There was an error sending password reset email. Please try again later",
        500
      );
      return next(err);
    }
  } catch (error) {
    return next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    // 1. IF THE USER EXISTS WITH THE GIVEN TOKRN & THE TOKEN HAS NOT EXPIRED
    let token = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      passwordResetToken: token,
      passwordResetTokenExpires: { $gt: Date.now() },
    });

    if (!user) {
      const error = new CustomError("Token is invalid or has expired", 400);
      return next(error);
    }

    // 2. RESETTING THE USER PASSWORD
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.passwordChangedAt = Date.now();

    await user.save();

    // 3. LOGIN THE USER
    createSendResponse(user, 200, res);

    // const loginToken = signToken(user._id);

    // res.status(200).json({
    //   status: "Success",
    //   token: loginToken,
    // });
  } catch (error) {
    return next(error);
  }
};
