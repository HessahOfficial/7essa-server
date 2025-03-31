const express = require('express');
const adminController = require('../Controllers/adminController');
const returnsController = require('../Controllers/returnsController');
const authMiddleware = require('../Middlewares/authMiddleware');
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

  //Dashboard(Reports)
  router.route('/dashboard/Users').get(adminController.getAllUsers);
  router.route('/dashboard/Users/:id').get(adminController.getUserById);  
  router.route('/dashboard/property/:id/prices').get(adminController.getPropPrices);

  //for Users
  router.route('/users/ban/:id').patch(adminController.banUser);
  router.route('/users/unban/:id').patch(adminController.unbanUser);

  //add payment to the returns 
  router.route('/payments/:id/returns').post(returnsController.addReturnPayment);

  //investments
  router.route('/getAllInvestments').get(adminController.getAllInvestments)
  router.route('/getAllPropertyInvestments/:id').get(adminController.getAllInvestmentsOnProperty);
  router.route('/getAllusersInvestedOnproperty/:id').get(adminController.getAllUsersInvestedOnProperty);
module.exports = router;
