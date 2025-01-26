const bcrypt = require('bcryptjs');
const User = require('../Models/userModel');
const Token = require('../Models/tokenModel');
const {
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwt');

exports.signup = async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    const existingUser = await User.findOne({ email });
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

    await newUser.save();

    const accessToken = generateAccessToken(newUser._id);
    const refreshToken = generateRefreshToken(newUser._id);

    const newToken = new Token({
      userId: newUser._id,
      refreshToken,
    });

    await newToken.save();

    res.status(201).json({
      message: 'Sign up successful',
      accessToken,
      refreshToken,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
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
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (!refreshToken) {
      return res
        .status(400)
        .json({ message: 'Refresh token required' });
    }

    const decoded = verifyRefreshToken(refreshToken);

    const tokenInDb = await Token.findOne({
      userId: decoded.userId,
      refreshToken,
    });
    if (!tokenInDb) {
      return res.status(403).json({
        message: 'Invalid or expired refresh token',
      });
    }

    const newAccessToken = generateAccessToken(
      decoded.userId,
    );

    res.json({ newAccessToken });
  } catch (error) {
    console.error(error);
    res.status(403).json({
      message: 'Invalid or expired refresh token',
    });
  }
};
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;

  try {
    await Token.deleteOne({ refreshToken });

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
