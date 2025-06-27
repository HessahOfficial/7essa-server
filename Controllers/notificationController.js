const Notification = require('../Models/notificationModel');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');
const User = require('../Models/userModel');

// Create notification for one user
exports.sendNotification = asyncWrapper(async (req, res, next) => {
  const { userId,title, message, type, propertyId } = req.body;

  const notification = await Notification.create({
    userId,
    title,
    message,
    type,
    propertyId,
  });

  res.status(201).json({ status: 'success', data: notification });
});

// Create global notification for all users
exports.broadcastNotification = asyncWrapper(async (req, res, next) => {
  const { title, message, type, propertyId } = req.body;

  if (!title || !message) {
    return next(appError.create('Title and message are required', 400, httpStatusText.FAIL));
  }

  const users = await User.find({}, '_id'); // fetch all users' IDs

  const notifications = users.map(user => ({
    userId: user._id,
    title,
    message,
    type,
    propertyId,
  }));

  await Notification.insertMany(notifications);

  res.status(201).json({
    status: 'success',
    message: 'Broadcast sent to all users',
  });
});


// Get all notifications for current user
exports.getMyNotifications = asyncWrapper(async (req, res, next) => {
  const userId = req.currentUser?.id;

  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 });

  res.status(200).json({
    status: 'success',
    data: { notifications }
  });
});

// Mark notification as read
exports.markAsRead = asyncWrapper(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  );

  if (!notification) {
    return next(appError.create('Notification not found', 404, httpStatusText.FAIL));
  }

  res.status(200).json({ status: 'success', data: notification });
});
