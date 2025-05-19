const express = require('express');
const investmentController = require('../Controllers/investmentController');
const {
  verifyToken,
} = require('../Middlewares/verifyToken');

const router = express.Router();

router
  .route('/:id')
  .post(verifyToken, investmentController.makeInvestment);
router
  .route('/:id')
  .get(verifyToken, investmentController.getInvestmentById);
router
  .route('/:id/property')
  .get(
    verifyToken,
    investmentController.getInvestmentProperty,
  );
router
  .route('/')
  .get(
    verifyToken,
    investmentController.getAllMyInvestments,
  );
router
  .route('/:id/returns')
  .get(
    verifyToken,
    investmentController.getMyreturnsOnInvestment,
  );

module.exports = router;

