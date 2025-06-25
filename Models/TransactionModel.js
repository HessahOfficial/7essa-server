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
    transactionType: {
        type: String,
        enum: ['investing', 'selling'],
        required: true,
    },
   
    transactionDate: {
        type: Date,
        default: Date.now,
    },
    amount: {
        type: Number,

    },
})
const Transaction = mongoose.model('Transaction', transactionSchema);
module.exports = Transaction;
