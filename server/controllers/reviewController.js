const Review = require('../models/Review');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// @route GET /api/reviews/product/:productId
exports.getProductReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { product: req.params.productId, status: 'visible' };

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name avatar')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { reviews },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route POST /api/reviews
exports.createReview = asyncHandler(async (req, res) => {
  const { productId, rating, title = '', comment } = req.body;

  const review = await Review.findOne({ product: productId, user: req.user._id });
  if (review) throw new ApiError(409, 'You have already reviewed this product.');

  const purchased = await Order.exists({
    user: req.user._id,
    'items.product': productId,
    status: 'delivered',
  });

  const created = await Review.create({
    product: productId,
    user: req.user._id,
    rating,
    title,
    comment,
    isVerifiedPurchase: !!purchased,
  });

  await Review.recalculateProductRating(productId);

  const populated = await created.populate('user', 'name avatar');
  sendResponse(res, 201, { message: 'Review submitted.', data: { review: populated } });
});

// @route PUT /api/reviews/:id
exports.updateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (String(review.user) !== String(req.user._id)) throw new ApiError(403, 'You can only edit your own reviews.');

  if (req.body.rating) review.rating = req.body.rating;
  if (req.body.title !== undefined) review.title = req.body.title;
  if (req.body.comment) review.comment = req.body.comment;
  await review.save();
  await Review.recalculateProductRating(review.product);

  sendResponse(res, 200, { message: 'Review updated.', data: { review } });
});

// @route DELETE /api/reviews/:id
exports.deleteReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  if (String(review.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You cannot delete this review.');
  }
  const productId = review.product;
  await review.deleteOne();
  await Review.recalculateProductRating(productId);
  sendResponse(res, 200, { message: 'Review deleted.' });
});

// @route GET /api/reviews/me
exports.getMyReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.find({ user: req.user._id })
    .populate('product', 'name slug images')
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { data: { reviews } });
});

// ---- Admin moderation ----

// @route GET /api/admin/reviews
exports.getAllReviews = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.rating) filter.rating = Number(req.query.rating);

  const [reviews, total] = await Promise.all([
    Review.find(filter)
      .populate('user', 'name email')
      .populate('product', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Review.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { reviews },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route PUT /api/admin/reviews/:id/status
exports.moderateReview = asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) throw new ApiError(404, 'Review not found.');
  const { status } = req.body;
  if (!['visible', 'hidden'].includes(status)) throw new ApiError(400, 'Status must be visible or hidden.');
  review.status = status;
  await review.save();
  await Review.recalculateProductRating(review.product);
  sendResponse(res, 200, { message: `Review ${status}.`, data: { review } });
});
