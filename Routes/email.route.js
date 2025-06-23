const express = require('express');
const router = express.Router();
const ourMail = require("../Controllers/ourMail.controller");
const { verifyToken } = require('../Middlewares/verifyToken');
const allowedTo = require('../Middlewares/allowedTo');
const userRoles = require('../utils/constants/userRoles');
const emailLimiter = require('../Middlewares/emailLimiter');


router.route("/")
    .get(verifyToken, allowedTo(userRoles.ADMIN) ,ourMail.getAllOurMails)
    .post(verifyToken, emailLimiter , ourMail.createMail)

router.route("/:id")
    .get(verifyToken, allowedTo(userRoles.ADMIN) ,ourMail.getMailById)

router.patch("/:id/mark-as-read", verifyToken, allowedTo(userRoles.ADMIN), ourMail.markAsRead);
router.patch("/:id/answer", verifyToken, allowedTo(userRoles.ADMIN), ourMail.answerMail);


module.exports = router;
