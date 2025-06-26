const Payment = require('../Models/paymentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const mongoose = require('mongoose');
const User = require('../Models/userModel');
const moment = require('moment-timezone');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

const egyptTime = moment.tz('Africa/Cairo').utc().format(); // Default format is ISO 8601
exports.createPayment = asyncWrapper(async (req, res, next) => {
    let userId = req.currentUser.id;
    const { amount, paymentMethod, paymentType } = req.body;
    const screenshot = req.file ? req.file.path : null;
    if (!screenshot) {
        const error = appError.create('Screenshot is required', 400, httpStatusText.FAIL);
        return next(error);
    }

    if (!userId || typeof userId !== 'string') {
        const error = appError.create('User ID is required and must be a string', 400, httpStatusText.FAIL);
        return next(error);
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        const error = appError.create('User ID is invalid', 400, httpStatusText.FAIL);
        return next(error);
    }

    const user = await User.findById(userId);
    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    if (!amount || typeof amount !== 'number' || amount < 1000) {
        const error = appError.create('Amount is required and must be at least 1000', 400, httpStatusText.FAIL);
        return next(error);
    }

    const allowedPaymentMethods = ['instaPay', 'VodafoneCash', 'bankTransfer'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
        const error = appError.create(
            `Payment method is required and must be one of: ${allowedPaymentMethods.join(', ')}`,
            400,
            httpStatusText.FAIL
        );
        return next(error);
    }

    const newPayment = new Payment({
        userId,
        amount,
        paymentMethod,
        paymentDate: egyptTime,
        paymentType,
        screenshot,
    });

    await newPayment.save();

    res.status(201).json({
        status: 'success',
        data: { newPayment },
    });
});

exports.getPaymentStatus = asyncWrapper(async (req, res, next) => {
    const paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        const error = appError.create('Payment ID is invalid', 400, httpStatusText.FAIL);
        return next(error);
    }
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        const error = appError.create('Payment not found', 404, httpStatusText.FAIL);
        return next(error);
    }

    const paymentstatus = payment.paymentStatus;
    res.status(200).json({
        status: 'success',
        data: { paymentstatus },
    });
});

exports.getHistory = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.id;
    const user = await User.findById(userId);
    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    const payments = await Payment.find({ userId });
    res.status(200).json({
        status: 'success',
        data: { payments },
    });
});

exports.deletePayment = asyncWrapper(async (req, res, next) => {
    const paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        const error = appError.create('Invalid Payment ID format', 400, httpStatusText.FAIL);
        return next(error);
    }
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        const error = appError.create('Payment not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    if (payment.userId.toString() !== req.currentUser.id) {
        const error = appError.create('Unauthorized to delete this payment', 403, httpStatusText.FAIL);
        return next(error);
    }
    await Payment.findByIdAndDelete(paymentId);
    res.status(200).json({ status: 'success', data: ' Request Deleted Sucessfully' });
});

exports.getDepositHistory = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.id;
    const user = await User.findById(userId);
    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    const depositHistory = await Payment.find({ userId, paymentType: 'deposit' });
    res.status(200).json({
        status: 'success',
        data: { depositHistory },
    });
});

exports.getWithdrawHistory = asyncWrapper(async (req, res, next) => {
    const userId = req.currentUser.id;
    const user = await User.findById(userId);
    if (!user) {
        const error = appError.create('User not found', 404, httpStatusText.FAIL);
        return next(error);
    }
    const withdrawHistory = await Payment.find({ userId, paymentType: 'withdraw' });
    res.status(200).json({
        status: 'success',
        data: { withdrawHistory },
    });
});