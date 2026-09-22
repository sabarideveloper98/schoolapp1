const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '30d',
    });
};

const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role, type: 'refresh' }, process.env.JWT_SECRET || 'secret123', {
        expiresIn: '90d',
    });
};

// @desc    Sign Up / Create Account
// @route   POST /api/auth/signup
// @access  Public
const signupUser = async (req, res) => {
    try {
        const { name, email, mobile, phone, password, role } = req.body;

        const userPhone = mobile || phone;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password is required and must be at least 6 characters long',
                errors: ['Password length minimum 6 characters required']
            });
        }

        if (!email && !userPhone) {
            return res.status(400).json({
                success: false,
                message: 'Either email or mobile number is required',
                errors: ['Missing contact credential']
            });
        }

        const validRoles = ['SuperAdmin', 'SchoolAdmin', 'Teacher', 'Staff', 'Parent', 'Driver'];
        const userRole = role && validRoles.includes(role) ? role : 'SchoolAdmin';

        // Duplicate checks
        if (email) {
            const existingEmail = await User.findOne({ email: email.trim().toLowerCase() });
            if (existingEmail) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this email address already exists',
                    errors: ['Duplicate email address']
                });
            }
        }

        if (userPhone) {
            const existingPhone = await User.findOne({ phone: userPhone.trim() });
            if (existingPhone) {
                return res.status(400).json({
                    success: false,
                    message: 'An account with this mobile number already exists',
                    errors: ['Duplicate mobile number']
                });
            }
        }

        const newUser = await User.create({
            name: name ? name.trim() : '',
            email: email ? email.trim().toLowerCase() : undefined,
            phone: userPhone ? userPhone.trim() : undefined,
            password: password,
            role: userRole,
            status: 'Active'
        });

        const token = generateToken(newUser._id, newUser.role);
        const refreshToken = generateRefreshToken(newUser._id, newUser.role);

        newUser.refresh_tokens = [refreshToken];
        await newUser.save();

        const userResponse = {
            _id: newUser._id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            role: newUser.role,
            status: newUser.status,
            createdAt: newUser.createdAt
        };

        return res.status(201).json({
            success: true,
            message: 'Account created successfully',
            user: userResponse,
            token,
            refreshToken
        });
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to create account',
            errors: [error.message]
        });
    }
};

// @desc    Auth user & get token (Login via Email or Mobile)
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    try {
        const { email, mobile, phone, password } = req.body;
        const userPhone = mobile || phone;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide a password',
                errors: ['Missing password']
            });
        }

        let user;
        if (email) {
            user = await User.findOne({ email: email.trim().toLowerCase() });
        } else if (userPhone) {
            user = await User.findOne({ phone: userPhone.trim() });
        } else {
            return res.status(400).json({
                success: false,
                message: 'Please provide email or mobile number',
                errors: ['Missing email or mobile']
            });
        }

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/mobile or password',
                errors: ['Authentication failed']
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email/mobile or password',
                errors: ['Authentication failed']
            });
        }

        if (user.status === 'Blocked' || user.status === 'Inactive') {
            return res.status(403).json({
                success: false,
                message: `Account is ${user.status.toLowerCase()}. Please contact School Administration.`,
                errors: ['Account disabled']
            });
        }

        user.last_login_at = new Date();
        const token = generateToken(user._id, user.role);
        const refreshToken = generateRefreshToken(user._id, user.role);

        if (!user.refresh_tokens) user.refresh_tokens = [];
        user.refresh_tokens.push(refreshToken);
        await user.save();

        const userResponse = {
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            status: user.status,
            reference_id: user.reference_id,
            last_login_at: user.last_login_at
        };

        return res.json({
            success: true,
            message: 'Login successful',
            token,
            refreshToken,
            user: userResponse
        });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error during login',
            errors: [error.message]
        });
    }
};

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = async (req, res) => {
    try {
        if (req.user && req.user._id) {
            const user = await User.findById(req.user._id);
            if (user) {
                user.refresh_tokens = [];
                await user.save();
            }
        }
        return res.json({
            success: true,
            message: 'Logged out successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Logout failed',
            errors: [error.message]
        });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/me
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        let user = await User.findById(userId).select('-password');
        
        if (!user) {
            user = req.user;
        }

        return res.json({
            success: true,
            message: 'Profile retrieved successfully',
            data: user,
            user: user
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch user profile',
            errors: [error.message]
        });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
                errors: ['User ID does not exist']
            });
        }

        const { name, email, phone, mobile } = req.body;
        const newPhone = mobile || phone;

        if (name !== undefined) user.name = name.trim();
        if (email !== undefined) user.email = email.trim().toLowerCase();
        if (newPhone !== undefined) user.phone = newPhone.trim();

        const updatedUser = await user.save();

        const userResponse = {
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            phone: updatedUser.phone,
            role: updatedUser.role,
            status: updatedUser.status
        };

        return res.json({
            success: true,
            message: 'Profile updated successfully',
            user: userResponse,
            data: userResponse
        });
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to update profile',
            errors: [error.message]
        });
    }
};

// @desc    Change User Password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
    try {
        const userId = req.user.id || req.user._id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required',
                errors: ['Missing password parameters']
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
                errors: ['Short password']
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User account not found',
                errors: ['User not found']
            });
        }

        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({
                success: false,
                message: 'Incorrect current password',
                errors: ['Invalid current password']
            });
        }

        user.password = newPassword;
        await user.save();

        return res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to change password',
            errors: [error.message]
        });
    }
};

// @desc    Forgot Password - Request Password Reset
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    try {
        const { email, mobile, phone } = req.body;
        const userPhone = mobile || phone;

        let user;
        if (email) {
            user = await User.findOne({ email: email.trim().toLowerCase() });
        } else if (userPhone) {
            user = await User.findOne({ phone: userPhone.trim() });
        }

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with provided contact information',
                errors: ['User not found']
            });
        }

        const resetToken = crypto.randomBytes(20).toString('hex');
        user.reset_password_token = crypto.createHash('sha256').update(resetToken).digest('hex');
        user.reset_password_expire = Date.now() + 30 * 60 * 1000; // 30 minutes

        await user.save();

        return res.json({
            success: true,
            message: 'Password reset token generated successfully. In production, an email/SMS with instructions is dispatched.',
            resetToken: resetToken,
            expiresInMinutes: 30
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to process forgot password request',
            errors: [error.message]
        });
    }
};

// @desc    Reset Password using Reset Token
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    try {
        const { resetToken, newPassword, email } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long',
                errors: ['Invalid password length']
            });
        }

        let user;
        if (resetToken) {
            const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
            user = await User.findOne({
                reset_password_token: hashedToken,
                reset_password_expire: { $gt: Date.now() }
            });
        } else if (email) {
            user = await User.findOne({ email: email.trim().toLowerCase() });
        }

        if (!user) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired password reset token',
                errors: ['Token invalid or expired']
            });
        }

        user.password = newPassword;
        user.reset_password_token = null;
        user.reset_password_expire = null;
        await user.save();

        return res.json({
            success: true,
            message: 'Password has been reset successfully. You can now log in with your new password.'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password',
            errors: [error.message]
        });
    }
};

// @desc    Refresh Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
                errors: ['Missing refresh token']
            });
        }

        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'secret123');
        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User not found or token invalid',
                errors: ['Invalid token']
            });
        }

        const newToken = generateToken(user._id, user.role);

        return res.json({
            success: true,
            message: 'Token refreshed successfully',
            token: newToken
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            errors: [error.message]
        });
    }
};

module.exports = {
    signupUser,
    loginUser,
    logoutUser,
    getUserProfile,
    updateUserProfile,
    changePassword,
    forgotPassword,
    resetPassword,
    refreshToken
};
