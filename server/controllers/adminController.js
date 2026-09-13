const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

// @route GET /api/admin/dashboard
exports.getDashboard = asyncHandler(async (req, res) => {
  const [totalUsers, totalSellers, pendingSellers, totalProducts, totalOrders, orders, reviewCount] =
    await Promise.all([
      User.countDocuments({ role: 'buyer' }),
      User.countDocuments({ role: 'seller' }),
      User.countDocuments({ role: 'seller', 'sellerInfo.status': 'pending' }),
      Product.countDocuments({ status: { $ne: 'deleted' } }),
      Order.countDocuments(),
      Order.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name'),
      Review.countDocuments(),
    ]);

  const statusCounts = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
  ]);
  const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

  const revenueResult = await Order.aggregate([
    { $match: { status: { $nin: ['cancelled', 'returned'] } } },
    { $group: { _id: null, revenue: { $sum: '$total' } } },
  ]);

  // revenue by month (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);
  twelveMonthsAgo.setHours(0, 0, 0, 0);

  const monthlyAgg = await Order.aggregate([
    { $match: { createdAt: { $gte: twelveMonthsAgo }, status: { $nin: ['cancelled', 'returned'] } } },
    {
      $group: {
        _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
        revenue: { $sum: '$total' },
        orders: { $sum: 1 },
      },
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } },
  ]);

  const revenueByMonth = [];
  const cursor = new Date(twelveMonthsAgo);
  for (let i = 0; i < 12; i++) {
    const year = cursor.getFullYear();
    const month = cursor.getMonth() + 1;
    const found = monthlyAgg.find((m) => m._id.year === year && m._id.month === month);
    revenueByMonth.push({
      label: cursor.toLocaleDateString('en-IN', { month: 'short' }),
      year,
      month,
      revenue: found ? found.revenue : 0,
      orders: found ? found.orders : 0,
    });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  // top categories by sales
  const topCategories = await Product.aggregate([
    { $match: { status: { $ne: 'deleted' } } },
    {
      $group: {
        _id: '$category',
        products: { $sum: 1 },
        sold: { $sum: '$soldCount' },
      },
    },
    { $sort: { sold: -1 } },
    { $limit: 6 },
    {
      $lookup: {
        from: 'categories',
        localField: '_id',
        foreignField: '_id',
        as: 'category',
      },
    },
    { $unwind: '$category' },
    {
      $project: {
        name: '$category.name',
        products: 1,
        sold: 1,
      },
    },
  ]);

  sendResponse(res, 200, {
    data: {
      stats: {
        totalUsers,
        totalSellers,
        pendingSellers,
        totalProducts,
        totalOrders,
        totalReviews: reviewCount,
        totalRevenue: revenueResult[0]?.revenue || 0,
        pendingOrders: statusMap.pending || 0,
        completedOrders: statusMap.delivered || 0,
        cancelledOrders: statusMap.cancelled || 0,
        returnedOrders: statusMap.returned || 0,
        shippedOrders: statusMap.shipped || 0,
        processingOrders: (statusMap.confirmed || 0) + (statusMap.processing || 0),
      },
      revenueByMonth,
      topCategories,
      recentOrders: orders,
    },
  });
});

// @route GET /api/admin/users
exports.getUsers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { role: 'buyer' };
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-addresses'),
    User.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { users },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route GET /api/admin/sellers
exports.getSellers = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { role: 'seller' };
  if (req.query.status && req.query.status !== 'all') filter['sellerInfo.status'] = req.query.status;
  if (req.query.search) {
    filter.$or = [
      { name: { $regex: req.query.search, $options: 'i' } },
      { email: { $regex: req.query.search, $options: 'i' } },
      { 'sellerInfo.shopName': { $regex: req.query.search, $options: 'i' } },
    ];
  }

  const [sellers, total, pendingCount] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).select('-addresses'),
    User.countDocuments(filter),
    User.countDocuments({ role: 'seller', 'sellerInfo.status': 'pending' }),
  ]);

  sendResponse(res, 200, {
    data: { sellers },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, pendingCount },
  });
});

// @route PUT /api/admin/users/:id/block
exports.toggleBlockUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) throw new ApiError(404, 'User not found.');
  if (user.role === 'admin') throw new ApiError(400, 'Admin accounts cannot be blocked.');

  user.isBlocked = !user.isBlocked;
  await user.save();

  await Notification.create({
    recipient: user._id,
    title: user.isBlocked ? 'Account blocked' : 'Account unblocked',
    message: user.isBlocked
      ? 'Your account has been blocked by admin. Contact support for assistance.'
      : 'Your account has been unblocked. Welcome back!',
    type: user.isBlocked ? 'warning' : 'success',
  });

  sendResponse(res, 200, {
    message: `User ${user.isBlocked ? 'blocked' : 'unblocked'}.`,
    data: { user },
  });
});

// @route PUT /api/admin/sellers/:id/verify
exports.verifySeller = asyncHandler(async (req, res) => {
  const { status, reason = '' } = req.body; // 'verified' | 'rejected' | 'pending'
  const seller = await User.findById(req.params.id);
  if (!seller || seller.role !== 'seller') throw new ApiError(404, 'Seller not found.');

  if (!['verified', 'rejected', 'pending'].includes(status)) {
    throw new ApiError(400, 'Status must be verified, rejected, or pending.');
  }

  seller.sellerInfo = seller.sellerInfo || {};
  seller.sellerInfo.status = status;
  seller.sellerInfo.rejectionReason = status === 'rejected' ? reason : '';
  await seller.save();

  await Notification.create({
    recipient: seller._id,
    title: `Seller account ${status}`,
    message:
      status === 'verified'
        ? 'Congratulations! Your seller account has been verified. You can now add products.'
        : status === 'rejected'
        ? `Your seller application was rejected. ${reason}`
        : 'Your seller account is pending verification.',
    type: status === 'verified' ? 'success' : status === 'rejected' ? 'warning' : 'info',
    link: '/seller',
  });

  sendResponse(res, 200, { message: `Seller ${status}.`, data: { seller } });
});

// @route GET /api/admin/products
exports.getAllProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { status: { $ne: 'deleted' } };
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }

  const [products, total] = await Promise.all([
    Product.find(filter)
      .populate('seller', 'name sellerInfo.shopName')
      .populate('category', 'name')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { products },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route GET /api/admin/orders
exports.getAllOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = {};
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

// @route POST /api/admin/notifications
exports.broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type = 'info', audience = 'all', link = '' } = req.body;
  const notification = await Notification.create({ title, message, type, audience, link });
  sendResponse(res, 201, { message: 'Notification sent.', data: { notification } });
});

// @route GET /api/admin/returns
exports.getReturnRequests = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { returnRequest: { $ne: null } };
  if (req.query.status && req.query.status !== 'all') filter['returnRequest.status'] = req.query.status;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('user', 'name email')
      .sort({ 'returnRequest.requestedAt': -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Order.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { orders },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});
