const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Investment',
    required: true,
  },
  propertyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Property',
    required: true,
  },

  transactionType: {
    type: String,
    enum: ['investing', 'selling'],
    required: true,
  },

  numOfShares: {
    type: Number,
    required: true,
  },

  pricePerShareAtTransaction: {
    type: Number,
    required: true,
  },

  totalAmount: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'completed',
  },

  netGain: {
    type: Number,
    default: 0,
  },

  paymentMethod: {
    type: String,
    enum: ['instaPay', 'VodafoneCash', 'bankTransfer'],
  },

  adminNote: {
    type: String,
  },

  transactionDate: {
    type: Date,
    default: Date.now,
  },
});

const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
