const express = require('express');
const authController = require('../Controllers/authController');
const {
  verifyRefToken,
} = require('../Middlewares/verifyToken');

const router = express.Router();

router.post('/signup', authController.signup);

router.post('/signin', authController.signin);

router.get('/refresh-token', verifyRefToken, authController.refreshToken);

router.get('/google', authController.googleAuth);

router.get('/google/callback', authController.googleAuthCallback);

router.post('/logout', authController.logout);

router.post('/forgot-password', authController.forgetPassword);

router.get('/reset-password', authController.validateResetToken);

router.post('/reset-password', authController.ResetPassword);

module.exports = router;

