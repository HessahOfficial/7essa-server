const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
require('../Config/passport');

const User = require('../Models/userModel');
const Token = require('../Models/tokenModel');
const mongoose = require('mongoose');

const dotenv = require('dotenv');
dotenv.config();

const {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} = require('../utils/jwt');

exports.signup = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  const { name, email, password, phoneNumber } = req.body;

  try {
    const existingUser = await User.findOne({
      email,
    }).session(session);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      phoneNumber,
    });

    await newUser.save({ session });

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    const newToken = new Token({
      userId: newUser._id,
      refreshToken,
    });

    await newToken.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      message: 'Sign up successful',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res
      .status(500)
      .json({ message: `Server error ${error.message}` });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .json({ message: 'Invalid credentials' });
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    );
    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json({ message: 'Invalid credentials' });
    }
    let tokenInDb = await Token.findOne({
      userId: user._id,
    });

    if (tokenInDb) {
      await Token.deleteOne({ userId: user._id });
    }

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    const newToken = new Token({
      userId: user._id,
      refreshToken,
    });

    await newToken.save();

    res.json({
      message: 'Sign in successful',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error.message);
    res
      .status(500)
      .json({ message: `Server error ${error.message}` });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      console.error('No refresh token provided');
      return res
        .status(400)
        .json({ message: 'Refresh token required' });
    }

    console.log('Received refresh token:', refreshToken);

    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
      console.log('Decoded refresh token:', decoded);
    } catch (err) {
      console.error('Error verifying refresh token:', err);
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
        error: err.message,
      });
    }

    // Step 3: Find the token in the database

    const tokenInDb = await Token.findOne({
      userId: decoded.id, // or decoded.userId if the decoded token has that field
      refreshToken,
    });

    if (!tokenInDb) {
      console.error('Token not found in database');
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
      });
    }

    console.log('Token found in database:', tokenInDb);

    // Step 4: Generate new access token
    const newAccessToken = generateAccessToken(
      decoded.userId,
    );
    console.log(
      'New access token generated:',
      newAccessToken,
    );

    // Step 5: Return the new access token
    res.json({ newAccessToken });
  } catch (error) {
    console.error('Error in refresh token process:', error);
    res.status(500).json({
      message:
        'An unexpected error occurred while processing the refresh token',
      error: error.message,
    });
  }
};
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken)
      return res
        .status(400)
        .json({ message: 'Refresh token required' });
    await Token.deleteOne({ refreshToken });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Controller function to initiate Google OAuth flow
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'], // Define the data you're requesting from Google
});

// Controller function to handle the Google callback
(exports.googleAuthCallback = passport.authenticate(
  'google',
  {
    failureRedirect: '/',
  },
)),
  (req, res) => {
    // Successfully authenticated
    res.send('You are logged in with Google!');
  };
