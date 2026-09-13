const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate } = require('../middleware/errorHandler');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 80 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password')
      .isLength({ min: 6, max: 72 })
      .withMessage('Password must be 6-72 characters'),
    body('role').optional().isIn(['buyer', 'seller']).withMessage('Role must be buyer or seller'),
    body('shopName').if(body('role').equals('seller')).trim().notEmpty().withMessage('Shop name is required'),
  ],
  validate,
  authController.register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  authController.login
);

router.post('/logout', authController.logout);
router.get('/me', protect, authController.getMe);
router.post('/forgot-password', [body('email').isEmail().withMessage('Valid email is required')], validate, authController.forgotPassword);
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6, max: 72 }).withMessage('Password must be 6-72 characters'),
  ],
  validate,
  authController.resetPassword
);
router.put(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6, max: 72 }).withMessage('New password must be 6-72 characters'),
  ],
  validate,
  authController.changePassword
);

module.exports = router;
