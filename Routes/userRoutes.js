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

router.route("/:userId/favourites/:propertyId")
  .post(addUserFavourites);

router.route("/:userId/favourites")
  .get(getUserFavourites)
  .delete(deleteUserFavourites);

router.route("/:userId")
  .get(getUserInformation);

router.route("/balance/:userId")
  .post(showBalance);

router.route("/pin/:userId")
  .post(changePinCode);

router.route("/investor/:userId")
  .post(becomeInvestor);

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

