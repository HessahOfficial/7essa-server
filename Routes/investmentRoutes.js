const express = require('express');
const investmentController = require('../Controllers/investmentController');
const {
  verifyToken,
} = require('../Middlewares/verifyToken');
const allowedTo = require('../Middlewares/allowedTo');
const userRoles = require('../utils/constants/userRoles');

const router = express.Router();

router
  .route('/:id')
  .post(verifyToken, investmentController.makeInvestment);
router
  .route('/:id')
  .get(verifyToken, investmentController.getInvestmentById)
  .delete(verifyToken, allowedTo(userRoles.ADMIN), investmentController.deleteInvestmentById);

router
  .route('/:id/property')
  .get(
    verifyToken,
    investmentController.getInvestmentProperty,
  );

router
  .route('/')
  .get(verifyToken, investmentController.getAllInvestments);

router
  .route('/:id/returns')
  .get(
    verifyToken,
    investmentController.getMyreturnsOnInvestment,
  );
  router.post('/:id/sell', verifyToken, investmentController.sellInvestment);

module.exports = router;

