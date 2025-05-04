const httpStatusText = require('../utils/constants/httpStatusText');

class AppError extends Error {
  create(message, statusCode, statusText = statusCode.startsWith('4') ? httpStatusText.FAIL : httpStatusText.ERROR) {
      this.message = message;
      this.statusCode = statusCode;
      this.statusText = statusText;
      return this;
  }
}

module.exports = new AppError();