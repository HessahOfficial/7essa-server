const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
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
  rentalIncome: {
    type: Number,
    required: [true, 'rental income is required'],
  },
  annualReturns: {
    type: Number,
    required: [true, 'annual returns are required'],
  },
  //ALL the money he got from the investment (+) only
  totalReturns: {
    type: Number,
    required: [true, 'total returns are required'],
  },
  netGains: {
    type: Number,
    required: [true, 'net gains are required'],
  },
  totalSharesPersantage: {
    type: Number,
    required: [true, 'total shares persantage is required'],
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
