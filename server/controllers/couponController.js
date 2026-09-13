const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// @route POST /api/coupons/validate
exports.validateCoupon = asyncHandler(async (req, res) => {
  const { code, orderAmount } = req.body;
  const coupon = await Coupon.findOne({ code: (code || '').toUpperCase().trim() });

  if (!coupon || !coupon.isActive) throw new ApiError(404, 'Invalid coupon code.');
  if (coupon.expiresAt < new Date()) throw new ApiError(400, 'This coupon has expired.');
  if (coupon.usedCount >= coupon.usageLimit) throw new ApiError(400, 'This coupon has reached its usage limit.');
  if (orderAmount < coupon.minOrderAmount) {
    throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`);
  }

  let discount =
    coupon.type === 'percentage' ? Math.round((orderAmount * coupon.value) / 100) : coupon.value;
  if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
  discount = Math.min(discount, orderAmount);

  sendResponse(res, 200, {
    message: `Coupon ${coupon.code} applied.`,
    data: {
      coupon: {
        code: coupon.code,
        type: coupon.type,
        value: coupon.value,
        discount,
      },
    },
  });
});

// ---- Admin CRUD ----

// @route GET /api/admin/coupons
exports.getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  sendResponse(res, 200, { data: { coupons } });
});

// @route POST /api/admin/coupons
exports.createCoupon = asyncHandler(async (req, res) => {
  const { code, type, value, minOrderAmount, maxDiscount, usageLimit, expiresAt } = req.body;
  const exists = await Coupon.findOne({ code: code.toUpperCase() });
  if (exists) throw new ApiError(409, 'Coupon code already exists.');
  const coupon = await Coupon.create({
    code,
    type,
    value,
    minOrderAmount: minOrderAmount || 0,
    maxDiscount: maxDiscount || 0,
    usageLimit: usageLimit || 100,
    expiresAt,
  });
  sendResponse(res, 201, { message: 'Coupon created.', data: { coupon } });
});

// @route PUT /api/admin/coupons/:id
exports.updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  ['type', 'value', 'minOrderAmount', 'maxDiscount', 'usageLimit', 'expiresAt', 'isActive'].forEach((f) => {
    if (req.body[f] !== undefined) coupon[f] = req.body[f];
  });
  await coupon.save();
  sendResponse(res, 200, { message: 'Coupon updated.', data: { coupon } });
});

// @route DELETE /api/admin/coupons/:id
exports.deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) throw new ApiError(404, 'Coupon not found.');
  sendResponse(res, 200, { message: 'Coupon deleted.' });
});
