const rateLimit = require('express-rate-limit');
const { logEvents } = require('./logger');
const httpStatusText = require('../utils/constants/httpStatusText');

const emailLimiter = rateLimit({
  windowMs: 60 * 1000 * 60 * 6, // 6 hours 
  max: 5, // Limit each IP to 5 email requests per 6 hours
  message:
      { message: 'Too many email attempts from this IP, please try again after 6 hours pause' },
      handler: (req, res, next, options) => {
        logEvents(`Too Many Email Requests from IP ${req.ip}: ${options.message.message}\t${req.method}\t${req.url}\t${req.headers.origin}`, 'errLog.log')
        res.status(options.statusCode).send({ status: httpStatusText.ERROR, message: options.message.message })
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

module.exports = emailLimiter;