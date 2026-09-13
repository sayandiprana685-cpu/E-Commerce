const Order = require('../models/Order');
const Product = require('../models/Product');
const Payment = require('../models/Payment');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const SELLER_STATUSES = ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

// @route GET /api/seller/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const sellerId = req.user._id;

  const [products, orders, recentOrders, lowStock] = await Promise.all([
    Product.countDocuments({ seller: sellerId, status: { $ne: 'deleted' } }),
    Order.find({ 'items.seller': sellerId, status: { $nin: ['cancelled', 'returned'] } }),
    Order.find({ 'items.seller': sellerId })
      .sort({ createdAt: -1 })
      .limit(8)
      .populate('user', 'name'),
    Product.find({ seller: sellerId, status: 'active', stock: { $lte: 5 } })
      .sort({ stock: 1 })
      .limit(8)
      .select('name images stock price'),
  ]);

  let revenue = 0;
  let unitsSold = 0;
  const ordersSet = new Set();
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (String(item.seller) === String(sellerId)) {
        revenue += item.price * item.quantity;
        unitsSold += item.quantity;
      }
    });
    ordersSet.add(String(order._id));
  });

  const pendingOrders = await Order.countDocuments({
    'items.seller': sellerId,
    status: { $in: ['pending', 'confirmed', 'processing'] },
  });
  const completedOrders = await Order.countDocuments({
    'items.seller': sellerId,
    status: 'delivered',
  });
  const cancelledOrders = await Order.countDocuments({
    'items.seller': sellerId,
    status: 'cancelled',
  });
  const pendingReturns = await Order.countDocuments({
    'items.seller': sellerId,
    'returnRequest.status': 'requested',
  });

  // sales by day (last 14 days)
  const days = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    day.setHours(0, 0, 0, 0);
    const next = new Date(day);
    next.setDate(day.getDate() + 1);
    const dayOrders = orders.filter((o) => o.createdAt >= day && o.createdAt < next);
    const dayRevenue = dayOrders.reduce((sum, o) => {
      return (
        sum +
        o.items
          .filter((i) => String(i.seller) === String(sellerId))
          .reduce((s, i) => s + i.price * i.quantity, 0)
      );
    }, 0);
    days.push({
      date: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
      revenue: dayRevenue,
      orders: dayOrders.length,
    });
  }

  // best selling products
  const bestSellers = await Product.find({ seller: sellerId, status: { $ne: 'deleted' } })
    .sort({ soldCount: -1 })
    .limit(5)
    .select('name images price discountPercentage soldCount stock');

  sendResponse(res, 200, {
    data: {
      stats: {
        totalProducts: products,
        totalOrders: ordersSet.size,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        pendingReturns,
        totalRevenue: revenue,
        unitsSold,
        lowStockCount: lowStock.length,
        verificationStatus: req.user.sellerInfo?.status || 'pending',
      },
      salesByDay: days,
      recentOrders,
      lowStock,
      bestSellers,
    },
  });
});

// @route GET /api/seller/orders
exports.getSellerOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { 'items.seller': req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { orders },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route PUT /api/seller/orders/:id/status
exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const { status, note = '' } = req.body;
  if (!SELLER_STATUSES.includes(status)) {
    throw new ApiError(400, `Status must be one of: ${SELLER_STATUSES.join(', ')}`);
  }

  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');

  const hasItem = order.items.some((i) => String(i.seller) === String(req.user._id));
  if (!hasItem) throw new ApiError(403, 'This order does not contain your products.');

  if (order.status === 'cancelled' || order.status === 'returned') {
    throw new ApiError(400, `Order is already ${order.status}.`);
  }

  order.status = status;
  order.statusHistory.push({ status, note, by: req.user._id });
  if (status === 'delivered') {
    order.deliveredAt = new Date();
    if (order.paymentMethod === 'cod' && !order.isPaid) {
      order.isPaid = true;
      order.paidAt = new Date();
      order.paymentStatus = 'paid';
    }
  }
  await order.save();

  await Notification.create({
    recipient: order.user,
    title: 'Order status updated',
    message: `Your order ${order.orderNumber} is now ${status}.`,
    type: 'order',
    link: `/orders/${order._id}`,
  });

  const populated = await Order.findById(order._id).populate('user', 'name email');
  sendResponse(res, 200, { message: `Order marked as ${status}.`, data: { order: populated } });
});

// @route PUT /api/seller/orders/:id/return
exports.handleReturnRequest = asyncHandler(async (req, res) => {
  const { decision, note = '' } = req.body; // decision: 'approved' | 'rejected' | 'refunded'
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (!order.returnRequest) throw new ApiError(400, 'No return request for this order.');

  const hasItem = order.items.some((i) => String(i.seller) === String(req.user._id));
  if (!hasItem) throw new ApiError(403, 'This order does not contain your products.');

  if (!['approved', 'rejected', 'refunded'].includes(decision)) {
    throw new ApiError(400, 'Decision must be approved, rejected, or refunded.');
  }

  order.returnRequest.status = decision;
  order.returnRequest.history.push({ status: decision, note });
  if (decision === 'approved') {
    order.status = 'returned';
    order.returnRequest.refundAmount = order.total;
    // restore stock
    await Promise.all(
      order.items.map((item) =>
        Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, soldCount: -item.quantity } })
      )
    );
  }
  if (decision === 'refunded') {
    order.returnRequest.resolvedAt = new Date();
    const payment = await Payment.findOne({ order: order._id });
    if (payment) {
      payment.status = 'refunded';
      payment.refundedAmount = payment.amount;
      payment.refundedAt = new Date();
      await payment.save();
    }
    order.paymentStatus = 'refunded';
  }
  await order.save();

  await Notification.create({
    recipient: order.user,
    title: `Return request ${decision}`,
    message: `Your return request for order ${order.orderNumber} has been ${decision}. ${note}`,
    type: decision === 'rejected' ? 'warning' : 'success',
    link: `/orders/${order._id}`,
  });

  sendResponse(res, 200, { message: `Return request ${decision}.`, data: { order } });
});
