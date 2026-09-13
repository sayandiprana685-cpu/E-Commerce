const express = require('express');
const wishlistController = require('../controllers/wishlistController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', wishlistController.getWishlist);
router.post('/', wishlistController.toggleWishlist);

module.exports = router;
