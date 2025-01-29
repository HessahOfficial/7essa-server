const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  amount: {
    type: Number,
    required: [true, 'amount is required'],
  },
  paymentMethod: {
    type: String,
    required: [true, 'payment method is required'],
    enum: ['instaPay', 'VodafoneCash', 'bankTransfer'],
  },
  currency: {
    type: String,
    required: [true, 'currency is required'],
    enum: ['USD', 'EUR', 'EGP'],
  },
  paymentStatus: {
    type: String,
    default: 'pending', // initial status is pending until the payment is processed by the bank or payment gateway.
    enum: ['pending', 'paid', 'declined'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  },
  investmentAmount: {
    type: Number,
    required: [true, 'investment amount is required'],
  },
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
