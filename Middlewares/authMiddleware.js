const Token = require('../Models/tokenModel');
exports.verifyRefreshTokenInDb = async (req, res, next) => {
  let refreshToken =
    req.body.refreshToken ||
    req.headers['authorization']?.split(' ')[1]; // look for token in body or headers

  if (!refreshToken) {
    return res
      .status(400)
      .json({ message: 'Refresh token required' });
  }

  try {
    // Check if the refresh token exists in DB
    const tokenInDb = await Token.findOne({ refreshToken });
    if (!tokenInDb) {
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
      });
    }

    // Proceed to the next middleware
    next();
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
