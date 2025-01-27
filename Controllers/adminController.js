const factory = require('./handlerFactory');
const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
//For properties
exports.getAllProperties = factory.getAll(Property);

exports.getPropertyById = factory.getOne(Property);

exports.createProperty = factory.createOne(Property);

exports.updateProperty = factory.UpdateOne(Property);

exports.deleteProperty = factory.deleteOne(Property);

//For payments

exports.getAllPayments = factory.getAll(Payment);

exports.getPaymentById = factory.getOne(Payment);

//admin can't create payment this is just fot adding payments
//for testing
exports.createPayment = factory.createOne(Payment);

exports.approvePayment = catchAsync(
  async (req, res, next) => {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid' },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { payment },
    });
    //send notifaction to the user to let hem know that the payment is done
  },
);
exports.declinePayment = catchAsync(
  async (req, res, next) => {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'declined' },
      {
        new: true,
        runValidators: true,
      },
    );
    if (!payment) {
      return next(new AppError('Payment not found', 404));
    }
    res.status(200).json({
      status: 'success',
      data: { payment },
    });
    //send notifaction to the user to let hem know that the payment is declined
  },
);
