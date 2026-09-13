const express = require('express');
const upload = require('../middleware/upload');
const uploadController = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.post('/images', upload.array('images', 8), uploadController.uploadImages);

module.exports = router;
