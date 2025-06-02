const express = require('express');

const router = express.Router();
const { upload } = require('../Config/cloudinaryConfig');
const {
  updateUser,
  deleteUser,
  getUserFavourites,
  addUserFavourites,
  deleteUserFavourites,
  addImage,
  sendPushNotificationToAll,
  sendPushNotificationToUser,
  getUserInformation,
  showBalance,
  changePinCode,
  becomeInvestor,
} = require('../Controllers/userController');
const {
  verifyToken,
} = require('../Middlewares/verifyToken');

const allowedToSameUserAnd = require("../Middlewares/allowedToSameUserAnd");

router.route("/:userId/favourites/:propertyId")
  .post(allowedToSameUserAnd(), addUserFavourites);

router.route("/:userId/favourites")
  .get(allowedToSameUserAnd(), getUserFavourites)
  .delete(allowedToSameUserAnd(), deleteUserFavourites);

router.route("/:userId")
  .get(allowedToSameUserAnd(), getUserInformation);

router.route("/balance/:userId")
  .post(allowedToSameUserAnd(), showBalance);

router.route("/pin/:userId")
  .post(allowedToSameUserAnd(), changePinCode);

router.route("/investor/:userId")
  .post(allowedToSameUserAnd(), becomeInvestor);

router.patch(
  '/update-image/:id',
  verifyToken,
  upload.single('photo'),
  addImage,
);
router.patch('/updateUser/:id', verifyToken, updateUser);

router.delete('/:id', verifyToken, deleteUser);
router.post(
  '/notifyAll',
  verifyToken,
  sendPushNotificationToAll,
);
router.post('/notifyUser', sendPushNotificationToUser);

module.exports = router;

