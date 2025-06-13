const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
  },
  numOfShares: {
    type: Number,
    required: [true, 'number of shares is required'],
  },
  status: {
    type: String,
    default: 'active',
    enum: ['active', 'canceled', 'finished'],
  },
  investmentDate: {
    type: Date,
    default: Date.now,
    required: [true, 'investment date is required'],
  },

  annualReturns: {
    default: 0,
    type: Number,
  },
  monthlyReturns: {
    default: 0,
    type: Number,
  },
  //ALL the money he got from the investment (+) only
  totalReturns: {
    type: Number,
    default: 0,
  },
  netGains: {
    type: Number,
  },
  sharePrice: {
    type: Number,
    required: [true, 'price per share is required'],
  },
  
  totalSharesPersantage: {
    type: Number,
  },
  investmentAmount: {
    type: Number,
    required: [true, 'investment amount is required'],
  },
});

const Investment = mongoose.model(
  'Investment',
  investmentSchema,
);

module.exports = Investment;
