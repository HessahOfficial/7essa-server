const express = require('express');
const authController = require('../Controllers/authController');
const {
  verifyRefToken,
  verifyToken,
} = require('../Middlewares/verifyToken');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/signin', authController.signin);

router.route('/verify-email')
  .post(authController.verifyEmail)

router.route('/confirm-email')
  .post(authController.confirmEmail)

router.get('/refresh-token', verifyToken, authController.refreshToken);

router.get('/google', authController.googleAuth);

router.get('/google/callback', authController.googleAuthCallback);

router.post('/logout', authController.logout);

router.post('/forgot-password', authController.forgetPassword);

router.post('/reset-password', authController.ResetPassword);

router.route('/change-my-password')
  .post(verifyToken, authController.changeMyPassword)


module.exports = router;

