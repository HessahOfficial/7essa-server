const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  role: { type: String, required: true },
  refreshToken: { type: String, required: true },
});

module.exports = mongoose.model('Token', tokenSchema);
