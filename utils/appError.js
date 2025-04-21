class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
  toJSON() {
    return {
      status: this.status,
      statusCode: this.statusCode,
      message: this.message
    };
  }
}




module.exports = AppError;
