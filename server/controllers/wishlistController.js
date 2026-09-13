const Wishlist = require('../models/Wishlist');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const getOrCreateWishlist = async (userId) => {
  let wishlist = await Wishlist.findOne({ user: userId });
  if (!wishlist) wishlist = await Wishlist.create({ user: userId, products: [] });
  return wishlist;
};

// @route GET /api/wishlist
exports.getWishlist = asyncHandler(async (req, res) => {
  const wishlist = await getOrCreateWishlist(req.user._id);
  await wishlist.populate({
    path: 'products',
    select: 'name slug images price discountPercentage stock ratingsAverage ratingsQuantity status',
    populate: [{ path: 'brand', select: 'name slug' }],
  });
  const products = wishlist.products.filter((p) => p && p.status !== 'deleted');
  sendResponse(res, 200, { data: { products, ids: products.map((p) => String(p._id)) } });
});

// @route POST /api/wishlist
exports.toggleWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  const wishlist = await getOrCreateWishlist(req.user._id);
  const exists = wishlist.products.some((p) => String(p) === String(productId));
  if (exists) {
    wishlist.products = wishlist.products.filter((p) => String(p) !== String(productId));
    await wishlist.save();
    return sendResponse(res, 200, { message: 'Removed from wishlist.', data: { inWishlist: false } });
  }
  wishlist.products.push(productId);
  await wishlist.save();
  sendResponse(res, 200, { message: 'Added to wishlist.', data: { inWishlist: true } });
});
