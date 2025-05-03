const Property = require('../Models/propertyModel');
const Payment = require('../Models/paymentModel');
const catchAsync = require('../utils/catchAsync');
const User = require('../Models/userModel');
const appError = require('../utils/appError');
const Returns = require("../Models/returnsModel");
const Investment = require("../Models/investmentModel");
const mongoose = require("mongoose");
//For properties
exports.getAllProperties = catchAsync(async(req,res,next)=>{
  const properties = await Property.find({});
  if (!properties) {
    return next(appError('No properties found', 404));
  }
  res.status(200).json({
    status:'success',
    results: properties.length,
    data: properties
  })
})


exports.getPropertyById = catchAsync(async (req, res,next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid property ID', 400));
  }
  const property = await Property.findById(req.params.id);
  if (!property) {
    return next (appError('Property not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: property
  });
})

exports.createProperty = catchAsync(async (req, res) => {
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
  const titleExist = await Property.findOne({ title: title });
  if (titleExist) {
    return res.status(400).json({ status: 'fail', message: 'Property Title already exists' });
  }
  const requiredFields = [
    'title', 'description', 'city', 'size', 'numOfRooms', 'images', 'totalShares',
    'availableShares', 'price', 'pricePerShare', 'benefits', 'status', 'investmentDocs'
  ];

  const missingFields = requiredFields.filter(field => !req.body[field]);

  if (missingFields.length > 0) {
    return res.status(400).json({
      status: 'fail',
      message: `Missing required fields: ${missingFields.join(', ')}`,
    });
  }

  if (size <= 0 || numOfRooms <= 0 || totalShares <= 0 || availableShares < 0 || yearlyPayment <= 0 || benefits < 0) {
    return res.status(400).json({
      status: 'fail',
      message: 'Numeric values must be positive',
    });
  }

  const validStatuses = ['Available', 'Funded', 'Exited'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      status: 'fail',
      message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
    });
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
    status,
    investmentDocs
  });

  await newProperty.save();
  res.status(201).json({
    status: 'success',
    data: newProperty
  });
}
);



exports.updateProperty = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid property ID', 400));
  }
  const property = await Property.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true },
  );
  if (!property) {
    return next(appError('Property not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: property
  });
})


exports.deleteProperty = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid property ID', 400));
  }
  const property = await Property.findByIdAndDelete(req.params.id);
  if (!property) {
    return next(appError('Property not found', 404));
  }
  res.status(204).json({
    status: 'success',
    data: null
  });
})

//for payments

exports.getAllPayments = catchAsync(async (req, res, next) => {
  const payments = await Payment.find({});
  if (!payments) {
    return next(appError('No payments found', 404));
  }
  res.status(200).json({
    status:'success',
    results: payments.length,
    data: payments
  })
})

exports.getPaymentById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid payment ID', 400));
  }
  const payment = await Payment.findById(req.params.id);
  if (!payment) {
    return next(appError('Payment not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: payment
  });
})
// admin cant create a payment this is just for testing purposes
exports.createPayment = catchAsync(async (req, res,next) => {
  const newPayment = await Payment.create(req.body);
  res.status(201).json({
    status: 'success',
    data: newPayment
  })
})

exports.approvePayment = catchAsync(
  async (req, res, next) => {
    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { paymentStatus: 'paid' },
      { new: true, runValidators: true },
    );
    if (!payment)
      return next(appError('Payment not found', 404));
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
exports.getAllUsers = catchAsync(async (req, res, next) => {
  const users = await User.find({});
  if (!users) {
    return next(appError('No users found', 404));
  }
  res.status(200).json({
    status:'success',
    results: users.length,
    data: users
  })
})


exports.getUserById = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid user ID', 400));
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    return next(appError('User not found', 404));
  }
  res.status(200).json({
    status: 'success',
    data: user
  });
})

exports.getPropPrices = catchAsync(
  async (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return next(appError('Invalid property ID', 400));
    }
    const property = await Property.findById(req.params.id);
    if (!property) {
      return next(appError('Property not found', 404));
    }
    const price = await property.price
    res.status(200).json({
      status: 'success',
      data: {
        price,
      },
    });
  },
);


//for Users
exports.banUser = catchAsync(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid user ID', 400));
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { activity: 'Banned' },
    { new: true, runValidators: true },
  );
  if (!user)
    return next(appError('User not found', 404));
  res.status(200).json({
    status: 'success',
    data: {
      user,
    },
  });

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
    status: 'success',
    data: {
      user,
    },
  });
});
// for investments 


exports.getAllInvestments = catchAsync(async (req, res, next) => {
  const investments = await Investment.find({});
  if (!investments) {
    return next(appError('No investments found', 404));
  }
  
  res.status(200).json({
    status:'success',
    results: investments.length,
    data: investments
  })
})

exports.getAllInvestmentsOnProperty = catchAsync(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return next(appError('Invalid property ID', 400));
  }
  const investments = await Investment.find({ propertyId: req.params.id });
  
  if (!investments) {
    return res.status(404).json({ message: 'Investments not found' });
  }

  res.status(200).json({
    status:'success',
    results: investments.length,
    data: investments
  })
})

exports.getAllUsersInvestedOnProperty= catchAsync(async (req, res,next) => {
  const investments = await Investment.find({ propertyId: req.params.id });
  const users = await User.find({ _id: { $in: investments.map(investment => investment.userId) } });
  if (!investments ||!users) {
    return next(appError('No investments or users found', 404));
  }
  res.status(200).json({
    status:'success',
    results: users.length,
    data: users
  })
})


