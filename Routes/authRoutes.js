const express = require('express');
const {
  signup,
  signin,
  refreshToken,
  logout,
  googleAuth,
  googleAuthCallback,
  forgetPassword,
  ResetPassword,
  validateResetToken,
} = require('../Controllers/authController');
const {
  verifyRefreshTokenInDb,
} = require('../Middlewares/authMiddleware');

const router = express.Router();

router.post('/signup', signup);

router.post('/signin', signin);

router.post(
  '/refresh-token',
  verifyRefreshTokenInDb,
  refreshToken,
);

router.get('/google', googleAuth);

router.get('/google/callback', googleAuthCallback);

router.post('/logout', logout);

router.post('/forgot-password', forgetPassword);

router.get('/reset-password', validateResetToken);

router.post('/reset-password', ResetPassword);

module.exports = router;
