const express = require('express');
const productController = require('../controllers/productController');

const router = express.Router();

router.get('/', productController.getProducts);
router.get('/home', productController.getHomeSections);
router.get('/:idOrSlug', productController.getProductById);

module.exports = router;
