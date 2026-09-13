const jwt = require('jsonwebtoken');

const generateToken = (userId, role, secret = process.env.JWT_SECRET, expiresIn = process.env.JWT_EXPIRES_IN) =>
  jwt.sign({ id: userId, role }, secret, { expiresIn });

const generateResetToken = (userId) =>
  jwt.sign({ id: userId, purpose: 'reset' }, process.env.JWT_RESET_SECRET, {
    expiresIn: process.env.JWT_RESET_EXPIRES_IN,
  });

const verifyResetToken = (token) => jwt.verify(token, process.env.JWT_RESET_SECRET);

module.exports = { generateToken, generateResetToken, verifyResetToken };
