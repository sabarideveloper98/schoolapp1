const User = require('../models/User');
const generateToken = require('../utils/generateToken');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password) {
            return res.status(400).json({ message: 'Please provide a password' });
        }

        let user;
        if (email) {
            user = await User.findOne({ email });
        } else if (phone) {
            user = await User.findOne({ phone });
        } else {
            return res.status(400).json({ message: 'Please provide email or phone' });
        }

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                token: generateToken(user._id, user.role),
            });
        } else {
            res.status(401).json({ message: 'Invalid credentials' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
// @desc    Update user profile / password
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const { email, phone, currentPassword, newPassword } = req.body;

        // If user wants to change password, verify current password
        if (newPassword) {
            if (!currentPassword) {
                return res.status(400).json({ message: 'Current password is required to change password' });
            }
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Incorrect current password' });
            }
            user.password = newPassword;
        }

        if (email !== undefined) user.email = email;
        if (phone !== undefined) user.phone = phone;

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            reference_id: updatedUser.reference_id,
            token: generateToken(updatedUser._id, updatedUser.role),
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ message: error.message || 'Failed to update profile' });
    }
};

module.exports = {
    loginUser,
    getUserProfile,
    updateUserProfile
};
