
const express = require('express');
const router = express.Router();
const TransactionController = require('../Controllers/TransactionController');
const { verifyToken } = require('../Middlewares/verifyToken');
const allowedTo = require('../Middlewares/allowedTo');
const userRoles = require('../utils/constants/userRoles');

router.route('/')
    .get(verifyToken, TransactionController.getAllTransactions);

router.route('/:id')
    .get(verifyToken, TransactionController.getTransactionById);

router.route('/handle/:id')
    .patch(verifyToken, allowedTo(userRoles.ADMIN), TransactionController.handleTransactionStatus);

module.exports = router;
