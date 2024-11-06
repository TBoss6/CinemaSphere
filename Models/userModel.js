const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// name, email, password, confirmPassword, photo
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name"],
  },
  email: {
    type: String,
    required: [true, "Please enter an email"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email address"],
  },
  photo: String,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  password: {
    type: String,
    required: [true, "Please enter a Password"],
    minlength: 8,
    select: false,
  },
  confirmPassword: {
    type: String,
    required: [true, "Please confirm your Password"],
    validate: {
      //This validator will only work for save() & create()
      validator: function (value) {
        return value == this.password;
      },
      message: "The Password and confirmPassword does not match",
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetTokenExpires: Date,
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  //encrypt the password before saving it
  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
  next();
});

userSchema.pre(/^find/, function (next) {
  // "this" keyword in the function will point to the current query
  this.find({ active: { $ne: false } });
  next();
});

userSchema.methods.comparePasswordInDatabase = async function (
  pswd,
  pswdInDatabase
) {
  return await bcrypt.compare(pswd, pswdInDatabase);
};

userSchema.methods.isPasswordChanged = async function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const pswdChangedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    ); //Converting "passwordChangedAt" to normal "Timestamp"
    console.log(this.passwordChangedAt, pswdChangedTimeStamp, JWTTimestamp);

    return JWTTimestamp < pswdChangedTimeStamp; // This means that the password was changed after the jwt was issued
  }
  return false;
};

userSchema.methods.createResetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");
  this.passwordResetTokenExpires = Date.now() + 10 * 60 * 1000;

  console.log(
    resetToken,
    this.passwordResetToken,
    this.passwordResetTokenExpires
  );

  return resetToken;
};

const User = mongoose.model("User", userSchema);
module.exports = User;
