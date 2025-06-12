const User = require('../Models/userModel');
const validator = require('validator');
const mongoose = require('mongoose');
const admin = require('../Config/firebase');
const asyncWrapper = require('../Middlewares/asyncWrapper');
const appError = require('../utils/appError');
const httpStatusText = require('../utils/constants/httpStatusText');
const verifyNationalId = require('../utils/verifyNationalId');

exports.getUserFavourites = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: 'Invalid user ID format' });
    }

    const user = await User.findById(userId)
      .populate('favourites')
      .lean();
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    res.status(200).json({
      status: 'success',
      data: { favourites: user.favourites },
    });
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
      message: err.message,
    });
  }
};

exports.addUserFavourites = async (req, res) => {
  try {
    const { userId, propertyId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(userId) ||
      !mongoose.Types.ObjectId.isValid(propertyId)
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    if (user.favourites.includes(propertyId)) {
      return res
        .status(400)
        .json({ error: 'Property already in favourites' });
    }

    user.favourites.push(propertyId);
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'One property saved successfully!',
    });
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
      message: err.message,
    });
  }
};

exports.deleteUserFavourites = async (req, res) => {
  try {
    const { userId } = req.params;
    const { properties } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res
        .status(400)
        .json({ error: 'Invalid ID format' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    properties.forEach((propertyId) => {
      if (!mongoose.Types.ObjectId.isValid(propertyId)) {
        return res
          .status(400)
          .json({ error: 'Invalid Property ID format' });
      }

      if (!user.favourites.includes(propertyId)) {
        return res
          .status(400)
          .json({ error: 'Property not in favourites' });
      }
    });

    user.favourites = user.favourites.filter(
      (fav) => !properties.includes(fav._id.toString()),
    );
    await user.save();

    res.status(200).json({
      status: 'success',
      data: { favourites: user.favourites },
    });
  } catch (err) {
    res.status(500).json({
      error: 'Server error',
      message: err.message,
    });
  }
};

exports.addAvatar = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid user ID format' });
    }

    if (!req.file) {
      return res
        .status(400)
        .json({ error: 'No photo uploaded' });
    }

    const updatedUser = await exports.updateUserAvatar(
      id,
      req.file.path,
    );

    res.status(200).json({
      message: 'Photo uploaded successfully',
      user: updatedUser, // FIXME: Send Public UserData
    });
  } catch (error) {
    res.status(500).json({
      error: 'Photo upload failed',
      message: error.message,
    });
  }
};

exports.updateUserAvatar = async (userId, imageUrl) => {
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { avatar: imageUrl },
    { new: true },
  );

  if (!updatedUser) throw new Error('User not found');
  return updatedUser;
};

const escapeHtml = (str) =>
  str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid user ID format' });
    }

    const restrictedFields = [
      'password',
      '_id',
      'createdAt',
      'role',
      'balance',
      'emailVerified',
      'email'
    ];
    restrictedFields.forEach(
      (field) => delete updateData[field],
    );

    if (
      updateData.email &&
      !validator.isEmail(updateData.email)
    ) {
      return res
        .status(400)
        .json({ error: 'Invalid email format' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true },
    );
    await updatedUser.save();

    if (!updatedUser) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User updated successfully',
      user: updatedUser, // FIXME: Send Public UserData
    });
  } catch (error) {
    res
      .status(500)
      .send('Server error: ' + escapeHtml(error.message));
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: 'Invalid user ID format' });
    }

    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      return res
        .status(404)
        .json({ error: 'User not found' });
    }

    res.status(200).json({
      message: 'User deleted successfully',
      user: deletedUser, // FIXME: Send Public UserData
    });
  } catch (error) {
    res
      .status(500)
      .send('Server error: ' + escapeHtml(error.message));
  }
};

exports.sendPushNotificationToUser = async (req, res) => {
  try {
    const { token, title, body } = req.body;

    const message = {
      notification: {
        title: title,
        body: body,
      },
      token: token,
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({
      success: true,
      message: 'Notification sent!',
      response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error,
    });
  }
};
exports.sendPushNotificationToAll = async (req, res) => {
  try {
    const { title, body } = req.body;

    const message = {
      notification: {
        title: title,
        body: body,
      },
      topic: 'allUsers',
    };

    const response = await admin.messaging().send(message);
    res.status(200).json({
      success: true,
      message: 'Notification sent to all users!',
      response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send notification',
      error,
    });
  }
};

exports.getUserInformation = asyncWrapper(
  async (req, res, next) => {
    const { userId } = req.params;

    if (!userId) {
      const error = appError.create(
        'User id is required as a parameter!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = appError.create(
        'Invalid user Id  format!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const oldUser = await User.findById(userId);
    if (!oldUser) {
      const error = appError.create(
        'User not found!',
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const user = {
      username: oldUser.username,
      firstname: oldUser.firstName,
      lastname: oldUser.lastName,
      fullname: oldUser.fullName,
      phoneNumber: oldUser.phoneNumber,
      email: oldUser.email,
      avatar: oldUser.avatar,
    };

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: 'User info is retrieved successfully!',
      data: {
        user,
      },
    });
  },
);

exports.showBalance = asyncWrapper(
  async (req, res, next) => {
    const { userId } = req.params;
    const { pin } = req.body;

    if (!userId) {
      const error = appError.create(
        'User id is required as a parameter!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = appError.create(
        'Invalid user Id  format!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const oldUser = await User.findById(userId);
    if (!oldUser) {
      const error = appError.create(
        'User not found!',
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!pin) {
      const error = appError.create(
        'PIN Code id is required!',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (pin.toString().length != 6) {
      const error = appError.create(
        'PIN Code consists of 6 digits',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (oldUser.pin.toString() !== pin.toString()) {
      const error = appError.create(
        'Incorrect PIN Code!',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: 'Valid PIN Code!',
      data: {
        balance: oldUser.balance,
      },
    });
  },
);

exports.changePinCode = asyncWrapper(
  async (req, res, next) => {
    const { userId } = req.params;
    const { pin } = req.body;

    if (!userId) {
      const error = appError.create(
        'User id is required as a parameter!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = appError.create(
        'Invalid user Id format!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const oldUser = await User.findById(userId);
    if (!oldUser) {
      const error = appError.create(
        'User not found!',
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!pin) {
      const error = appError.create(
        'PIN Code id is required!',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (pin.toString().length != 6) {
      const error = appError.create(
        'PIN Code consists of 6 digits',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (oldUser.pin.toString() === pin.toString()) {
      const error = appError.create(
        'Similar to the old one. Try another PIN Code!',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    oldUser.pin = pin;

    await oldUser.save();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: 'PIN Code changed successfully!',
    });
  },
);

exports.becomeInvestor = asyncWrapper(
  async (req, res, next) => {
    const { userId } = req.params;
    const { nationalId } = req.body;

    if (!userId) {
      const error = appError.create(
        'User id is required as a parameter!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      const error = appError.create(
        'Invalid user Id format!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    const oldUser = await User.findById(userId);
    if (!oldUser) {
      const error = appError.create(
        'User not found!',
        404,
        httpStatusText.ERROR,
      );
      return next(error);
    }

    if (!nationalId) {
      const error = appError.create(
        'National ID is required!',
        400,
        httpStatusText.ERROR,
      );
      return next(error);
    }
    // use verifyNationalId
    const { isValid, error, userExteraInfo } =
      verifyNationalId(nationalId);

    if (!isValid) {
      const appErrorInstance = appError.create(
        error,
        400,
        httpStatusText.ERROR,
      );
      return next(appErrorInstance);
    }

    oldUser.nationalId = nationalId;
    oldUser.isInvestor = true;

    await oldUser.save();

    res.status(200).json({
      status: httpStatusText.SUCCESS,
      message: 'Congratulations. you ara an investor!',
      data: {
        user: {
          username: oldUser.username,
          phoneNumber: oldUser.phoneNumber,
          email: oldUser.email,
          avatar: oldUser.avatar,
          nationalId: oldUser.nationalId,
          isInvestor: oldUser.isInvestor,
          userExteraInfo,
        },
      },
    });
  },
);

