const Investment = require('../Models/investmentModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const Property = require('../Models/propertyModel');
const mongoose = require('mongoose');
const common = require('../utils/commonMethods');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');

exports.makeInvestment = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser.id;
  const propertyId = req.params.id;
  const property = await Property.findById(propertyId);

  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }

  if (property.isRented) {
    const numOfShares = req.body.numberOfShares;
    if (numOfShares > property.totalShares) {
      const error = appError.create('Number of shares exceeds total shares', 400, httpStatusText.FAIL);
      return next(error);
    }
    const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];
    const monthlyReturns = (property.rentalIncome / property.totalShares) * numOfShares * 0.6;
    const annualReturns = monthlyReturns * 12;
    const totalReturns = 0;
    const netGains = totalReturns - sharePrice;
    const totalSharesPercentage = (numOfShares / property.totalShares) * 100;
    const investmentAmount = sharePrice * numOfShares;

    const investment = await Investment.create({
      userId: userId,
      propertyId: req.params.id,
      numOfShares: numOfShares,
      SharePrice: sharePrice,
      monthlyReturns: monthlyReturns,
      annualReturns: annualReturns,
      netGains: netGains,
      totalSharesPercentage: totalSharesPercentage,
      investmentAmount: investmentAmount,
    });
    return res.status(201).json({ investment: investment });
  } else {
    const numOfShares = req.body.numberOfShares;
    const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];
    const netGains = property.priceSold - sharePrice * numOfShares;
    const investmentAmount = sharePrice * numOfShares;
    const totalSharesPercentage = (numOfShares / property.totalShares) * 100;
    const investment = await Investment.create({
      userId: userId,
      propertyId: req.params.id,
      numOfShares: numOfShares,
      SharePrice: sharePrice,
      netGains: netGains,
      totalSharesPercentage: totalSharesPercentage,
      investmentAmount: investmentAmount,
    });
    return res.status(201).json({ investment: investment });
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
  if (req.currentUser.id !== investment.userId.toString()) {
    const error = appError.create('Unauthorized to view this investment', 403, httpStatusText.FAIL);
    return next(error);
  }

  const property = await Property.findById(investment.propertyId);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (!property.isRented) {
    let updatedTotalReturns = (property.priceSold / property.totalShares) * investment.numOfShares;
    investment.totalReturns = updatedTotalReturns;
    const updatedNetGains = property.priceSold - investment.SharePrice * investment.numOfShares;
    investment.netGains = updatedNetGains;
    await investment.save();
  } else {
    const updatedTotalReturns = await common.calculateTotalReturns(investment._id);
    const updatedNetGains = updatedTotalReturns - investment.SharePrice;
    investment.totalReturns = updatedTotalReturns;
    investment.netGains = updatedNetGains;
    await investment.save();
  }

  const sharePriceVariationPercentage = ((property.pricePerShare[property.pricePerShare.length - 1] - investment.SharePrice) / 100);

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

exports.getAllMyInvestments = asyncWrapper(async (req, res, next) => {
  const investments = await Investment.find({ userId: req.currentUser.id });
  if (!investments) {
    const error = appError.create('No investments found', 404, httpStatusText.FAIL);
    return next(error);
  }
  return res.status(200).json({ investments: investments });
});

exports.getMyreturnsOnInvestment = asyncWrapper(async (req, res, next) => {
  const investment = await Investment.findById(req.params.id);
  if (!investment) {
    const error = appError.create('Investment not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (req.currentUser.id !== investment.userId.toString()) {
    const error = appError.create('Unauthorized to view this investment', 403, httpStatusText.FAIL);
    return next(error);
  }
  const property = await Property.findById(investment.propertyId);
  if (!property) {
    const error = appError.create('Property not found', 404, httpStatusText.FAIL);
    return next(error);
  }
  if (!property.isRented) {
    let updatedTotalReturns = (property.priceSold / property.totalShares) * investment.numOfShares;
    investment.totalReturns = updatedTotalReturns;
    const updatedNetGains = property.priceSold - investment.SharePrice * investment.numOfShares;
    investment.netGains = updatedNetGains;
    await investment.save();
    return res.status(200).json({
      totalReturns: investment.totalReturns,
      netGains: investment.netGains,
      totalSharesPercentage: investment.totalSharesPercentage,
    });
  } else {
    const updatedTotalReturns = await common.calculateTotalReturns(investment._id);
    const updatedNetGains = updatedTotalReturns - investment.SharePrice;
    investment.totalReturns = updatedTotalReturns;
    investment.netGains = updatedNetGains;
    await investment.save();
    return res.status(200).json({
      totalReturns: investment.totalReturns,
      netGains: investment.netGains,
      monthlyReturns: investment.monthlyReturns,
      annualReturns: investment.annualReturns,
      totalSharesPercentage: investment.totalSharesPercentage,
    });
  }
});

