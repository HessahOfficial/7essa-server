const mongoose = require('mongoose');

const returnsSchema = new mongoose.Schema({
  investmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'investment',
    required: true,
  },
  paymentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'payment',
    required: true,
  },
  returnAmount: {
    type: Number,
    required: true,
  },
});
const returns = mongoose.model('returns', returnsSchema);

module.exports = returns;