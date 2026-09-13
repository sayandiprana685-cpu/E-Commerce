const express = require('express');
const couponController = require('../controllers/couponController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/validate', protect, couponController.validateCoupon);

module.exports = router;
