const Student = require('../models/Student');
const Query = require('../models/Query');
const Notification = require('../models/Notification');

// @desc    Get dashboard (children info)
// @route   GET /api/parent/dashboard
// @access  Private (Parent only)
const getParentDashboard = async (req, res) => {
    try {
        const children = await Student.find({ parent_user_id: req.user._id })
            .populate('class_id', 'class section')
            .populate('school_id', 'name');

        res.json({ children });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get parent notifications
// @route   GET /api/parent/notifications
// @access  Private (Parent only)
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient_id: req.user._id })
            .sort({ createdAt: -1 });

        res.json(notifications);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getParentDashboard,
    getNotifications
};
