const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

module.exports = (...roles) => {
  return (req, res, next) => {

    const { role, id } = req.currentUser;
    const { userId } = req.params;

    const error = appError.create(
      "You are not authorized!",
      401,
      httpStatusText.ERROR
    );

    if ((roles.length !== 0 && roles.includes(role)) || userId === id) {
      return next();
    }
    return next(error);

  };
}