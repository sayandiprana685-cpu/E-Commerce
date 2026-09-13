const express = require('express');
const paymentController = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/me', paymentController.getMyPayments);

module.exports = router;
