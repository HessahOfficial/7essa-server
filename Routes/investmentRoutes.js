const express = require('express');
const investmentController = require('../Controllers/investmentController');
const router = express.Router();

router
  .route('/make-investment')
  .post(investmentController.makeInvestment);

module.exports = router;
