const mongoose = require('mongoose');
const crypto = require('crypto');
const bcrypt = require('bcrypt');
const userRoles = require('../utils/constants/userRoles');


const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false },
    ID_Verified: { type: Boolean, default: false },
    googleId: { type: String, unique: true },
    password: {
      type: String,
      required: function () {
        return !this.googleId;
      },
      select: false,
    },
    role: { type: String, enum: Object.values(userRoles), default: userRoles.USER },
    activity: { type: String, enum: ['active', 'inactive', 'Banned'], default: 'active' },
    phoneNumber: { type: Number, unique: true },
    email_verification_code: { type: Number },
    email_verification_code_expires: { type: Date },
    Image: {
      type: String,
      default: 'https://www.viverefermo.it/images/user.png',
    },
    balance: { type: Number, default: 0 },
    passwordResetToken: String,
    passwordResetExpires: Date,
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Property' }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

const User = mongoose.model('User', userSchema);

module.exports = User;