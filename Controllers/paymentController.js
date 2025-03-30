const Payment = require('../Models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const mongoose = require('mongoose');
const User = require('../Models/userModel');
const moment = require('moment-timezone');

const egyptTime = moment().tz('Africa/Cairo').format();

exports.createPayment = catchAsync(async (req, res) => {
    userId = req.user.id;
    const { amount, paymentMethod } = req.body;

    if (!userId || typeof userId !== 'string') {
        return res.status(400).json({ status: 'fail', message: 'User ID is required and must be a string' });
    }
    if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ status: 'fail', message: 'User ID is invalid' });
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
    }

    if (!amount || typeof amount !== 'number' || amount < 1000) {
        return res.status(400).json({ status: 'fail', message: 'Amount is required and must be at least 1000' });
    }

    const allowedPaymentMethods = ['instaPay', 'VodafoneCash', 'bankTransfer'];
    if (!paymentMethod || !allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
            status: 'fail',
            message: `Payment method is required and must be one of: ${allowedPaymentMethods.join(', ')}`,
        });
    }

    const newPayment = new Payment({
        userId,
        amount,
        paymentMethod,
        paymentDate: egyptTime,
    });

    await newPayment.save();

    res.status(201).json({
        status: 'success',
        data: { newPayment },
    });
});

exports.getPaymentStatus = catchAsync(async (req, res) => {

    paymentId = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({ status: 'fail', message: 'Payment ID is invalid' });
    }
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        return res.status(404).json({ status: 'fail', message: 'Payment not found' });
    }

    paymentstatus = payment.paymentStatus;
    res.status(200).json({
        status: 'success',
        data: {
            paymentstatus,
        },
    });

});

exports.getHistory = catchAsync(async (req, res) => {

    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json({ status: 'fail', message: 'User not found' });
    }
    const payments = await Payment.find({ userId });
    res.status(200).json({
        status: 'success',
        data: {
            payments,
        },
    });



});



exports.deletePayment = catchAsync(async (req, res) => {
    const paymentId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
        return res.status(400).json({ status: 'fail', message: 'Invalid Payment ID format' });
    }
    const payment = await Payment.findById(paymentId);
    if (!payment) {
        return res.status(404).json({ status: 'fail', message: 'Payment not found' });
    }
    if (payment.userId.toString() !== req.user.id) {
        return res.status(403).json({ status: 'fail', message: 'Unauthorized to delete this payment' });
    }
    await Payment.findByIdAndDelete(paymentId);

    res.status(200).json({ status: 'success', data: " Request Deleted Sucessfully" });
});