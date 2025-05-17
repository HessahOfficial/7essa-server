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
} = require('../Controllers/userController');
const {
  verifyToken,
} = require('../Middlewares/verifyToken');

router.get('/:id/favourites', getUserFavourites);
router.post(
  '/:id/favourites/:PropertyId',
  addUserFavourites,
);
router.delete(
  '/:id/favourites/:PropertyId',
  deleteUserFavourites,
);

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

