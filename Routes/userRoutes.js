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
    sendPushNotificationToUser
} = require('../Controllers/userController');
const { authenticateAccessToken, authenticateRefreshToken } = require('../Middlewares/authMiddleware');

router.route("/favourites")
    .get(getUserFavourites)
    .post(addUserFavourites)
    .delete(deleteUserFavourites);


router.patch(
    '/update-image/:id',
    upload.single('photo'),
    addImage,
);
router.patch(
    '/updateUser/:id',
    authenticateRefreshToken,
    updateUser,
);

router.delete('/:id', authenticateAccessToken, deleteUser);
router.post("/notifyAll", sendPushNotificationToAll);
router.post("/notifyUser", sendPushNotificationToUser);

module.exports = router;   
