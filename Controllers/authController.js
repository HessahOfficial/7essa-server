const dotenv = require('dotenv');
dotenv.config();

const bcrypt = require('bcryptjs');
const passport = require('passport');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const User = require('../Models/userModel');

const Email = require('../utils/email');
const appError = require('../utils/appError');
const generateJWT = require('../utils/generateJWT');
const httpStatusText = require('../utils/constants/httpStatusText');

const asyncWrapper = require('../Middlewares/asyncWrapper');

exports.signup = asyncWrapper(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  let {
    firstName,
    lastName,
    name,
    username,
    email,
    password,
    phoneNumber,
  } = req.body;

  if (
    !firstName ||
    !lastName ||
    !email ||
    !username ||
    !password
  ) {
    const error = appError.create(
      'First Name, Last Name, Email, Username and Password are required',
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  email = email.toLowerCase();
  username = username.toLowerCase();

  try {
    const existingUser = await User.findOne({
      email,
    }).session(session);
    if (existingUser) {
      return res
        .status(400)
        .json({ message: 'Email already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      firstName,
      lastName,
      name,
      email,
      password: hashedPassword,
      phoneNumber,
      username,
    });

    // make sure to set the default values for emailVerified and ID_Verified
    // to false when creating a new user
    newUser.emailVerified = false;
    newUser.ID_Verified = false;

    await newUser.save({ session });
    const accessToken = await generateJWT(
      {
        email: newUser.email,
        id: newUser.id,
        role: newUser.role,
        expiryTime: process.env.JWT_EXPIRES_IN_ACCESS,
      },
      process.env.JWT_EXPIRES_IN_ACCESS,
      process.env.JWT_SECRET_ACCESS,
    );

    const refreshToken = await generateJWT({
      email: newUser.email,
      id: newUser.id,
      expiryTime: process.env.JWT_EXPIRES_IN_REFRESH,
    });

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
});

/**
 * @desc signin
 * @route POST /auth/login
 * @access Public
 */
exports.signin = asyncWrapper(async (req, res, next) => {
  let { email, password, username } = req.body;

  if ((!email || !username) && !password) {
    const error = appError.create(
      'Email or Username and password are required',
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  if (email) {
    email = email.toLowerCase();
  }

  if (username) {
    username = username.toLowerCase();
  }

  let user = null;
  if (email && password) {
    user = await User.findOne({ email });
  } else if (username && password) {
    user = await User.findOne({ username });
  }

  if (!user) {
    const error = appError.create(
      'User not found please enter the correct email',
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }

  const matchedPassword = await bcrypt.compare(
    password,
    user.password,
  );

  // check if password is correct
  if (user && matchedPassword) {
    // logged in successfully
    user.lastLogin = new Date();
    const accessToken = await generateJWT(
      {
        email: user.email,
        id: user._id,
        role: user.role,
        expiryTime: process.env.JWT_EXPIRES_IN_ACCESS,
      },
      process.env.JWT_EXPIRES_IN_ACCESS,
      process.env.JWT_SECRET_ACCESS,
    );
    const refreshToken = await generateJWT(
      {
        email: user.email,
        id: user._id,
        expiryTime: process.env.JWT_EXPIRES_IN_REFRESH,
      },
      process.env.JWT_EXPIRES_IN_REFRESH,
    );

    // Create secure cookie with refresh token
    res.cookie('jwt', refreshToken, {
      httpOnly: true, // client-side js cannot access the cookie
      secure: process.env.NODE_ENV === 'production', // only send cookie over https
      sameSite: 'none', // only send cookie if the request is coming from the same origin
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });

    // check if user is banned
    if (user.isBanned) {
      const error = appError.create(
        'Your account is banned please contact the admin',
        403,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    // check if email is verified
    if (!user.emailVerified) {
      // send email verification token
      const emailVerificationToken = await generateJWT(
        {
          email: user.email,
          id: user._id,
          role: user.role,
        },
        '10min',
        process.env.EMAIL_VERIFICATION_SECRET,
      );
      const emailVerificationURL = `${process.env.FRONT_END_BASE_URL}/auth/verify-email/${emailVerificationToken}`;
      await new Email(
        user,
        emailVerificationURL,
      ).sendEmailVerification();
      // send error message to user to verify email first
      const error = appError.create(
        'Email is not verified please verify your email by clicking the link in your email inbox and login again',
        403,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    await user.save();

    const UserData = {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      username: user.username,
      role: user.role,
      avatar: user.avatar,
      isInvestor: user.isInvestor,
      favourites: user.favourites
    };

    return res.json({
      status: httpStatusText.SUCCESS,
      data: {
        refreshToken: refreshToken,
        accessToken: accessToken,
        user: UserData,
      },
    });
  } else {
    // password is not correct
    const error = appError.create(
      'Your password is not correct',
      403,
      httpStatusText.FAIL,
    );
    return next(error);
  }
});

/**
 * @desc Refresh token
 * @route GET /auth/refresh-token
 * @access Public - Because access token is expired
 */
exports.refreshToken = asyncWrapper(
  async (req, res, next) => {
    const { refreshToken } = req.body;
    jwt.verify(
      refreshToken,
      process.env.JWT_SECRET_REFRESH,
      asyncWrapper(async (err, user) => {
        if (err) {
          const error = appError.create(
            'Invalid refresh token',
            401,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        const foundUser = await User.findById(user.id);
        if (!foundUser) {
          const error = appError.create(
            'User not found',
            404,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        const accessToken = await generateJWT(
          {
            email: foundUser.email,
            id: foundUser.id,
            role: foundUser.role,
            expiryTime: process.env.JWT_EXPIRES_IN_ACCESS,
          },
          process.env.JWT_EXPIRES_IN_ACCESS,
          process.env.JWT_SECRET_ACCESS,
        );

        const refreshToken = await generateJWT({
          email: foundUser.email,
          id: foundUser.id,
          expiryTime: process.env.JWT_EXPIRES_IN_REFRESH,
        });
        const UserData = {
          id: foundUser._id,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          fullName: foundUser.fullName,
          email: foundUser.email,
          username: foundUser.username,
          phoneNumber: foundUser.phoneNumber,
          role: foundUser.role,
          avatar: foundUser.Image,
          isInvestor: foundUser.isInvestor,
        };
        res.json({
          data: {
            refreshToken: refreshToken,
            accessToken: accessToken,
            user: UserData,
          },
          status: httpStatusText.SUCCESS,
          message: 'Token refreshed successfully',
        });
      }),
    );
  },
);

/**
 * @desc Logout
 * @route POST /auth/logout
 * @access Public - json to clear the cookie if the user logged out
 */
exports.logout = asyncWrapper(async (req, res, next) => {
  const cookie = req.cookies;
  if (!cookie?.jwt) {
    return res.sendStatus(204); // No content
  }
  res.clearCookie('jwt', {
    httpOnly: true, // client-side js cannot access the cookie
    secure: process.env.NODE_ENV === 'production', // only send cookie over https
    sameSite: 'none', // only send cookie if the request is coming from the same origin
  });

  res.json({
    status: httpStatusText.SUCCESS,
    message: 'Logged out successfully',
  });
});

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

        const accessToken = await generateJWT(
          {
            email: user.email,
            id: user._id,
            role: user.role,
            expiryTime: process.env.JWT_EXPIRES_IN_ACCESS,
          },
          process.env.JWT_EXPIRES_IN_ACCESS,
          process.env.JWT_SECRET_ACCESS,
        );

        const refreshToken = await generateJWT({
          email: user.email,
          id: user._id,
          expiryTime: process.env.JWT_EXPIRES_IN_REFRESH,
        });

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

/**
 * @desc Forgot password
 * @route POST /auth/forgot-password
 * @access Public
 * @desc Send reset password token to user email
 * @desc Save reset password token to user document
 * @desc Send email to user with reset password link
 */

exports.forgetPassword = asyncWrapper(
  async (req, res, next) => {
    let { email } = req.body;
    if (!email) {
      const error = appError.create(
        'Email is required',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    email = email.toLowerCase();
    const user = await User.findOne({ email });
    if (!user) {
      const error = appError.create(
        'User not found',
        404,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // generate reset password token
    const resetPasswordToken = await generateJWT(
      { email: user.email, id: user._id, role: user.role },
      '10min',
      process.env.RESET_PASSWORD_SECRET,
    );

    const resetURL = `${process.env.FRONT_END_BASE_URL}/auth/reset-password/${resetPasswordToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    // save reset password token
    res
      .status(200)
      .json({ status: httpStatusText.SUCCESS, data: null });
  },
);

/**
 * @desc Reset password
 * @route POST /auth/reset-password
 * @access Public
 * @desc Verify reset password token
 * @desc Update user password
 * @desc Send email to user with password reset confirmation
 * @desc Save user document with new password
 * @desc Send email to user with password reset confirmation
 * @desc Send new access token to user
 * @desc Send new refresh token to user
 * @desc Create secure cookie with refresh token
 * @desc Return user document with new access token
 * @desc Return user document with new refresh token
 */
exports.ResetPassword = asyncWrapper(
  async (req, res, next) => {
    let { password, resetPasswordToken } = req.body;
    if (!password) {
      const error = appError.create(
        'Password is required',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    if (!resetPasswordToken) {
      const error = appError.create(
        'Token is required',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // verify token
    jwt.verify(
      resetPasswordToken,
      process.env.RESET_PASSWORD_SECRET,
      asyncWrapper(async (err, user) => {
        if (err) {
          const error = appError.create(
            'Invalid reset password token',
            401,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        const foundUser = await User.findById(user.id);
        if (!foundUser) {
          const error = appError.create(
            'User not found',
            404,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        // update password
        const hashedPassword = await bcrypt.hash(
          password,
          10,
        );
        foundUser.password = hashedPassword;
        await foundUser.save();
        res.status(200).json({
          status: httpStatusText.SUCCESS,
          data: { foundUser },
          message: 'Password reset successfully',
        });
      }),
    );
  },
);

const changeMyPassword = asyncWrapper(
  async (req, res, next) => {
    let { oldPassword, newPassword, confirmNewPassword } =
      req.body;

    if (
      !oldPassword ||
      !newPassword ||
      !confirmNewPassword
    ) {
      const error = appError.create(
        'old Password , new password and confirm new password are required',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }

    if (confirmNewPassword !== newPassword) {
      const error = appError.create(
        'New password and confirm new password must be the same',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    const user = await User.findById(req.currentUser.id);
    if (!user) {
      const error = appError.create(
        'User not found',
        404,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // check if new password is different from old password
    if (oldPassword === newPassword) {
      const error = appError.create(
        'New password must be different from old password',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // check if new password is strong
    if (newPassword.length < 8) {
      const error = appError.create(
        'Password must be at least 8 characters or long',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // check old password match
    const matchedPassword = await bcrypt.compare(
      oldPassword,
      user.password,
    );
    if (user && matchedPassword) {
      // update password
      const hashedPassword = await bcrypt.hash(
        newPassword,
        10,
      );
      user.password = hashedPassword;
      await user.save();
      res.status(200).json({
        status: httpStatusText.SUCCESS,
        data: { user },
        message: 'Password changed successfully',
      });
    } else {
      const error = appError.create(
        'Your old password is not correct',
        403,
        httpStatusText.FAIL,
      );
      return next(error);
    }
  },
);

/**
 * @desc Verify email
 * @route POST /auth/verify-email
 * @access Public
 * @desc Send email verification token to user email
 * @desc Save email verification token to user document
 * @desc Send email to user with email verification link
 * @desc Save user document with email verified true
 **/
const verifyEmail = asyncWrapper(async (req, res, next) => {
  let { email } = req.body;
  if (!email) {
    const error = appError.create(
      'Email is required',
      400,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  email = email.toLowerCase();
  const user = await User.findOne({ email });
  if (!user) {
    const error = appError.create(
      'User not found',
      404,
      httpStatusText.FAIL,
    );
    return next(error);
  }
  // generate email verification token
  const emailVerificationToken = await generateJWT(
    { email: user.email, id: user._id, role: user.role },
    '10min',
    process.env.EMAIL_VERIFICATION_SECRET,
  );

  const emailVerificationURL = `${process.env.FRONT_END_BASE_URL}/auth/verify-email/${emailVerificationToken}`;
  await new Email(
    user,
    emailVerificationURL,
  ).sendEmailVerification();

  // save email verification token
  res.status(200).json({
    status: httpStatusText.SUCCESS,
    data: null,
    message: 'Email verification token sent successfully',
  });
});

/**
 * @desc Confirm email
 * @route POST /auth/confirm-email
 * @access Public
 * @desc Verify email verification token
 * @desc Update user emailVerified to true
 * @desc Return user document with emailVerified true
 * @desc Send email to user with email verified confirmation
 **/
const confirmEmail = asyncWrapper(
  async (req, res, next) => {
    let { emailVerificationToken } = req.body;
    if (!emailVerificationToken) {
      const error = appError.create(
        'Token is required',
        400,
        httpStatusText.FAIL,
      );
      return next(error);
    }
    // verify token
    jwt.verify(
      emailVerificationToken,
      process.env.EMAIL_VERIFICATION_SECRET,
      asyncWrapper(async (err, user) => {
        if (err) {
          const error = appError.create(
            'Invalid email verification token',
            401,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        const foundUser = await User.findById(user.id);
        if (!foundUser) {
          const error = appError.create(
            'User not found',
            404,
            httpStatusText.FAIL,
          );
          return next(error);
        }
        foundUser.emailVerified = true;
        await foundUser.save();
        // generate JWT token
        const accessToken = await generateJWT(
          {
            email: foundUser.email,
            username: foundUser.username,
            id: foundUser._id,
            role: foundUser.role,
            expiryTime: process.env.JWT_EXPIRES_IN_ACCESS,
          },
          process.env.JWT_EXPIRES_IN_ACCESS,
          process.env.JWT_SECRET_ACCESS,
        );

        const refreshToken = await generateJWT({
          email: foundUser.email,
          id: foundUser._id,
          expiryTime: process.env.JWT_EXPIRES_IN_REFRESH,
        });

        const UserData = {
          id: foundUser._id,
          firstName: foundUser.firstName,
          lastName: foundUser.lastName,
          fullName: foundUser.fullName,
          email: foundUser.email,
          username: foundUser.username,
          phoneNumber: foundUser.phoneNumber,
          role: foundUser.role,
          avatar: foundUser.Image,
          isInvestor: foundUser.isInvestor,
        };

        res.status(200).json({
          status: httpStatusText.SUCCESS,
          data: {
            token: {
              refresh: refreshToken,
              access: accessToken,
            },
            user: UserData,
          },
          message: 'Email verified successfully',
        });
      }),
    );
  },
);

exports.changeMyPassword = changeMyPassword;
exports.verifyEmail = verifyEmail;
exports.confirmEmail = confirmEmail;

