const express = require('express');
const adminController = require('../controllers/adminController');
const categoryController = require('../controllers/categoryController');
const brandController = require('../controllers/brandController');
const productController = require('../controllers/productController');
const couponController = require('../controllers/couponController');
const reviewController = require('../controllers/reviewController');
const paymentController = require('../controllers/paymentController');
const { protectRole } = require('../middleware/auth');

const router = express.Router();
router.use(...protectRole('admin'));

router.get('/dashboard', adminController.getDashboard);
router.get('/users', adminController.getUsers);
router.put('/users/:id/block', adminController.toggleBlockUser);
router.get('/sellers', adminController.getSellers);
router.put('/sellers/:id/verify', adminController.verifySeller);
router.get('/products', adminController.getAllProducts);
router.put('/products/:id', productController.updateProduct);
router.delete('/products/:id', productController.deleteProduct);
router.get('/orders', adminController.getAllOrders);
router.get('/payments', paymentController.getAllPayments);
router.put('/payments/:id/refund', paymentController.refundPayment);
router.get('/returns', adminController.getReturnRequests);
router.get('/reviews', reviewController.getAllReviews);
router.put('/reviews/:id/status', reviewController.moderateReview);
router.post('/notifications', adminController.broadcastNotification);

router.post('/categories', categoryController.createCategory);
router.put('/categories/:id', categoryController.updateCategory);
router.delete('/categories/:id', categoryController.deleteCategory);
router.post('/brands', brandController.createBrand);
router.put('/brands/:id', brandController.updateBrand);
router.delete('/brands/:id', brandController.deleteBrand);

router.get('/coupons', couponController.getCoupons);
router.post('/coupons', couponController.createCoupon);
router.put('/coupons/:id', couponController.updateCoupon);
router.delete('/coupons/:id', couponController.deleteCoupon);

module.exports = router;
