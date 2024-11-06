const User = require("./../Models/userModel");
const jwt = require("jsonwebtoken");
const CustomError = require("./../Utils/CustomError");
const util = require("util");
const sendEmail = require("../Utils/email");
const crypto = require("crypto");

const filterReqObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((prop) => {
    if (allowedFields.includes(prop)) newObj[prop] = obj[prop];
  });
  return newObj;
};

const signToken = (id) => {
  return jwt.sign({ id }, process.env.SECRET_STR, {
    expiresIn: process.env.LOGIN_EXPIRES,
  });
};

// Function for sending response
const createSendResponse = (user, statusCode, res) => {
  const token = signToken(user._id);

  res.status(statusCode).json({
    status: "Success",
    token,
    data: {
      user,
    },
  });
};

// GET ALL EXISTING USERS
exports.getAllUsers = async (req, res, next) => {
  try {
    const allUsers = await User.find();

    res.status(200).json({
      status: "Success",
      length: allUsers.length,
      data: {
        allUsers,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// TO UPDATE USER PASSWORD
exports.updatePassword = async (req, res, next) => {
  try {
    // 1. GET CURRRENT USER FROM THE DATABASE
    const user = await User.findById(req.currentUser._id).select("+password");

    // 2. CHECK IF THE CURRENT PASSWORD IS CORRECT
    const { currentPassword } = req.body;
    if (
      !(await user.comparePasswordInDatabase(
        req.body.currentPassword,
        user.password
      ))
    ) {
      const error = new CustomError(
        "The current password you provided is incorrect!",
        401
      );
      return next(error);
    }

    // 3. IF THE SUPPLIED PASSWORD IS CORRECT, THEN UPDATE THE USER PASSWORD WITH NEW VALUE
    user.password = req.body.password;
    user.confirmPassword = req.body.confirmPassword;
    await user.save();

    // 4. LOGIN USER & SEND JWT
    createSendResponse(user, 200, res);

    // const token = signToken(user._id);
    // res.status(200).json({
    //   status: "success",
    //   token,
    //   data: {
    //     user,
    //   },
    // });
  } catch (error) {
    return next(error);
  }
};

// TO UPDATE ANY USER DETAILS ASIDE PASSWORD
exports.updateMe = async (req, res, next) => {
  try {
    // CHECK IF REQUESTED DATA CONTAIN PASSWORD OR CONFIRM PASSWORD
    if (req.body.password || req.body.confirmPassword) {
      const error = new CustomError(
        "You can't update your password using this endpoint",
        400
      );
      return next(error);
    }

    // UPDATE USER DETAIL
    const filterObj = filterReqObj(req.body, "name", "email");
    const updatedUser = await User.findByIdAndUpdate(
      req.currentUser.id,
      filterObj,
      { runValidators: true }
    );

    // Constructing a message showing only the fields that were updated
    const updatedFields = Object.keys(filterObj).join(", ");

    res.status(200).json({
      status: "success",
      message: `The "${updatedFields}" field has been updated successfully for user "${updatedUser.name}"!`,
      data: updatedUser,
    });
  } catch (error) {
    return next(error);
  }
};

exports.deleteMe = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.currentUser._id, { active: false });

    res.status(204).json({
      status: "Success",
      data: null,
    });
  } catch (error) {
    return next(error);
  }
};
