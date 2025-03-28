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
    default: 'EGP',
  },
  paymentStatus: {
    type: String,
    default: 'pending',
    enum: ['pending', 'paid', 'declined'],
  },
  paymentDate: {
    type: Date,
    default: Date.now,
  }
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
