const jwt = require('jsonwebtoken');

const generateAccessToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_ACCESS, {
    expiresIn: process.env.JWT_EXPIRES_IN_ACCESS,
  });

const generateRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: process.env.JWT_EXPIRES_IN_REFRESH,
  });

module.exports = {
  generateAccessToken,
  generateRefreshToken,
};
