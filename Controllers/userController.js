const User = require("../Models/userModel");
const validator = require('validator');
const mongoose = require('mongoose');

exports.getUserFavourites = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const user = await User.findById(id).populate('favourites').lean();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            status: 'success',
            data: { favourites: user.favourites }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.addUserFavourites = async (req, res) => {
    try {
        const { id, PropertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(PropertyId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (user.favourites.includes(PropertyId)) {
            return res.status(400).json({ error: 'Property already in favourites' });
        }

        user.favourites.push(PropertyId);
        await user.save();

        res.status(200).json({
            status: 'success',
            data: { favourites: user.favourites }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.deleteUserFavourites = async (req, res) => {
    try {
        const { id, PropertyId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(PropertyId)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (!user.favourites.includes(PropertyId)) {
            return res.status(400).json({ error: 'Property not in favourites' });
        }

        user.favourites = user.favourites.filter(fav => fav !== PropertyId);
        await user.save();

        res.status(200).json({
            status: 'success',
            data: { favourites: user.favourites }
        });
    } catch (err) {
        res.status(500).json({ error: 'Server error', message: err.message });
    }
};

exports.addImage = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No photo uploaded' });
        }

        const updatedUser = await exports.updateUserPhoto(id, req.file.path);

        res.status(200).json({
            message: 'Photo uploaded successfully',
            user: updatedUser,
        });
    } catch (error) {
        res.status(500).json({ error: 'Photo upload failed', message: error.message });
    }
};

exports.updateUserPhoto = async (userId, imageUrl) => {
    const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePic: imageUrl },
        { new: true }
    );

    if (!updatedUser) throw new Error('User not found');
    return updatedUser;
};

const escapeHtml = (str) => str
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
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const restrictedFields = ['password', '_id', 'createdAt', 'role', 'balance', 'emailVerified'];
        restrictedFields.forEach(field => delete updateData[field]);

        if (updateData.email && !validator.isEmail(updateData.email)) {
            return res.status(400).json({ error: 'Invalid email format' });
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'User updated successfully',
            user: updatedUser,
        });

    } catch (error) {
        res.status(500).send('Server error: ' + escapeHtml(error.message));
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ error: 'Invalid user ID format' });
        }

        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.status(200).json({
            message: 'User deleted successfully',
            user: deletedUser,
        });

    } catch (error) {
        res.status(500).send('Server error: ' + escapeHtml(error.message));
    }
};