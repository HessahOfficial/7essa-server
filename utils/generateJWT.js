const jwt = require('jsonwebtoken');

module.exports = async (
  payload,
  expiresIn = '7d',
  JWT_SECRET = process.env.JWT_SECRET_REFRESH,
) => {
  const token = await jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn,
  });

  return token;
};

