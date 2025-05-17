const express = require('express');
const investmentController = require('../Controllers/investmentController');
const {
  verifyToken,
} = require('../Middlewares/verifyToken');

const router = express.Router();

router
  .route('/make-investment/:id')
  .post(verifyToken, investmentController.makeInvestment);
router
  .route('/getInvestment/:id')
  .get(verifyToken, investmentController.getInvestmentById);
router
  .route('/:id/property')
  .get(
    verifyToken,
    investmentController.getInvestmentProperty,
  );
router
  .route('/getInvestments')
  .get(
    verifyToken,
    investmentController.getAllMyInvestments,
  );
router
  .route('/getInvestmentReturn/:id')
  .get(
    verifyToken,
    investmentController.getMyreturnsOnInvestment,
  );

module.exports = router;

