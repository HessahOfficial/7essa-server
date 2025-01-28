const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    emailVerified: { type: Boolean },
    ID_Verified: { type: Boolean },
    googleId: { type: String },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },
    role: { type: String, default: 'user' },
    phoneNumber: { type: Number },
    email_verification_code: { type: Number },
    email_verification_code_expires: { type: Date },
    Image: {
      type: String,
      default: 'https://www.viverefermo.it/images/user.png',
    },
    balance: { type: Number, default: 0 },
    passwordResetToken: String,
    passwordResetExpires: Date,
    passwordChangedAt: Date,
  },
  { timestamps: true },
);

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
