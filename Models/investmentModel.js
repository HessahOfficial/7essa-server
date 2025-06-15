const mongoose = require('mongoose');
const INVESTMENT_STATUS = require('../utils/constants/INVESTMENT_STATUS');

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
  investmentStatus: {
    type: String,
    enum: Object.values(INVESTMENT_STATUS),
    default: INVESTMENT_STATUS.ACTIVE,
  },
  investmentDate: {
    type: Date,
    default: Date.now,
    required: [true, 'investment date is required'],
  },
  lastPaymentDate: {
    type: Date,
    default: Date.now,
    required: [true, 'last payment date is required'],
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

  displayingSharePrice: {
    type: Object,
  },
  totalSharesPersantage: {
    type: Number,
  },
  investmentAmount: {
    type: Number,
    required: [true, 'investment amount is required'],
  },
});

// You can Format the price above to EGP using the locale, style, and currency.
let EGPFormat = new Intl.NumberFormat("en-US", {
  // style: 'currency',   // Replace currency with the style you want.
  // currency: 'LE',      // Replace LE with the currency you want.
  maximumSignificantDigits: 3, // Maximum significant digits
});

investmentSchema.pre("save", function (next) {
  if (this.sharePrice) {
    const price = this.sharePrice;
    this.displayingSharePrice = {
      ar: `ج.م ${EGPFormat.format(price)}`,
      en: `${EGPFormat.format(price)} L.E`,
    };
  }
});

const Investment = mongoose.model(
  'Investment',
  investmentSchema,
);

module.exports = Investment;
