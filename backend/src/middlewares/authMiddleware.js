const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Driver = require('../models/Driver');
const Parent = require('../models/Parent');
const Teacher = require('../models/Teacher');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            
            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret123');
            
            if (decoded.role === 'Driver') {
                const driverDoc = await Driver.findById(decoded.id).select('-password');
                if (driverDoc) {
                    req.user = driverDoc.toObject();
                    req.user.role = 'Driver';
                }
            } else if (decoded.role === 'Parent') {
                const parentDoc = await Parent.findById(decoded.id).select('-password');
                if (parentDoc) {
                    req.user = parentDoc.toObject();
                    req.user.role = 'Parent';
                }
            } else if (decoded.role === 'Teacher') {
                const teacherDoc = await Teacher.findById(decoded.id).select('-password');
                if (teacherDoc) {
                    req.user = teacherDoc.toObject();
                    req.user.role = 'Teacher';
                }
            }

            if (!req.user) {
                const userDoc = await User.findById(decoded.id).select('-password');
                if (userDoc) {
                    req.user = userDoc.toObject();
                }
            }

            if (!req.user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (!req.user.role && decoded.role) {
                req.user.role = decoded.role;
            }

            return next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `User role ${req.user ? req.user.role : 'none'} is not authorized to access this route`
            });
        }
        next();
    };
};

module.exports = { protect, authorize };
