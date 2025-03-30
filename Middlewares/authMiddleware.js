const jwt = require('jsonwebtoken');
const Token = require('../Models/tokenModel');

const authenticateAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  console.log('Received Token:', token); // Debugging

  if (!token) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Access token required' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET_ACCESS,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 'fail',
          message: 'Invalid or expired access token',
        });
      }
      req.user = user;
      next();
    },
  );
};

const authenticateRefreshToken = (req, res, next) => {
  const { token: refreshToken } = req.body;

  if (!refreshToken) {
    return res
      .status(401)
      .json({ status: 'fail', message: 'Refresh token required' });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_SECRET_REFRESH,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          status: 'fail',
          message: 'Invalid or expired refresh token',
        });
      }
      req.user = user;
      next();
    },
  );
};

const verifyRefreshTokenInDb = async (req, res, next) => {
  let refreshToken =
    req.body.refreshToken ||
    req.headers['authorization']?.split(' ')[1];

  if (!refreshToken) {
    return res
      .status(400)
      .json({ status: 'fail', message: 'Refresh token required' });
  }

  try {
    const tokenInDb = await Token.findOne({ refreshToken });
    if (!tokenInDb) {
      return res.status(403).json({
        status: 'fail',
        message: 'Invalid or expired refresh token',
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ status: 'fail', message: 'Server error' });
  }
};

const allowedTo = (...roles) => {

  return (req, res, next) => {
    console.log('User:', req.user);
    if (!req.user?.role) {
      return res.status(403).json({ status: 'fail', message: 'Unauthorized: No role found' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: Access requires one of the following roles: ${roles.join(', ')} and you are ${req.user.role}`,
      });
    }

    next();
  };
};

module.exports = {
  authenticateAccessToken,
  authenticateRefreshToken,
  verifyRefreshTokenInDb,
  allowedTo
};
