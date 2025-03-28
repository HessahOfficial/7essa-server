const jwt = require('jsonwebtoken');

const generateAccessToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET_ACCESS, {
    expiresIn: process.env.JWT_EXPIRES_IN_ACCESS,
  });

const generateRefreshToken = (id, role) =>
  jwt.sign({ id, role }, process.env.JWT_SECRET_REFRESH, {
    expiresIn: process.env.JWT_EXPIRES_IN_REFRESH,
  });
const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET_REFRESH);
};
module.exports = {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
};
