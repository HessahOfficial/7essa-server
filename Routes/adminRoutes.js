const express = require('express');
const adminController = require('../Controllers/adminController');

const router = express.Router();
//properties
router
  .route('/properties')
  .post(adminController.createProperty)
  .get(adminController.getAllProperties);

router
  .route('/properties/:id')
  .get(adminController.getPropertyById)
  .patch(adminController.updateProperty)
  .delete(adminController.deleteProperty);

//payments
router
  .route('/payments')
  .get(adminController.getAllPayments)
  //again this just for testing purposes
  .post(adminController.createPayment);
router
  .route('/payments/:id')
  .get(adminController.getPaymentById);
router
  .route('/payments/approve/:id')
  .patch(adminController.approvePayment);

router
  .route('/payments/decline/:id')
  .patch(adminController.declinePayment);

module.exports = router;
