const {
  createPayment,
  getPaymentStatus,
  getHistory,
  deletePayment,
  getDepositHistory,
  getWithdrawHistory,
} = require('../Controllers/paymentController');
const { upload } = require('../Config/cloudinaryConfig')

const {
  verifyToken,
} = require('../Middlewares/verifyToken');

const express = require('express');
const router = express.Router();

router.post('/create', verifyToken, upload.single('screenshot'), createPayment);
router.get('/status/:id', getPaymentStatus);
router.get('/history/', verifyToken, getHistory);
router.delete('/:id', verifyToken, deletePayment);
router.get(
  '/getDepositHistory',
  verifyToken,
  getDepositHistory,
);
router.get(
  '/getWithdrawHistory',
  verifyToken,
  getWithdrawHistory,
);

module.exports = router;

