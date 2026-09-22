const jwt = require('jsonwebtoken');

const generateAccessToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '7d',
    });
};

const generateRefreshToken = (id, role) => {
    return jwt.sign({ id, role, type: 'refresh' }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    } catch (err) {
        return null;
    }
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyRefreshToken
};
