const {
    createPayment,
    getPaymentStatus,
    getHistory,
    deletePayment
} = require('../Controllers/paymentController');


const { authenticateAccessToken } = require("../Middlewares/authMiddleware")


const express = require('express');
const router = express.Router();

router.post('/create', authenticateAccessToken, createPayment);
router.get('/status/:id', getPaymentStatus);
router.get('/history/', authenticateAccessToken, getHistory);
router.delete('/:id', authenticateAccessToken, deletePayment);

module.exports = router;