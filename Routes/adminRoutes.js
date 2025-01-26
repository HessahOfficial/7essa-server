const express = require('express');
const adminController = require('../Controllers/adminController');

const router = express.Router();

router
  .route('/properties')
  .post(adminController.createProperty)
  .get(adminController.getAllProperties);

router
  .route('/properties/:id')
  .get(adminController.getPropertyById)
  .patch(adminController.updateProperty)
  .delete(adminController.deleteProperty);

module.exports = router;



