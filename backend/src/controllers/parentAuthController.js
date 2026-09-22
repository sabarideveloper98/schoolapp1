const crypto = require('crypto');
const User = require('../models/User');
const Parent = require('../models/Parent');
const Student = require('../models/Student');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/tokenUtils');

// @desc    Parent Login (Mobile/Email + Password)
// @route   POST /api/parent/auth/login
// @access  Public
const loginParent = async (req, res) => {
    try {
        const { email, phone, email_or_phone, password } = req.body;

        const identifier = email || phone || email_or_phone;
        if (!identifier || !password) {
            return res.status(400).json({ message: 'Please provide mobile number/email and password' });
        }

        // Find parent user by phone or email
        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase().trim() },
                { phone: identifier.trim() }
            ],
            role: 'Parent'
        });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials or non-parent account' });
        }

        // Account status validation
        if (user.status && user.status !== 'Active') {
            return res.status(403).json({ message: 'Parent account is deactivated or blocked. Please contact school administration.' });
        }

        // Verify password
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Tokens
        const accessToken = generateAccessToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        // Update last login tracking & refresh tokens
        user.last_login_at = new Date();
        user.refresh_tokens = user.refresh_tokens || [];
        user.refresh_tokens.push(refreshToken);
        // Keep last 5 refresh tokens
        if (user.refresh_tokens.length > 5) user.refresh_tokens.shift();
        await user.save();

        // Get/Sync Parent Profile
        let parentProfile = await Parent.findOne({ user_id: user._id });
        if (!parentProfile) {
            // Find one of the linked students to populate parent details
            const linkedStudent = await Student.findOne({ parent_user_id: user._id });
            parentProfile = await Parent.create({
                user_id: user._id,
                school_id: linkedStudent ? linkedStudent.school_id : null,
                name: linkedStudent ? (linkedStudent.parent_name || linkedStudent.father_name || 'Parent') : 'Parent',
                father_name: linkedStudent ? (linkedStudent.father_name || '') : '',
                mother_name: linkedStudent ? (linkedStudent.mother_name || '') : '',
                phone: user.phone || (linkedStudent ? linkedStudent.parent_phone : ''),
                email: user.email || (linkedStudent ? linkedStudent.parent_email : ''),
                address: linkedStudent ? (linkedStudent.address || linkedStudent.guardian_address || '') : '',
                last_login_at: new Date()
            });
        } else {
            parentProfile.last_login_at = new Date();
            await parentProfile.save();
        }

        const linkedStudents = await Student.find({ parent_user_id: user._id })
            .select('student_name first_name last_name admission_number roll_no class_id photo')
            .populate('class_id', 'class section');

        res.json({
            success: true,
            accessToken,
            refreshToken,
            user: {
                _id: user._id,
                email: user.email,
                phone: user.phone,
                role: user.role,
                status: user.status,
                last_login_at: user.last_login_at
            },
            profile: parentProfile,
            linkedStudents
        });
    } catch (error) {
        console.error('loginParent error:', error);
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// @desc    Parent Logout
// @route   POST /api/parent/auth/logout
// @access  Private (Parent) / Public with refreshToken
const logoutParent = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        const userId = req.user ? req.user._id : null;

        if (userId) {
            const user = await User.findById(userId);
            if (user) {
                if (refreshToken) {
                    user.refresh_tokens = user.refresh_tokens.filter(t => t !== refreshToken);
                } else {
                    user.refresh_tokens = [];
                }
                await user.save();
            }
        } else if (refreshToken) {
            const decoded = verifyRefreshToken(refreshToken);
            if (decoded && decoded.id) {
                const user = await User.findById(decoded.id);
                if (user) {
                    user.refresh_tokens = user.refresh_tokens.filter(t => t !== refreshToken);
                    await user.save();
                }
            }
        }

        res.json({ success: true, message: 'Parent logged out successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Logout failed', error: error.message });
    }
};

// @desc    Refresh Token
// @route   POST /api/parent/auth/refresh-token
// @access  Public
const refreshTokenParent = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ message: 'Refresh token is required' });
        }

        const decoded = verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid or expired refresh token' });
        }

        const user = await User.findById(decoded.id);
        if (!user || user.role !== 'Parent' || user.status !== 'Active') {
            return res.status(403).json({ message: 'Invalid user session or account deactivated' });
        }

        if (!user.refresh_tokens.includes(refreshToken)) {
            return res.status(401).json({ message: 'Refresh token revoked' });
        }

        const newAccessToken = generateAccessToken(user._id, user.role);
        res.json({ success: true, accessToken: newAccessToken });
    } catch (error) {
        res.status(500).json({ message: 'Token refresh failed', error: error.message });
    }
};

// @desc    Forgot Password Request
// @route   POST /api/parent/auth/forgot-password
// @access  Public
const forgotPasswordParent = async (req, res) => {
    try {
        const { email_or_phone, email, phone } = req.body;
        const identifier = email || phone || email_or_phone;

        if (!identifier) {
            return res.status(400).json({ message: 'Please provide registered email or mobile number' });
        }

        const user = await User.findOne({
            $or: [
                { email: identifier.toLowerCase().trim() },
                { phone: identifier.trim() }
            ],
            role: 'Parent'
        });

        if (!user) {
            return res.status(404).json({ message: 'No active parent account found with given mobile number/email' });
        }

        // Generate 6-character reset token
        const resetToken = crypto.randomBytes(3).toString('hex').toUpperCase(); // e.g. "A1B2C3"
        user.reset_password_token = resetToken;
        user.reset_password_expire = Date.now() + 15 * 60 * 1000; // 15 minutes
        await user.save();

        res.json({
            success: true,
            message: 'Password reset code generated successfully. Please use this code to reset your password within 15 minutes.',
            resetToken
        });
    } catch (error) {
        res.status(500).json({ message: 'Forgot password request failed', error: error.message });
    }
};

// @desc    Reset Password with Code/Token
// @route   POST /api/parent/auth/reset-password
// @access  Public
const resetPasswordParent = async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;
        if (!resetToken || !newPassword) {
            return res.status(400).json({ message: 'Reset token and new password are required' });
        }

        const user = await User.findOne({
            reset_password_token: resetToken,
            reset_password_expire: { $gt: Date.now() },
            role: 'Parent'
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        user.password = newPassword;
        user.reset_password_token = null;
        user.reset_password_expire = null;
        user.refresh_tokens = []; // Revoke old sessions
        await user.save();

        res.json({ success: true, message: 'Password reset successfully. Please login with your new password.' });
    } catch (error) {
        res.status(500).json({ message: 'Password reset failed', error: error.message });
    }
};

// @desc    Change Password (Authenticated)
// @route   POST /api/parent/auth/change-password
// @access  Private (Parent)
const changePasswordParent = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;
        if (!oldPassword || !newPassword) {
            return res.status(400).json({ message: 'Old and new passwords are required' });
        }

        const user = await User.findById(req.user._id);
        const isMatch = await user.matchPassword(oldPassword);
        if (!isMatch) {
            return res.status(400).json({ message: 'Incorrect old password' });
        }

        user.password = newPassword;
        user.refresh_tokens = []; // Revoke old sessions
        await user.save();

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to change password', error: error.message });
    }
};

// @desc    Get Authenticated Parent User & Profile
// @route   GET /api/parent/auth/profile
// @access  Private (Parent)
const getParentAuthProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        let parent = await Parent.findOne({ user_id: req.user._id });

        const linkedStudents = await Student.find({ parent_user_id: req.user._id })
            .populate('class_id', 'class section')
            .populate('school_id', 'name code logo');

        if (!parent && linkedStudents.length > 0) {
            const s = linkedStudents[0];
            parent = await Parent.create({
                user_id: user._id,
                school_id: s.school_id ? s.school_id._id : null,
                name: s.parent_name || s.father_name || 'Parent',
                father_name: s.father_name || '',
                mother_name: s.mother_name || '',
                phone: user.phone || s.parent_phone || '',
                email: user.email || s.parent_email || '',
                address: s.address || s.guardian_address || ''
            });
        }

        res.json({
            user,
            profile: parent,
            linkedStudents
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch auth profile', error: error.message });
    }
};

module.exports = {
    loginParent,
    logoutParent,
    refreshTokenParent,
    forgotPasswordParent,
    resetPasswordParent,
    changePasswordParent,
    getParentAuthProfile
};
