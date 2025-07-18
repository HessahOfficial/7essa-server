const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const User = require('../Models/userModel');
const appError = require('../utils/appError');
const Investment = require("../Models/investmentModel");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const validator = require('validator');
const httpStatusText = require('../utils/constants/httpStatusText');
const USER_ACTIVITY = require('../utils/constants/USER_ACTIVITY');
const userRoles = require('../utils/constants/userRoles');

const fs = require('fs');

//For properties
exports.getAllProperties = asyncWrapper(async (req, res, next) => {
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

exports.getPropertyById = asyncWrapper(async (req, res, next) => {
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
  const ownerId = req.currentUser.id;
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
    images: req.files?.map(file => file.path) || req.body.images || [],
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
  const propertyId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(propertyId)) {
    return next(appError.create('Invalid property ID', 400, httpStatusText.FAIL));
  }

  const property = await Property.findById(propertyId);
  if (!property) {
    return next(appError.create('Property not found', 404, httpStatusText.FAIL));
  }

  const {
    title,
    description,
    city,
    locationLink,
    size,
    numOfRooms,
    totalShares,
    availableShares,
    yearlyPayment,
    price,
    pricePerShare,
    estimatedExitDate,
    isRented,
    rentalName,
    rentalIncome,
    rentalStartDate,
    rentalEndDate,
    managementCompany,
    status,
    investmentDocs,
    benefits,
    removedImages,
  } = req.body;


  Object.assign(property, {
    title,
    description,
    city,
    locationLink,
    size,
    numOfRooms,
    totalShares,
    availableShares,
    yearlyPayment,
    price,
    pricePerShare,
    estimatedExitDate: estimatedExitDate ? new Date(estimatedExitDate) : property.estimatedExitDate,
    isRented,
    rentalName,
    rentalIncome,
    rentalStartDate: rentalStartDate ? new Date(rentalStartDate) : property.rentalStartDate,
    rentalEndDate: rentalEndDate ? new Date(rentalEndDate) : property.rentalEndDate,
    managementCompany,
    status,
    investmentDocs,
    benefits: benefits ? JSON.parse(benefits) : property.benefits,
  });

  // Handle price history
  if (typeof price === 'number' && price !== property.price) {
    property.priceHistory.push({ price });
  }
  if (typeof pricePerShare === 'number' && pricePerShare !== property.pricePerShare) {
    property.pricePerShareHistory.push({ pricePerShare });
  }

  // Handle image updates
  if (removedImages) {
    const imagesToRemove = JSON.parse(removedImages);
    property.images = property.images.filter(image => !imagesToRemove.includes(image));
    imagesToRemove.forEach(image => {
      try {
        fs.unlinkSync(image); // Remove image from server
      } catch (err) {
        console.error(`Failed to delete image: ${image}`, err);
      }
    });
  }

  if (req.files && req.files.length > 0) {
    const newImages = req.files.map(file => file.path);
    property.images.push(...newImages);
  }

  await property.save();

  res.status(200).json({
    status: 'success',
    data: property,
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
  const query = req.query;
  const limit = parseInt(query.limit) || 12;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  const userId = query.userId || '';
  const search = query.search || '';
  const paymentType = query.paymentType || '';
  const paymentStatus = query.paymentStatus || '';
  const paymentMethod = query.paymentMethod || '';
  const paymentDate = query.paymentDate || '';
  const minPaymentDate = query.minPaymentDate || '';
  const maxPaymentDate = query.maxPaymentDate || '';
  const sort = query.sort || '-paymentDate';

  const matchStage = {};

  // Filter based on role or passed userId
  if (req.currentUser.role !== userRoles.ADMIN) {
    matchStage.userId = new mongoose.Types.ObjectId(req.currentUser.id);
  } else if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (paymentType) matchStage.paymentType = paymentType;
  if (paymentStatus) matchStage.paymentStatus = paymentStatus;
  if (paymentMethod) matchStage.paymentMethod = paymentMethod;
  if (paymentDate) matchStage.paymentDate = new Date(paymentDate);
  if (minPaymentDate) matchStage.paymentDate = { $gte: new Date(minPaymentDate) };
  if (maxPaymentDate) matchStage.paymentDate = {
    ...(matchStage.paymentDate || {}),
    $lte: new Date(maxPaymentDate),
  };

  const searchFilter = search
    ? {
      $or: [
        {
          'user._id': mongoose.Types.ObjectId.isValid(search)
            ? new mongoose.Types.ObjectId(search)
            : null,
        },
        {
          $expr: {
            $regexMatch: {
              input: { $concat: ['$user.firstName', ' ', '$user.lastName'] },
              regex: search,
              options: 'i',
            },
          },
        },
      ],
    }
    : {};

  const aggregation = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        ...matchStage,
        ...(search ? searchFilter : {}),
      },
    },
    {
      $sort: {
        [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1,
      },
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        amount: 1,
        displayingAmount: 1,
        paymentType: 1,
        paymentMethod: 1,
        paymentDate: 1,
        paymentStatus: 1,
        screenshot: 1,
        userId: {
          avatar: '$user.avatar',
          firstName: '$user.firstName',
          lastName: '$user.lastName'
        }
      }
    }
  ];

  const payments = await Payment.aggregate(aggregation);

  const countAggregation = await Payment.aggregate([
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $match: {
        ...matchStage,
        ...(search ? searchFilter : {}),
      },
    },
    { $count: 'total' },
  ]);

  const totalPayments = countAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalPayments / limit);

  res.status(200).json({
    status: 'success',
    payments: payments.length,
    data: {
      payments,
      totalPayments,
      totalPages,
    },
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
    { $inc: { balance: payment.paymentType == "deposit" ? amount : -amount } },
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
  const query = req.query;

  // Pagination
  const limit = parseInt(query.limit) || 12;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  // Sorting
  const sort = query.sort || '-createdAt';

  // Filters
  const filters = {};

  if (query.userId) filters._id = query.userId;
  if (query.firstName) filters.firstName = { $regex: query.firstName, $options: 'i' };
  if (query.lastName) filters.lastName = { $regex: query.lastName, $options: 'i' };
  if (query.fullName) filters.fullName = { $regex: query.fullName, $options: 'i' };
  if (query.username) filters.username = { $regex: query.username, $options: 'i' };
  if (query.email) filters.email = { $regex: query.email, $options: 'i' };
  if (query.role) filters.role = query.role;
  if (query.activity) filters.activity = query.activity;
  if (query.emailVerified !== undefined) filters.emailVerified = query.emailVerified === 'true';
  if (query.ID_Verified !== undefined) filters.ID_Verified = query.ID_Verified === 'true';
  if (query.isInvestor !== undefined) filters.isInvestor = query.isInvestor === 'true';
  if (query.isOwner !== undefined) filters.isOwner = query.isOwner === 'true';
  if (query.balance !== undefined) filters.balance = query.balance;
  if (query.minBalance) filters.balance = { $gte: query.minBalance };
  if (query.maxBalance) filters.balance = { $lte: query.maxBalance };

  const users = await User.find(filters)
    .sort(sort)
    .skip(skip)
    .limit(limit);

  const totalUsers = await User.countDocuments(filters);
  const totalPages = Math.ceil(totalUsers / limit);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users,
      totalUsers,
      totalPages
    }
  });
});

exports.createUser = asyncWrapper(async (req, res, next) => {
  let {
    firstName,
    lastName,
    email,
    username,
    password,
    phoneNumber,
    role,
    emailVerified,
  } = req.body;
  if (!firstName || !lastName || !email || !username || !password) {
    const error = appError.create(
      "First Name, Last Name, Email, Username and Password are required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  email = email.toLowerCase();
  username = username.toLowerCase();

  let oldUser = await User.findOne({ email });
  if (oldUser) {
    const error = appError.create(
      "User already exists please change your email",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  oldUser = await User.findOne({ username });
  if (oldUser) {
    const error = appError.create(
      "User already exists please change your username",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (!validator.isEmail(email)) {
    const error = appError.create(
      "Email is not valid",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (!validator.isAlphanumeric(username)) {
    const error = appError.create(
      "Username is not valid",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (password.length < 8) {
    const error = appError.create(
      "Password must be at least 8 characters or long",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  if (phoneNumber && !validator.isMobilePhone(phoneNumber)) {
    const error = appError.create(
      "Phone Number is not valid",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    firstName,
    lastName,
    email,
    username,
    password: hashedPassword,
  });

  if (phoneNumber) {
    newUser.phoneNumber = phoneNumber;
  }

  if (role && userRoles[role]) {
    newUser.role = role;
  }

  newUser.lastLogin = new Date();

  if (emailVerified) {
    newUser.emailVerified = emailVerified;
  } else {
    newUser.emailVerified = false;
  }

  await newUser.save();
  const UserData = {
    id: newUser._id,
    firstName: newUser.firstName,
    lastName: newUser.lastName,
    email: newUser.email,
    username: newUser.username,
    role: newUser.role,
    avatar: newUser.avatar,
  };

  return res.json({
    status: httpStatusText.SUCCESS,
    data: { token: { refresh: null, access: null }, user: UserData },
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
    data: {
      user
    }
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
  };
  res.status(200).json({
    status: 'success',
    data: property.priceHistory
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

exports.refreshInvestmentPayments = asyncWrapper(async (req, res, next) => {
  const investments = await Investment.find({});
  if (!investments || investments.length === 0) {
    const error = appError.create('No investments found', 404, httpStatusText.FAIL);
    return next(error);
  }

  for (const investment of investments) {
    const property = await Property.findById(investment.propertyId);
    if (!property) continue;

    const user = await User.findById(investment.userId);
    if (!user) continue;

    const now = new Date();
    const lastPaymentDate = new Date(investment.lastPaymentDate);
    const nextPaymentDueDate = new Date(lastPaymentDate);
    nextPaymentDueDate.setMonth(nextPaymentDueDate.getMonth() + 1);
    if (now >= nextPaymentDueDate) {
      user.balance += investment.monthlyReturns;
      investment.lastPaymentDate = now;
      investment.totalReturns += investment.monthlyReturns;
      investment.netGains = investment.totalReturns - investment.investmentAmount;
      await user.save();
      await investment.save();
    }
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: 'Investment payments refreshed successfully',
  });
});

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

exports.getAllUsersInvestedOnProperty = asyncWrapper(async (req, res, next) => {
  const investments = await Investment.find({ propertyId: req.params.id });
  const users = await User.find({ _id: { $in: investments.map(investment => investment.userId) } });
  if (!investments || !users) {
    const error = appError.create('No investments or users found', 404, httpStatusText.FAIL);
    return next(error);
  }
  res.status(200).json({
    status: 'success',
    results: users.length,
    data: users
  });
});





