const jwt = require('jsonwebtoken');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if(!authHeader) {
        const error = appError.create('Token is required', 401, httpStatusText.ERROR)
        return next(error);
    }

    const token = authHeader.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.JWT_SECRET_ACCESS);
        req.currentUser = currentUser;
        next();
    } catch (err) {
        const error = appError.create('Invalid token', 401, httpStatusText.ERROR)
        return next(error);
    }   
}


const verifyRefToken = (req, res, next) => {
    const authHeader = req.headers['Authorization'] || req.headers['authorization'];
    if (!authHeader) {
        const error = appError.create('Token is required', 401, httpStatusText.ERROR)
        return next(error);
    }

    const token = authHeader.split(' ')[1];
    try {
        const currentUser = jwt.verify(token, process.env.JWT_SECRET_REFRESH);
        req.currentUser = currentUser;
        req.refreshToken = token;
        next();
    } catch (err) {
        const error = appError.create('Invalid token', 401, httpStatusText.ERROR)
        return next(error);
    }
}
module.exports = {
    verifyToken,
    verifyRefToken
};