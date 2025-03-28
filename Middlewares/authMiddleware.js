const jwt = require('jsonwebtoken');
const Token = require('../Models/tokenModel');

const authenticateAccessToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  console.log('Received Token:', token); // Debugging

  if (!token) {
    return res
      .status(401)
      .json({ error: 'Access token required' });
  }

  jwt.verify(
    token,
    process.env.JWT_SECRET_ACCESS,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid or expired access token',
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
      .json({ error: 'Refresh token required' });
  }

  jwt.verify(
    refreshToken,
    process.env.JWT_SECRET_REFRESH,
    (err, user) => {
      if (err) {
        return res.status(403).json({
          error: 'Invalid or expired refresh token',
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
      .json({ message: 'Refresh token required' });
  }

  try {
    // Check if token exists in the database
    const tokenInDb = await Token.findOne({ refreshToken });
    if (!tokenInDb) {
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
      });
    }

    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
const isAdmin = (req, res, next) => {
  if (!req.user || !req.user.role) {
    return res.status(403).json({ error: 'Unauthorized: No role found' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }

  next();
};




module.exports = {
  authenticateAccessToken,
  authenticateRefreshToken,
  verifyRefreshTokenInDb,
  isAdmin
};
