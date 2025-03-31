const express = require('express');
const investmentController = require('../Controllers/investmentController');
const authMiddleware = require('../Middlewares/authMiddleware');
const router = express.Router();

router
  .route('/make-investment/:id')
  .post(authMiddleware.authenticateAccessToken,investmentController.makeInvestment);
  router.route('/getInvestment/:id').get(authMiddleware.authenticateAccessToken,investmentController.getInvestmentById);
  router.route('/:id/property').get(authMiddleware.authenticateAccessToken,investmentController.getInvestmentProperty);
  router.route('/getInvestments').get(authMiddleware.authenticateAccessToken,investmentController.getAllMyInvestments);

module.exports = router;
