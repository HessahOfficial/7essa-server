const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const User = require('../Models/userModel');
const appError = require('../utils/appError');
const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const mongoose = require("mongoose");
const httpStatusText = require('../utils/constants/httpStatusText');
const USER_ACTIVITY = require('../utils/constants/USER_ACTIVITY');

//For properties
exports.getAllProperties = asyncWrapper(async(req,res,next)=>{
  const properties = await Property.find({});
  if (!properties) {
    const error = appError.create('No properties found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: properties.length,
    data: properties
  });
});

exports.getPropertyById = asyncWrapper(async (req, res,next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: property
  });
});

exports.createProperty = asyncWrapper(async (req, res, next) => {
  const {
    title,
    description,
    city,
    locationLink,
    size,
    numOfRooms,
    images,
    totalShares,
    availableShares,
    yearlyPayment,
    price,
    pricePerShare,
    estimatedExitDate,
    isRented,
    rentalIncome,
    rentalName,
    rentalStartDate,
    rentalEndDate,
    benefits,
    managementCompany,
    status,
    investmentDocs
  } = req.body;
  const ownerId = req.currentUser._id;
  if (!ownerId) {
    const error = appError.create('User not authenticated', 401, httpStatusText.FAIL);
    return next(error);
  }
  const owner = await User.findById(ownerId);
  if (!owner) {
    const error = appError.create('Owner not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  const titleExist = await Property.findOne({ title: title });
  if (titleExist) {
    const error = appError.create('Property Title already exists', 400, httpStatusText.FAIL);
    return next(error);
  }
  const requiredFields = [
    'title', 'description', 'city', 'size', 'numOfRooms', 'totalShares',
    'availableShares', 'price', 'pricePerShare', 'benefits', 'status', 'investmentDocs'
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    const error = appError.create(`Missing required fields: ${missingFields.join(', ')}`, 400, httpStatusText.FAIL);
    return next(error);
  }

  if (size <= 0 || numOfRooms <= 0 || totalShares <= 0 || availableShares < 0 || yearlyPayment <= 0 || benefits < 0) {
    const error = appError.create('Numeric values must be positive', 400, httpStatusText.FAIL);
    return next(error);
  }

  const validStatuses = ['Available', 'Funded', 'Exited'];
  if (!validStatuses.includes(status)) {
    const error = appError.create(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400, httpStatusText.FAIL);
    return next(error);
  }

  const newProperty = new Property({
    title,
    description,
    city,
    locationLink,
    size,
    numOfRooms,
    images,
    totalShares,
    availableShares,
    yearlyPayment,
    price,
    pricePerShare,
    estimatedExitDate,
    isRented: isRented || false,
    rentalIncome,
    rentalName,
    rentalStartDate,
    rentalEndDate,
    benefits,
    managementCompany,
    owner: ownerId,
    status,
    investmentDocs
  });

  await newProperty.save();
  res.status(201).json({
    status: 'success',
    data: newProperty
  });
});

exports.updateProperty = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: property
  });
});

exports.deleteProperty = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
});

//for payments
exports.getAllPayments = asyncWrapper(async (req, res, next) => {
  const payments = await Payment.find({});
  if (!payments) {
    const error = appError.create('No payments found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: payments.length,
    data: payments
  });
});

exports.getPaymentById = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid payment ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    const error = appError.create('Payment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: payment
  });
});

exports.createPayment = asyncWrapper(async (req, res, next) => {
  const newPayment = await Payment.create(req.body);
  res.status(201).json({
    status: 'success',
    data: newPayment
  });
});

exports.approvePayment = asyncWrapper(async (req, res, next) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: 'paid' },
    { new: true, runValidators: true },
  );
  if (!payment) {
    const error = appError.create('Payment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  const userId = payment.userId;
  const amount = payment.amount;
  const userToUpdate = await User.findByIdAndUpdate(
    userId,
    { $inc: { balance: amount } },
    { new: true, runValidators: true },
  );
  if (!userToUpdate) {
    const error = appError.create('User not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: { payment },
  });
  //send notification to the User to let hem know that the payment has been approved
});

exports.declinePayment = asyncWrapper(async (req, res, next) => {
  const payment = await Payment.findByIdAndUpdate(
    req.params.id,
    { paymentStatus: 'declined' },
    { new: true, runValidators: true },
  );
  if (!payment) {
    const error = appError.create('Payment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: { payment },
  });
  //send notification to the User to let him know that the payment has been declined
});

//For Dashboard (Reports)
exports.getAllUsers = asyncWrapper(async (req, res, next) => {
  const users = await User.find({});
  if (!users) {
    const error = appError.create('No users found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  });
});

exports.getUserById = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid user ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    const error = appError.create('User not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: user
  });
});

exports.getUserByEmail = asyncWrapper(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    const user = await User.findOne({ email });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({
        status: 'success',
        data: { user }
    });
});

exports.getPropPrices = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  const price = await property.price;
  res.status(200).json({
    status: 'success',
    data: { price },
  });
});

//for Users
exports.banUser = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid user ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { activity: USER_ACTIVITY.BANNED },
    { new: true, runValidators: true },
  );
  if (!user) {
    const error = appError.create('User not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

exports.unbanUser = asyncWrapper(async (req, res, next) => {
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { activity: USER_ACTIVITY.ACTIVE },
    { new: true, runValidators: true },
  );
  if (!user) {
    const error = appError.create('User not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    data: { user },
  });
});

// for investments 
exports.getAllInvestments = asyncWrapper(async (req, res, next) => {
  const investments = await Investment.find({});
  if (!investments) {
    const error = appError.create('No investments found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: investments.length,
    data: investments
  });
});

exports.getAllInvestmentsOnProperty = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const investments = await Investment.find({ propertyId: req.params.id });
  if (!investments) {
    const error = appError.create('Investments not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: investments.length,
    data: investments
  });
});

exports.getAllUsersInvestedOnProperty= asyncWrapper(async (req, res,next) => {
  const investments = await Investment.find({ propertyId: req.params.id });
  const users = await User.find({ _id: { $in: investments.map(investment => investment.userId) } });
  if (!investments ||!users) {
    const error = appError.create('No investments or users found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  });
});


