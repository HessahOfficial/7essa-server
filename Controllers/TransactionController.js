
const mongoose = require("mongoose");
const Transaction = require("../Models/TransactionModel");
const Investment = require("../Models/investmentModel");
const appError = require('../utils/appError');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const httpStatusText = require('../utils/constants/httpStatusText');
const User = require('../Models/userModel');
const userRoles = require('../utils/constants/userRoles');
const Property = require('../Models/propertyModel');

// handle Transactions (APPROVE , REJECT ) only for admins
exports.handleTransactionStatus = asyncWrapper(async (req, res, next) => {
  const { id } = req.params; // transaction id
  const { action } = req.body; // 'approve' or 'reject'

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(appError.create('Invalid transaction ID', 400, httpStatusText.FAIL));
  }

  const transaction = await Transaction.findById(id);
  if (!transaction) {
    return next(appError.create('Transaction not found', 404, httpStatusText.FAIL));
  }

  if (transaction.status !== 'pending') {
    return next(appError.create('Transaction already handled', 400, httpStatusText.FAIL));
  }

  const investment = await Investment.findById(transaction.investmentId);
  if (!investment) {
    return next(appError.create('Associated investment not found', 404, httpStatusText.FAIL));
  }

  const user = await User.findById(transaction.userId);
  if (!user) {
    return next(appError.create('User not found', 404, httpStatusText.FAIL));
  }

  const property = await Property.findById(transaction.propertyId);
  if (!property) {
    return next(appError.create('Property not found', 404, httpStatusText.FAIL));
  }

  // -------------------------------------
  // 🟢 APPROVE
  // -------------------------------------
  if (action === 'approve') {
    const { numOfShares, totalAmount } = transaction;

    // Update user balance
    user.balance += totalAmount;
    await user.save();

    // Update property available shares
    property.availableShares += numOfShares;
    await property.save();

    // Update investment
    investment.investmentStatus = 'sold';
    await investment.save();

    // Update transaction status
    transaction.status = 'completed';
    await transaction.save();

    return res.status(200).json({
      status: 'success',
      message: 'Transaction approved successfully',
      data: { 
        transaction,
        investment,
        userBalance: user.balance,
        propertyAvailableShares: property.availableShares,
      },
    });
  }

  // -------------------------------------
  // 🔴 REJECT
  // -------------------------------------
  if (action === 'reject') {
    transaction.status = 'failed';
    await transaction.save();

    investment.investmentStatus = 'active';
    await investment.save();

    return res.status(200).json({
      status: 'success',
      message: 'Transaction rejected successfully',
      data: { 
        transaction,
        investment,
        userBalance: user.balance,
        propertyAvailableShares: property.availableShares,
      },
    });
  }

  return next(appError.create('Invalid action. Must be "approve" or "reject"', 400, httpStatusText.FAIL));
});

// Get all Transactions (Admin or User only ) inner handel
exports.getAllTransactions = asyncWrapper(async (req, res, next) => {
  const query = req.query;
  const limit = parseInt(query.limit) || 12;
  const page = parseInt(query.page) || 1;
  const skip = (page - 1) * limit;

  const {
    userId = '',
    investmentId = '',
    propertyId = '',
    transactionType = '',
    status = '',
    minAmount = '',
    maxAmount = '',
    startDate = '',
    endDate = '',
    sort = '-transactionDate'
  } = query;

  const matchStage = {};

  // Filter by role
  if (req.currentUser.role !== userRoles.ADMIN) {
    matchStage.userId = new mongoose.Types.ObjectId(req.currentUser.id);
  } else if (userId) {
    matchStage.userId = new mongoose.Types.ObjectId(userId);
  }

  if (investmentId) matchStage.investmentId = new mongoose.Types.ObjectId(investmentId);
  if (propertyId) matchStage.propertyId = new mongoose.Types.ObjectId(propertyId);
  if (transactionType) matchStage.transactionType = transactionType;
  if (status) matchStage.status = status;

  if (minAmount) matchStage.amount = { ...matchStage.amount, $gte: parseFloat(minAmount) };
  if (maxAmount) matchStage.amount = { ...matchStage.amount, $lte: parseFloat(maxAmount) };

  if (startDate) matchStage.transactionDate = { $gte: new Date(startDate) };
  if (endDate) matchStage.transactionDate = {
    ...matchStage.transactionDate,
    $lte: new Date(endDate)
  };

  const aggregation = [
    {
      $lookup: {
        from: 'users',
        localField: 'userId',
        foreignField: '_id',
        as: 'user'
      }
    },
    { $unwind: '$user' },
    {
      $lookup: {
        from: 'properties',
        localField: 'propertyId',
        foreignField: '_id',
        as: 'property'
      }
    },
    { $unwind: { path: '$property', preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: 'investments',
        localField: 'investmentId',
        foreignField: '_id',
        as: 'investment'
      }
    },
    { $unwind: { path: '$investment', preserveNullAndEmptyArrays: true } },
    { $match: matchStage },
    {
      $sort: {
        [sort.replace('-', '')]: sort.startsWith('-') ? -1 : 1
      }
    },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        _id: 1,
        transactionType: 1,
        status: 1,
        amount: 1,
        transactionDate: 1,
        numOfShares: 1,
        userId: {
          firstName: '$user.firstName',
          lastName: '$user.lastName',
          email: '$user.email',
          _id: '$user._id',
        },
        propertyId: {
          title: '$property.title',
          _id: '$property._id',
        },
        investmentId: {
          numOfShares: '$investment.numOfShares',
          investmentAmount: '$investment.investmentAmount',
          _id: '$user._id',
        }
      }
    }
  ];

  const transactions = await Transaction.aggregate(aggregation);

  const countAggregation = await Transaction.aggregate([
    ...aggregation.slice(0, aggregation.findIndex(el => el.$match !== undefined) + 1),
    { $count: 'total' }
  ]);

  const totalTransactions = countAggregation[0]?.total || 0;
  const totalPages = Math.ceil(totalTransactions / limit);

  res.status(200).json({
    status: 'success',
    transactions: transactions.length,
    data: {
      transactions,
      totalTransactions,
      totalPages,
    }
  });
});

// Get Transaction by ID
exports.getTransactionById = asyncWrapper(async (req, res, next) => {
  const { id } = req.params;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(appError.create('Invalid transaction ID', 400, httpStatusText.FAIL));
  }

  const transaction = await Transaction.findById(id)
    .populate('userId', '_id firstName lastName')
    .populate('propertyId', '_id title')
    .populate('investmentId', '_id numOfShares investmentAmount');

  if (!transaction) {
    return next(appError.create('Transaction not found', 404, httpStatusText.FAIL));
  }

  res.status(200).json({ status: 'success', data: { transaction } });
});
