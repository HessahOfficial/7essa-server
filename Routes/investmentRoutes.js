const express = require('express');
const investmentController = require('../Controllers/investmentController');
const router = express.Router();

router
  .route('/make-investment/:id')
  .post(investmentController.makeInvestment);
  router.route('/getInvestment/:id').get(investmentController.getInvestmentById);

module.exports = router;
