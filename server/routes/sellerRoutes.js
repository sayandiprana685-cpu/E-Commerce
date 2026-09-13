const express = require('express');
const sellerController = require('../controllers/sellerController');
const productController = require('../controllers/productController');
const { protectRole } = require('../middleware/auth');

const router = express.Router();
router.use(...protectRole('seller'));

router.get('/dashboard', sellerController.getDashboard);
router.get('/orders', sellerController.getSellerOrders);
router.put('/orders/:id/status', sellerController.updateOrderStatus);
router.put('/orders/:id/return', sellerController.handleReturnRequest);
router.get('/products', productController.getSellerProducts);
router.post('/products', productController.createProduct);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);

module.exports = router;
