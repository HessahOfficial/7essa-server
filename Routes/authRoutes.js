const express = require('express');
const {
  signup,
  signin,
  refreshToken,
  logout,
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

router.post('/logout', logout);

module.exports = router;
