const Investment = require('../Models/investmentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const Property = require('../Models/propertyModel');
const mongoose = require('mongoose');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');
const User = require('../Models/userModel');
const userRoles = require('../utils/constants/userRoles');

exports.makeInvestment = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const propertyId = req.params.id;
  const property = await Property.findById(propertyId);
  const user = await User.findById(userId);

  if (!property) {
    return next(appError.create('Property not found', 404, httpStatusText.FAIL));
  }

  const numOfShares = req.body.numberOfShares;
  const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];

  if (numOfShares > property.availableShares) {
    return next(appError.create('Number of shares exceeds available shares', 400, httpStatusText.FAIL));
  }

  const investmentAmount = sharePrice * numOfShares;

  if (user.balance < investmentAmount) {
    return next(appError.create('Insufficient balance to make this investment', 400, httpStatusText.FAIL));
  }

  let existingInvestment = await Investment.findOne({ userId, propertyId });

  const updatedAvailableShares = property.availableShares - numOfShares;
  await Property.findByIdAndUpdate(propertyId, { availableShares: updatedAvailableShares });

  if (property.isRented) {
    const monthlyReturns = (property.rentalIncome / property.totalShares) * numOfShares * 0.6;
    const annualReturns = monthlyReturns * 12;
    const totalReturns = 0;
    const netGains = totalReturns - investmentAmount;
    const totalSharesPercentage = ((existingInvestment?.numOfShares || 0) + numOfShares) / property.totalShares * 100;

    if (existingInvestment) {
      existingInvestment.numOfShares += numOfShares;
      existingInvestment.investmentAmount += investmentAmount;
      existingInvestment.monthlyReturns += monthlyReturns;
      existingInvestment.annualReturns += annualReturns;
      existingInvestment.totalSharesPercentage = totalSharesPercentage;
      existingInvestment.netGains += netGains;
      await existingInvestment.save();

   
      user.balance -= investmentAmount;
      await user.save();

      return res.status(200).json({ investment: existingInvestment });
    } else {
      const investment = await Investment.create({
        userId,
        propertyId,
        numOfShares,
        sharePrice: sharePrice,
        monthlyReturns,
        annualReturns,
        netGains,
        totalSharesPercentage,
        investmentAmount,
      });

      user.balance -= investmentAmount;
      await user.save();

      return res.status(201).json({ investment });
    }

  } else {
    const netGains = property.priceSold - investmentAmount;
    const totalSharesPercentage = ((existingInvestment?.numOfShares || 0) + numOfShares) / property.totalShares * 100;

    if (existingInvestment) {
      existingInvestment.numOfShares += numOfShares;
      existingInvestment.investmentAmount += investmentAmount;
      existingInvestment.netGains += netGains;
      existingInvestment.totalSharesPercentage = totalSharesPercentage;
      await existingInvestment.save();

      user.balance -= investmentAmount;
      await user.save();

      return res.status(200).json({ investment: existingInvestment });
    } else {
      const investment = await Investment.create({
        userId,
        propertyId,
        numOfShares,
        sharePrice: sharePrice,
        netGains,
        totalSharesPercentage,
        investmentAmount,
      });

      
      user.balance -= investmentAmount;
      await user.save();

      return res.status(201).json({ investment });
    }
  }
});






exports.getInvestmentById = asyncWrapper(async (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    const error = appError.create('Invalid property ID', 400, httpStatusText.FAIL);
    return next(error);
  }
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (req.currentUser.id !== investment.userId.toString() && req.currentUser.role !== userRoles.ADMIN ) {
    const error = appError.create('Unauthorized to view this investment', 403, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(investment.propertyId);

  const sharePriceVariationPercentage = ((property.pricePerShare[property.pricePerShare.length - 1] - investment.sharePrice) / 100);

  return res.status(200).json({
    investment: {
      ...investment.toObject(),
      sharePriceVariationPercentage,
    },
  });
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
          title: '$property.title'
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

