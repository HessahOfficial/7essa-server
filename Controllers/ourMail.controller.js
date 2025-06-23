const asyncWrapper = require("../Middlewares/asyncWrapper");
const httpStatusText = require("../utils/constants/httpStatusText");
const appError = require("../utils/appError");
const validator = require("validator");
const OurEmail = require("../Models/mail.model");
const Email = require("../utils/email");

const createMail = asyncWrapper(async (req, res, next) => {
  const { fullName, email, phoneNumber, subject, messageBody } = req.body;
  
  if (!fullName) {
    const error = appError.create(
      "fullName is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!email) {
    const error = appError.create(
      "email is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!phoneNumber) {
    const error = appError.create(
      "phoneNumber is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!subject) {
    const error = appError.create(
      "subject is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  if (!messageBody) {
    const error = appError.create(
      "messageBody is required",
      400,
      httpStatusText.FAIL
    );
    return next(error);
  }
  // get the current user from the token
  const currentUser = req.currentUser;
  if (currentUser) {
    const { id } = currentUser;
    if (!validator.isMongoId(id)) {
      const error = appError.create("user id is not valid", 400, httpStatusText.FAIL);
      return next(error);
    }
  }
  if (!validator.isEmail(email)) {
    const error = appError.create("email is not valid", 400, httpStatusText.FAIL);
    return next(error);
  }
  
  const userId = req.currentUser ? req.currentUser.id : null;
  if (userId && !validator.isMongoId(userId)) {
    const error = appError.create("user id is not valid", 400, httpStatusText.FAIL);
    return next(error);
  }

  const emailData = {
    fullName, 
    email, 
    phoneNumber, 
    subject, 
    messageBody,
    userId
  };

  const data = await OurEmail.create(emailData);

  if (!data) {
    const error = appError.create("Mail not created", 400, httpStatusText.FAIL);
    return next(error);
  } else {
    // Send email to user
    const emailToUser = new Email({ email, fullName });
    await emailToUser.sendContactConfirmation({
      fullName,
      subject,
      messageBody
    });

    // Send email to admin
    const emailToAdmin = new Email({ email: process.env.ADMIN_EMAIL, firstName: "Admin" });
    await emailToAdmin.sendContactToAdmin({
      fullName,
      email,
      phoneNumber,
      subject,
      messageBody
    });

  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: data ,
  });
});

const getAllOurMails = asyncWrapper(async (req, res, next) => {
  const query = req.query;
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 14;
  const skip = (page - 1) * limit;
  const sort = query.sort || "-createdAt";
  const search = query.search || "";

  const Query = {
    $or: [
      { fullName: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { phoneNumber: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
      { messageBody: { $regex: search, $options: "i" } },
    ],
  };


  const OurMails = await OurEmail.find(Query).sort(sort).skip(skip).limit(limit);
  
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: OurMails,
  });
});

const getMailById = asyncWrapper(async (req, res, next) => {
  const mailId = req.params.id;

  if(!mailId){
    const error = appError.create("Mail id is required", 400, httpStatusText.FAIL);
    return next(error);
  }

  if(!validator.isMongoId(mailId)){
    const error = appError.create("Mail id is not valid", 400, httpStatusText.FAIL);
    return next(error);
  }

  const OurMail = await OurEmail.findById(mailId);

  if (!OurMail) {
    const error = appError.create("Mail not found", 404, httpStatusText.FAIL);
    return next(error);
  }

  OurMail.readed = true;
  OurMail.readedAt = new Date();
  
  // isAnswered
  if (req.body.isAnswered) {
    OurMail.isAnswered = req.body.isAnswered;
    OurMail.answeredAt = new Date();
    // answeredBy 
    const answeredBy = req.currentUser ? req.currentUser.id : null;
    if (answeredBy && !validator.isMongoId(answeredBy)) {
      const error = appError.create("user id is not valid", 400, httpStatusText.FAIL);
      return next(error);
    }
    OurMail.answeredBy = answeredBy;
  }
  await OurMail.save();
  if (!OurMail) {
    const error = appError.create("Mail not found", 404, httpStatusText.FAIL);
    return next(error);
  }


  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: OurMail,
  });
});

const answerMail = asyncWrapper(async (req, res, next) => {
  const mailId = req.params.id;
  const { isAnswered, answeredMessage } = req.body;

  if (!validator.isMongoId(mailId)) {
    return next(appError.create("Invalid mail ID", 400, httpStatusText.FAIL));
  }

  if (!isAnswered || typeof answeredMessage !== "string" || answeredMessage.trim().length < 10) {
    return next(appError.create("Answer message is required and must be at least 10 characters", 400, httpStatusText.FAIL));
  }

  const mail = await OurEmail.findById(mailId);
  if (!mail) {
    return next(appError.create("Mail not found", 404, httpStatusText.FAIL));
  }

  const adminId = req.currentUser?.id;
  if (!validator.isMongoId(adminId)) {
    return next(appError.create("Invalid admin ID", 400, httpStatusText.FAIL));
  }

  // Update DB
  mail.isAnswered = true;
  mail.answeredAt = new Date();
  mail.answeredBy = adminId;
  mail.answeredMessage = answeredMessage;

  await mail.save();

  // Send email to user with the answer
  const emailToUser = new Email({ email: mail.email, fullName: mail.fullName });
  await emailToUser.sendContactAnswerToUser({
    fullName: mail.fullName,
    subject: mail.subject,
    originalMessage: mail.messageBody,
    answeredMessage
  });

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    message: "Mail answered and user notified successfully",
    data: mail,
  });
});

const markAsRead = asyncWrapper(async (req, res, next) => {
  const mailId = req.params.id;

  if (!validator.isMongoId(mailId)) {
    return next(appError.create("Invalid mail ID", 400, httpStatusText.FAIL));
  }

  const mail = await OurEmail.findById(mailId);
  if (!mail) {
    return next(appError.create("Mail not found", 404, httpStatusText.FAIL));
  }

  if (!mail.readed) {
    mail.readed = true;
    mail.readedAt = new Date();
    await mail.save();
  }

  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: mail,
  });
});


module.exports = {
  createMail,
  getAllOurMails,
  getMailById,
  answerMail,
  markAsRead,
};
