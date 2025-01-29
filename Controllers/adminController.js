const factory = require('./handlerFactory');
const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../Models/userModel');
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
    const userToUpdate = await User.findByIdAndUpdate(
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
    //send notification to the User to let hem know that the payment has been approved
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
    //send notification to the User to let him know that the payment has been declined
  },
);

//For Dashboard (Reports)
exports.getAllUsers = factory.getAll(User);

exports.getUserById = factory.getOne(User);

exports.getPropPrices = catchAsync(
  async (req, res, next) => {
    const property = await Property.findById(req.params.id);
    const price = await property.price
    res.status(200).json({
      status:'success',
      data: {
       price,
      },
    });
  },
);
//there is still getting all the users invested on a certain property waiting for the investments collection to be created

//for Users
exports.banUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { activity: 'Banned' },
    { new: true, runValidators: true },
  );
  if (!user)
    return next(new Error('User not found', 404));
  res.status(200).json({
    status:'success',
    data: {
      user,
    },
  });
  //send notification to the User to let him know that he has been banned
  //banned user can't login again until contacting the support team
})

exports.unbanUser = catchAsync(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { activity: 'active' },
    { new: true, runValidators: true },
  );
  if (!user)
    return next(new Error('User not found', 404));
  res.status(200).json({
    status:'success',
    data: {
      user,
    },
  });
  //send notification to the User to let him know that he has been unbanned and can now login again
  //active user can login again
})