const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
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
    requestType: {
        type: String,
        required: true,
    },
    requestDate: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
})
const Request = mongoose.model('Request', requestSchema);
module.exports = Request;