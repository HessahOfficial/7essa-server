const Investment = require('../Models/investmentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const Property = require('../Models/propertyModel');
const mongoose = require('mongoose');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');
const User = require('../Models/userModel');
const userRoles = require('../utils/constants/userRoles');
const Transaction = require('../Models/TransactionModel');


exports.makeInvestment = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const propertyId = req.params.id;

  const property = await Property.findById(propertyId);
  const user = await User.findById(userId);

  if (!property) {
    return next(appError.create('Property not found', 404, httpStatusText.FAIL));
  }

  const numOfShares = req.body.numberOfShares;
  const sharePrice = property.pricePerShare;

  if (numOfShares > property.availableShares) {
    return next(appError.create('Number of shares exceeds available shares', 400, httpStatusText.FAIL));
  }

  const investmentAmount = sharePrice * numOfShares;

  if (user.balance < investmentAmount) {
    return next(appError.create('Insufficient balance to make this investment', 400, httpStatusText.FAIL));
  }

  // ❗ ابحث عن استثمار نشط موجود فعلاً
  let investment = await Investment.findOne({
    userId,
    propertyId,
    investmentStatus: 'active',
  });

  // خصم الشيرز من العقار
  property.availableShares -= numOfShares;
  await property.save();

  const isRented = property.isRented;
  let monthlyReturns = 0;
  let annualReturns = 0;
  let netGains = 0;

  if (isRented) {
    monthlyReturns = (property.rentalIncome / property.totalShares) * numOfShares * 0.6;
    annualReturns = monthlyReturns * 12;
  } else {
    netGains = (property.priceSold || 0) - investmentAmount;
  }

  if (investment) {
    // ✅ تحديث الاستثمار الموجود
    investment.numOfShares += numOfShares;
    investment.investmentAmount += investmentAmount;
    investment.totalSharesPercentage = (investment.numOfShares / property.totalShares) * 100;
    investment.netGains += netGains;

    if (isRented) {
      investment.monthlyReturns += monthlyReturns;
      investment.annualReturns += annualReturns;
    }

    await investment.save();
  } else {
    // ✅ إنشاء استثمار جديد
    investment = await Investment.create({
      userId,
      propertyId,
      numOfShares,
      sharePrice,
      monthlyReturns,
      annualReturns,
      totalReturns: 0,
      netGains,
      totalSharesPercentage: (numOfShares / property.totalShares) * 100,
      investmentAmount,
      investmentStatus: 'active',
      investmentDate: new Date(),
    });
  }

  // خصم من رصيد المستخدم
  user.balance -= investmentAmount;
  await user.save();

  // إنشاء Transaction
  await Transaction.create({
    userId,
    investmentId: investment._id,
    propertyId,
    transactionType: 'investing',
    numOfShares,
    pricePerShareAtTransaction: sharePrice,
    totalAmount: investmentAmount,
    status: 'completed',
    netGain: netGains,
    transactionDate: new Date(),
  });

  return res.status(201).json({ investment });
});



exports.sellInvestment = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const investmentId = req.params.id;
  const { numOfSharesToSell } = req.body;

  if (!mongoose.Types.ObjectId.isValid(investmentId)) {
    return next(appError.create('Invalid investment ID', 400, httpStatusText.FAIL));
  }

  const investment = await Investment.findById(investmentId);
  if (!investment) {
    return next(appError.create('Investment not found', 404, httpStatusText.FAIL));
  }

  if (investment.userId.toString() !== userId) {
    return next(appError.create('You are not allowed to sell this investment', 403, httpStatusText.FAIL));
  }

  if (!numOfSharesToSell || numOfSharesToSell <= 0) {
    return next(appError.create('Please provide a valid number of shares to sell', 400, httpStatusText.FAIL));
  }

  if (numOfSharesToSell > investment.numOfShares) {
    return next(appError.create('You cannot sell more shares than you own', 400, httpStatusText.FAIL));
  }

  const property = await Property.findById(investment.propertyId);
  if (!property) {
    return next(appError.create('Property not found', 404, httpStatusText.FAIL));
  }

  const priceHistory = property.pricePerShareHistory;
  const latestSharePrice = priceHistory.length > 0
    ? priceHistory[priceHistory.length - 1].pricePerShare
    : property.pricePerShare;

  const sellingAmount = numOfSharesToSell * latestSharePrice;

  // ❌ لا تعدل على الاستثمار الآن، فقط أنشئ الترانزاكشن
  const transaction = await Transaction.create({
    userId,
    investmentId: investment._id,
    propertyId: investment.propertyId,
    transactionType: 'selling',
    numOfShares: numOfSharesToSell,
    pricePerShareAtTransaction: latestSharePrice,
    totalAmount: sellingAmount,
    netGain: investment.netGains,
    status: 'pending',
    transactionDate: new Date(),
  });

  return res.status(200).json({
    status: 'success',
    message: 'Selling request submitted. Awaiting admin confirmation.',
    transaction,
  });
});




exports.getInvestmentById = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid investment ID', 400, httpStatusText.FAIL);
    return next(error);
  }

  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }

  if (req.currentUser.id !== investment.userId.toString() && req.currentUser.role !== userRoles.ADMIN) {
    const error = appError.create('Unauthorized to view this investment', 403, httpStatusText.FAIL);
    return next(error);
  }

  const property = await Property.findById(investment.propertyId);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }

  const priceNumbers = property.pricePerShareHistory.map(entry => entry.pricePerShare);
  const latestPrice = priceNumbers.at(-1); 

  const sharePriceVariationPercentage = ((latestPrice - investment.sharePrice) / investment.sharePrice) * 100;

  return res.status(200).json({
    investment: {
      ...investment.toObject(),
      sharePriceVariationPercentage,
    },
  });
});


exports.deleteInvestmentById = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (req.currentUser.id !== investment.userId.toString() && req.currentUser.role !== userRoles.ADMIN) {
    const error = appError.create('Unauthorized to delete this investment', 403, httpStatusText.FAIL);
    return next(error);
  }

  await Investment.findByIdAndDelete(req.params.id);
  return res.status(200).json({ status: 'success', message: ' Request Deleted Sucessfully', data: investment });

});

exports.getInvestmentProperty = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid investment ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(investment.propertyId);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  return res.status(200).json({ property: property });
});

exports.getAllInvestments = asyncWrapper(async (req, res, next) => {
  const query = req.query;
  const limit = parseInt(query.limit) || 12;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  const userId = query.ownerId || '';
  const propertyName = query.propertyName || '';
  const sort = query.sort || '-createdAt';

  const numOfShares = query.numOfShares || '';
  const maxNumOfShares = query.maxNumOfShares || '';
  const minNumOfShares = query.minNumOfShares || '';
  const investmentStatus = query.investmentStatus || '';
  const investmentDate = query.investmentDate || '';
  const minInvestmentDate = query.minInvestmentDate || '';
  const maxInvestmentDate = query.maxInvestmentDate || '';

  const matchStage = {};

  // role check
  if (req.currentUser.role !== userRoles.ADMIN) {
    matchStage.userId = new mongoose.Types.ObjectId(req.currentUser.id);
  } else if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (numOfShares) matchStage.numOfShares = parseInt(numOfShares);
  if (minNumOfShares) matchStage.numOfShares = { ...matchStage.numOfShares, $gte: parseInt(minNumOfShares) };
  if (maxNumOfShares) matchStage.numOfShares = { ...matchStage.numOfShares, $lte: parseInt(maxNumOfShares) };

  if (investmentStatus) matchStage.investmentStatus = investmentStatus;
  if (investmentDate) matchStage.investmentDate = new Date(investmentDate);
  if (minInvestmentDate) matchStage.estimatedExitDate = { $gte: new Date(minInvestmentDate) };
  if (maxInvestmentDate) matchStage.estimatedExitDate = { ...matchStage.estimatedExitDate, $lte: new Date(maxInvestmentDate) };

  // Aggregation pipeline
  const aggregation = [
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property'
      }
    },
    { $unwind: '$property' },
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
        ...(propertyName ? { 'property.title': { $regex: propertyName, $options: 'i' } } : {})
      }
    },
    {
      $sort: {
        [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1
      }
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        investmentStatus: 1,
        investmentDate: 1,
        numOfShares: 1,
        sharePrice: 1,
        displayingSharePrice: 1,
        investmentAmount: 1,
        userId: {
          avatar: '$user.avatar',
          firstName: '$user.firstName',
          lastName: '$user.lastName'
        },
        propertyId: {
          title: '$property.title',
          images: '$property.images',
          id: '$property._id'
        }
      }
    }
  ];

  const investments = await Investment.aggregate(aggregation);

  const countAggregation = await Investment.aggregate([
    ...aggregation.slice(0, 6), // Up to and including $match
    { $count: 'total' }
  ]);

  const totalInvestments = countAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalInvestments / limit);

  res.status(200).json({
    status: 'success',
    investments: investments.length,
    data: {
      investments,
      totalInvestments,
      totalPages,
    },
  });
});

exports.getMyreturnsOnInvestment = asyncWrapper(async (req, res, next) => {
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (req.currentUser.id !== investment.userId.toString() && req.currentUser.role !== userRoles.ADMIN) {
    const error = appError.create('Unauthorized to view this investment', 403, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(investment.propertyId);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (!property.isRented) {
    return res.status(200).json({
      totalReturns: investment.totalReturns,
      netGains: investment.netGains,
      totalSharesPercentage: investment.totalSharesPercentage,
    });
  } else {
    return res.status(200).json({
      totalReturns: investment.totalReturns,
      netGains: investment.netGains,
      monthlyReturns: investment.monthlyReturns,
      annualReturns: investment.annualReturns,
      totalSharesPercentage: investment.totalSharesPercentage,
    });
  }
});

