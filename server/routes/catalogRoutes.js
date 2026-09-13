const express = require('express');
const categoryController = require('../controllers/categoryController');
const brandController = require('../controllers/brandController');

const router = express.Router();

router.get('/categories', categoryController.getCategories);
router.get('/brands', brandController.getBrands);

module.exports = router;
