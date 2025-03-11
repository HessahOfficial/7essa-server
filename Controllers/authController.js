const bcrypt = require('bcryptjs');
const passport = require('passport');
const session = require('express-session');
const mongoose = require('mongoose');
const crypto = require('crypto');

const User = require('../Models/userModel');
const Token = require('../Models/tokenModel');

const dotenv = require('dotenv');
dotenv.config();
const sendEmail = require('../utils/email');
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

    const accessToken = generateAccessToken(
      newUser._id,
      newUser.role,
    );
    const refreshToken = generateRefreshToken(
      newUser._id,
      newUser._id,
      newUser.role,
    );

    const newToken = new Token({
      userId: newUser._id,
      refreshToken,
    });

    await newToken.save({ session });
    await session.commitTransaction();
    session.endSession();
    res.status(201).json({
      status: 'success',
      data: {
        message: 'Sign up successful',
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: `Server error ${error.message}`,
    });
  }
};

exports.signin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res
      .status(400)
      .json(
        { message: 'Email and password are required' },
        { data: null },
      );
  }
  try {
    const user = await User.findOne({ email }).select(
      '+password',
    );

    if (!user) {
      return res
        .status(400)
        .json(
          { message: 'Invalid credentials' },
          { data: null },
        );
    }
    if (!user.password) {
      return res
        .status(400)
        .json(
          { message: 'Invalid user data' },
          { data: null },
        );
    }

    const isPasswordCorrect = await bcrypt.compare(
      password,
      user.password,
    );

    if (!isPasswordCorrect) {
      return res
        .status(400)
        .json(
          { message: 'Invalid credentials' },
          { data: null },
        );
    }

    let tokenInDb = await Token.findOne({
      userId: user._id,
    });

    if (tokenInDb) {
      await Token.deleteOne({ userId: user._id });
    }

    const accessToken = generateAccessToken(
      user._id,
      user.role,
    );
    const refreshToken = generateRefreshToken(
      user._id,
      user.role,
    );

    if (!accessToken || !refreshToken) {
      return res.status(500).json({
        message: 'Token generation failed',
        data: null,
      });
    }

    const newToken = new Token({
      userId: user._id,
      refreshToken,
    });

    await newToken.save();

    res.json({
      status: 'success',
      data: {
        message: 'Sign in successful',
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    console.error('Error during sign-in:', error.message);
    res.status(500).json({
      status: 'error',
      message: `Server error: ${error.message}`,
    });
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

    const tokenInDb = await Token.findOne({
      userId: decoded.id,
      role: decoded.role,
      refreshToken,
    });

    if (!tokenInDb) {
      console.error('Token not found in database');
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
      });
    }

    console.log('Token found in database:', tokenInDb);

    const newAccessToken = generateAccessToken(
      decoded.userId,
      decoded.role,
    );
    console.log(
      'New access token generated:',
      newAccessToken,
    );

    res.json({
      status: 'success',
      data: {
        newAccessToken,
      },
    });
  } catch (error) {
    console.error('Error in refresh token process:', error);
    res.status(500).json({
      status: 'error',
      message:
        'An unexpected error occurred while processing the refresh token',
      data: error.message,
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

    res.json({
      status: 'success',
      data: {
        message: 'Logged out successfully',
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: 'error',
      message: 'Server error',
    });
  }
};

// Initiates Google OAuth
exports.googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
});

exports.googleAuthCallback = async (req, res, next) => {
  passport.authenticate(
    'google',
    { failureRedirect: '/' },
    async (err, user, info) => {
      if (err) {
        console.error('Google Auth Error:', err);
        return next(err);
      }
      if (!user) {
        return res.redirect('/');
      }

      req.logIn(user, async (err) => {
        if (err) {
          console.error('Login Error:', err);
          return next(err);
        }

        const tokenInDb = await Token.findOne({
          userId: user._id,
        });
        if (tokenInDb) {
          await Token.deleteOne({ userId: user._id });
        }

        const accessToken = generateAccessToken(
          user._id,
          user.role,
        );
        const refreshToken = generateRefreshToken(
          user._id,
          user.role,
        );
        newToken = new Token({
          userId: user._id,
          role: user.role,
          refreshToken,
        });
        await newToken.save();
        res.json({
          status: 'success',
          data: {
            message: 'Google Auth successful',
            accessToken,
            refreshToken,
          },
        });
      });
    },
  )(req, res, next);
};

exports.forgetPassword = async (req, res) => {
  try {
    const user = await User.findOne({
      email: req.body.email,
    });
    if (!user) {
      return res
        .status(404)
        .json({ message: 'No user found with this email' });
    }

    const resetToken = user.createResetToken();
    await user.save({ validateBeforeSave: false });
    const resetURL = `${process.env.HOST_URL}/auth/reset-password?token=${resetToken}`;

    const resetEmailContent = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f4f4f4;
          color: #333;
          margin: 0;
          padding: 0;
        }
        .email-container {
          max-width: 600px;
          margin: 30px auto;
          padding: 20px;
          background-color: #ffffff;
          border-radius: 8px;
          box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .email-header {
          text-align: center;
          padding-bottom: 20px;
        }
        .email-header h1 {
          color: #4CAF50;
        }
        .email-body {
          font-size: 16px;
          line-height: 1.6;
        }
        .reset-link {
          font-size: 16px;
          font-weight: bold;
          color: #ffffff;
          display: inline-block;
          padding: 10px 20px;
          margin: 20px 0;
          background-color: #4CAF50;
          border-radius: 5px;
          text-decoration: none;
        }
        .footer {
          text-align: center;
          padding-top: 20px;
          font-size: 14px;
          color: #777;
        }
        .footer a {
          color: #4CAF50;
          text-decoration: none;
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="email-header">
          <h1>Password Reset Request</h1>
        </div>
        <div class="email-body">
          <p>Hi ${user.name},</p>
          <p>We received a request to reset your password. You can reset your password by clicking the link below:</p>
           <a class="reset-link" href="${resetURL}">Reset Your Password</a>
          <p>If you did not request a password reset, please ignore this email or contact our support team.</p>
          <p>The link is valid for only 10 minutes.</p>
        </div>
        <div class="footer">
          <p>Thank you for choosing us!</p>
          <p>If you have any questions, feel free to <a href="mailto:padeloteamcs@gmail.com">contact our support team</a>.</p>
        </div>
      </div>
    </body>
  </html>
`;

    await sendEmail({
      email: user.email,
      subject: 'Password Reset Request',
      html: resetEmailContent,
    });

    return res.status(200).json({
      status: 'success',
      data: {
        message: 'Email has been sent successfully',
      },
    });
  } catch (err) {
    console.error('Error sending email:', err);

    return res.status(500).json({
      status: 'error',
      message:
        'There was an error sending the email. Try again later.',
    });
  }
};
exports.ResetPassword = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: 'Token is required' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetexpires: { $gt: Date.now() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: 'Token is invalid or expired' });
    }

    user.password = await bcrypt.hash(
      req.body.password,
      10,
    );
    user.passwordResetToken = undefined;
    user.passwordResetexpires = undefined;
    await user.save();

    const tokenInDb = await Token.findOne({
      userId: user._id,
    });
    if (tokenInDb) {
      await Token.deleteOne({ userId: user._id });
    }

    const accessToken = generateAccessToken(
      user._id,
      user.role,
    );
    const refreshToken = generateRefreshToken(
      user._id,
      user.role,
    );
    newToken = new Token({
      userId: user._id,
      refreshToken,
    });
    await newToken.save();
    res.json({
      status: 'success',
      data: {
        message: 'Password reset successfully',
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Internal Server Error',
    });
  }
};

exports.validateResetToken = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ error: 'Token is required.' });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    console.log(hashedToken);
    if (!user) {
      return res
        .status(400)
        .json({ error: 'Invalid or expired token.' });
    }

    return res.status(200).json({
      status: 'success',
      data: {
        message:
          'Token is valid. You can reset your password.',
      },
    });
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Internal Server Error.',
    });
  }
};
