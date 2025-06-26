
const mongoose = require("mongoose");
const Transaction = require("../Models/TransactionModel");
const Investment = require("../Models/investmentModel");
const appError = require('../utils/appError');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const httpStatusText = require('../utils/constants/httpStatusText');

// Create Transaction
exports.createTransaction = asyncWrapper(async (req, res, next) => {
  const { userId, investmentId, transactionType } = req.body;

  if (!userId || !investmentId || !transactionType) {
    return next(appError.create('Missing required fields', 400, httpStatusText.FAIL));
  }

  const transaction = await Transaction.create({ userId, investmentId, transactionType });
  res.status(201).json({ status: 'success', data: { transaction } });
});

// Get all Transactions
exports.getAllTransactions = asyncWrapper(async (req, res, next) => {
  const transactions = await Transaction.find();
  res.status(200).json({ status: 'success', data: { transactions } });
});

// Get Transaction by ID
exports.getTransactionById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(appError.create('Invalid transaction ID', 400, httpStatusText.FAIL));
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    return next(appError.create('Transaction not found', 404, httpStatusText.FAIL));
  }

  res.status(200).json({ status: 'success', data: { transaction } });
});

// Delete Transaction by ID
exports.deleteTransactionById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(appError.create('Invalid transaction ID', 400, httpStatusText.FAIL));
  }

  const transaction = await Transaction.findByIdAndDelete(id);
  if (!transaction) {
    return next(appError.create('Transaction not found', 404, httpStatusText.FAIL));
  }

  res.status(200).json({ status: 'success', message: 'Transaction deleted successfully' });
});
