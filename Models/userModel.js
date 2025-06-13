const mongoose = require('mongoose');
const userRoles = require('../utils/constants/userRoles');
const USER_ACTIVITY = require('../utils/constants/USER_ACTIVITY');

const userSchema = new mongoose.Schema(
  {
    nationalId: {
      type: String,
      unique: true,
      length: 14
    },
    isInvestor: { type: Boolean, default: false },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    fullName: { type: String },
    username: {
      type: String,
      required: true,
      unique: true,
    },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    ID_Verified: { type: Boolean, default: false },
    googleId: { type: String },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: Object.values(userRoles),
      default: userRoles.USER,
    },
    activity: {
      type: String,
      enum: Object.values(USER_ACTIVITY),
      default: USER_ACTIVITY.ACTIVE,
    },
    phoneNumber: { type: String },
    email_verification_code: { type: Number },
    email_verification_code_expires: { type: Date },

    avatar: {
      type: String,
      default:
        'https://www.viverefermo.it/images/user.png',
    },
    pin: {
      type: String,
      length: 6,
      default: 123456,
    },
    balance: { type: Number, default: 0 },
    passwordResetToken: String,
    passwordResetExpires: Date,
    favourites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Property',
      },
    ],
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

userSchema.pre('save', function (next) {
  // if firstName or lastName is modified, update fullName
  if (this.isModified('firstName') || this.isModified('lastName')) {
    this.fullName = `${this.firstName} ${this.lastName}`;
  }
  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
