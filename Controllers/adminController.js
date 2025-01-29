const factory = require('./handlerFactory');
const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const user = require('../Models/userModel');
const appError = require('../utils/appError');
//For properties
exports.getAllProperties = factory.getAll(Property);

exports.getPropertyById = factory.getOne(Property);

exports.createProperty = factory.createOne(Property);

exports.updateProperty = factory.UpdateOne(Property);

exports.deleteProperty = factory.deleteOne(Property);

//for payments
exports.getAllPayments = factory.getAll(Payment);

exports.getPaymentById = factory.getOne(Payment);
// admin cant create a payment this is just for testing purposes
exports.createPayment = factory.createOne(Payment);

exports.approvePayment = catchAsync(
  async (req, res, next) => {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid' },
      { new: true, runValidators: true },
    );
    if (!payment)
      return next(new Error('Payment not found', 404));
    const userId = payment.userId;
    const amount = payment.amount;
    const userToUpdate = await user.findByIdAndUpdate(
      userId,
      { $inc: { balance: amount } },
      { new: true, runValidators: true },
    );
    if (!userToUpdate)
      return next(new Error('User not found', 404));
    res.status(200).json({
      status: 'success',
      data: {
        payment,
      },
    });
    //send notification to the user to let hem know that the payment has been approved
  },
);
exports.declinePayment = catchAsync(
  async (req, res, next) => {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'declined' },
      { new: true, runValidators: true },
    );
    if (!payment)
      return next(new Error('Payment not found', 404));
    res.status(200).json({
      status: 'success',
      data: {
        payment,
      },
    });
    //send notification to the user to let him know that the payment has been declined
  },
);
