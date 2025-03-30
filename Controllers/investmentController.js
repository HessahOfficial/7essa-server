const Investment = require('../Models/investmentModel');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Property = require('../Models/propertyModel');
const { mongo } = require('mongoose');

exports.makeInvestment = catchAsync(async (req, res) => {
  const userId = req.user.id;
  const propertyId = req.params.id;
  const property = await Property.findById(propertyId);

  if (!property) {
    return res.status(404).json({ message: "Property not found" });
  }

  if (property.isRented) {
    const numOfShares = req.body.numberOfShares; 
    const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];
    const monthlyReturns = ((property.rentalIncome / property.totalShares) * numOfShares)*.6
    const annualReturns = monthlyReturns * 12;
    //all the money we transefferd to the user based on his investment on this property
    //make it zero until we make the payment controller
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
    res.status(201).json({
       investment: investment
    });
  } else {
     const numOfShares = req.body.numberOfShares; 
     const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];
     const netGains = property.priceSold-(sharePrice*numOfShares);
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
  res.status(201).json({
    investment: investment
 });
  }
});

exports.getInvestmentById = catchAsync(async (req, res) => {
    const investment = await Investment.findById(req.params.id);
    if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
    }
    if(req.user.id !== investment.user.id) {
      return res.status(403).json({ message: "Unauthorized to view this investment" });
    }

    const property = await Property.findById(investment.propertyId);
    if (!property) {
        return res.status(404).json({ message: "Property not found" });
    }
    if(!property.isRented){
    const updatedNetGains = property.priceSold - (investment.SharePrice * investment.numOfShares);
    investment.netGains = updatedNetGains;
    await investment.save();
    }
    const sharePriceVariationPercentage = ((property.pricePerShare[property.pricePerShare.length - 1] - investment.SharePrice) / 100);
    res.status(200).json({ 
        investment: {
            ...investment.toObject(), 
            sharePriceVariationPercentage
        } 
    });
  });

    exports.getInvestmentProperty = catchAsync(async (req, res) => {
      const investment = await Investment.findById(req.params.id);
      if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
      }
      const property = await Property.findById(investment.propertyId);
      if (!property) {
        return res.status(404).json({ message: "Property not found" });
      }
      res.status(200).json({
        property: property,
      });
    });
  
