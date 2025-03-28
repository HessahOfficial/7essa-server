const Investment = require('../Models/investmentModel');
const catchAsync = require('../utils/catchAsync');
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const Property = require('../Models/propertyModel'); // FIXED: Capitalized the import
const { mongo } = require('mongoose');

exports.makeInvestment = catchAsync(async (req, res) => {
  const token = req.headers.authorization.split(" ")[1];
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET_ACCESS);
  const userId = decoded.id || decoded.userId;
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
    // const numOfShares = req.body.numberOfShares; 
    // const sharePrice = property.pricePerShare[property.pricePerShare.length - 1];
    // const returns = property.pricePerShare[property.pricePerShare.length-1]; 
    //total returns is the number of the property sold 
  }
});

exports.getInvestmentById = catchAsync(async (req, res) => {
    const investment = await Investment.findById(req.params.id);
    if (!investment) {
        return res.status(404).json({ message: "Investment not found" });
    }

    const property = await Property.findById(investment.propertyId);
    if (!property) {
        return res.status(404).json({ message: "Property not found" });
    }

    const sharePriceVariationPercentage = ((property.pricePerShare[property.pricePerShare.length - 1] - investment.SharePrice) / 100);
    res.status(200).json({ 
        investment: {
            ...investment.toObject(), 
            sharePriceVariationPercentage
        } 
    });
});
