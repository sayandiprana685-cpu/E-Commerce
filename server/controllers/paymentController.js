const Payment = require('../models/Payment');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// @route GET /api/payments/me
exports.getMyPayments = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .populate('order', 'orderNumber status total')
    .sort({ createdAt: -1 });
  sendResponse(res, 200, { data: { payments } });
});

// ---- Admin ----

// @route GET /api/admin/payments
exports.getAllPayments = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = {};
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [payments, total, stats] = await Promise.all([
    Payment.find(filter)
      .populate('user', 'name email')
      .populate('order', 'orderNumber status')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Payment.countDocuments(filter),
    Payment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          amount: { $sum: '$amount' },
        },
      },
    ]),
  ]);

  sendResponse(res, 200, {
    data: { payments, stats },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route PUT /api/admin/payments/:id/refund
exports.refundPayment = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id);
  if (!payment) throw new ApiError(404, 'Payment not found.');
  if (payment.status === 'refunded') throw new ApiError(400, 'Payment is already refunded.');
  if (payment.status !== 'paid') throw new ApiError(400, 'Only successful payments can be refunded.');

  payment.status = 'refunded';
  payment.refundedAmount = payment.amount;
  payment.refundedAt = new Date();
  await payment.save();

  const order = await Order.findById(payment.order);
  if (order) {
    order.paymentStatus = 'refunded';
    await order.save();
  }

  sendResponse(res, 200, { message: 'Payment refunded.', data: { payment } });
});
