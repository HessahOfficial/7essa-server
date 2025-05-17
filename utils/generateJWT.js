const jwt = require('jsonwebtoken');

module.exports = (
  payload,
  expiresIn = process.env.JWT_EXPIRES_IN_REFRESH,
  JWT_SECRET = process.env.JWT_SECRET_REFRESH,
) => {
  const token = jwt.sign(payload, JWT_SECRET, {
    expiresIn: expiresIn,
  });

  return token;
};

