const express = require('express');

const router = express.Router();
const { upload } = require('../Config/cloudinaryConfig');
const {
  updateUserById,
  updateUserRoleById,
  deleteUser,
  getUserFavourites,
  addUserFavourites,
  deleteUserFavourites,
  addAvatar,
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
const allowedTo = require('../Middlewares/allowedTo');
const userRoles = require('../utils/constants/userRoles');

router.route("/:userId/favourites/:propertyId")
  .post(allowedToSameUserAnd(), addUserFavourites);

router.route("/:userId/favourites")
  .get(allowedToSameUserAnd(), getUserFavourites)
  .delete(allowedToSameUserAnd(), deleteUserFavourites);


router.route("/balance/:userId")
  .post(allowedToSameUserAnd(), showBalance);

router.route("/pin/:userId")
  .post(allowedToSameUserAnd(), changePinCode);

router.route("/investor/:userId")
  .post(allowedToSameUserAnd(), becomeInvestor);

router.post(
  '/updateAvatar/:id',
  verifyToken,
  upload.single('avatar'),
  addAvatar,
);
router.route("/:userId")
  .get(verifyToken, allowedToSameUserAnd(userRoles.ADMIN), getUserInformation)
  .patch(verifyToken, allowedToSameUserAnd(userRoles.ADMIN), updateUserById);

router.route('/role/:userId')
  .patch(verifyToken, allowedTo(userRoles.ADMIN), updateUserRoleById)


router.delete('/:id', verifyToken, deleteUser);
router.post(
  '/notifyAll',
  verifyToken,
  sendPushNotificationToAll,
);
router.post('/notifyUser', sendPushNotificationToUser);

module.exports = router;

