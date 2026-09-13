const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const SHIPPING_FEE_THRESHOLD = 499;
const SHIPPING_FEE = 49;

const CANCELLABLE = ['pending', 'confirmed', 'processing'];

const calcShipping = (itemsTotal) => (itemsTotal >= SHIPPING_FEE_THRESHOLD ? 0 : SHIPPING_FEE);

// @route POST /api/orders
exports.createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, paymentMethod = 'cod', couponCode, items } = req.body;

  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');

  let orderItems = [];
  let source = null;

  if (items && items.length) {
    // Direct buy (e.g. Buy Now) — validate products
    const products = await Product.find({ _id: { $in: items.map((i) => i.productId) }, status: 'active' });
    if (products.length !== items.length) throw new ApiError(400, 'One or more products are unavailable.');
    orderItems = items.map((i) => {
      const product = products.find((p) => String(p._id) === String(i.productId));
      if (product.stock < i.quantity) throw new ApiError(400, `Insufficient stock for ${product.name}.`);
      return {
        product: product._id,
        seller: product.seller,
        name: product.name,
        image: product.images[0] || '',
        price: Math.round(product.price * (1 - product.discountPercentage / 100)),
        quantity: i.quantity,
        variantSelection: i.variantSelection || {},
      };
    });
  } else if (cart && cart.items.length) {
    source = cart;
    const products = cart.items.map((i) => i.product).filter(Boolean);
    orderItems = cart.items
      .filter((i) => i.product && i.product.status === 'active')
      .map((i) => ({
        product: i.product._id,
        seller: i.product.seller,
        name: i.name,
        image: i.image,
        price: i.price,
        quantity: i.quantity,
        variantSelection: i.variantSelection || {},
      }));
    if (!orderItems.length) throw new ApiError(400, 'Your cart is empty or contains unavailable items.');
    // stock check
    for (const item of orderItems) {
      const product = products.find((p) => String(p._id) === String(item.product));
      if (!product || product.stock < item.quantity) {
        throw new ApiError(400, `Insufficient stock for ${item.name}.`);
      }
    }
  } else {
    throw new ApiError(400, 'Your cart is empty.');
  }

  const itemsTotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  let discount = 0;
  let appliedCoupon = null;
  if (couponCode) {
    const coupon = await Coupon.findOne({ code: couponCode.toUpperCase().trim() });
    if (!coupon || !coupon.isActive || coupon.expiresAt < new Date()) {
      throw new ApiError(400, 'Invalid or expired coupon.');
    }
    if (itemsTotal < coupon.minOrderAmount) {
      throw new ApiError(400, `Minimum order amount of ₹${coupon.minOrderAmount} required.`);
    }
    discount =
      coupon.type === 'percentage' ? Math.round((itemsTotal * coupon.value) / 100) : coupon.value;
    if (coupon.maxDiscount > 0) discount = Math.min(discount, coupon.maxDiscount);
    discount = Math.min(discount, itemsTotal);
    appliedCoupon = { code: coupon.code, discount };
    coupon.usedCount += 1;
    await coupon.save({ validateBeforeSave: false });
  }

  const shippingFee = calcShipping(itemsTotal - discount);
  const total = itemsTotal - discount + shippingFee;

  const isPaid = paymentMethod !== 'cod';

  const order = await Order.create({
    user: req.user._id,
    items: orderItems,
    shippingAddress,
    itemsTotal,
    shippingFee,
    discount,
    total,
    coupon: appliedCoupon,
    paymentMethod,
    isPaid,
    paidAt: isPaid ? new Date() : null,
    status: 'pending',
    statusHistory: [{ status: 'pending', note: 'Order placed', by: req.user._id }],
  });

  if (isPaid) {
    const payment = await Payment.create({
      order: order._id,
      user: req.user._id,
      amount: total,
      method: paymentMethod,
      status: 'paid',
    });
    order.payment = payment._id;
    order.paymentStatus = 'paid';
    await order.save();
  }

  // decrement stock + increment sold count
  await Promise.all(
    orderItems.map((item) =>
      Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity, soldCount: item.quantity },
      })
    )
  );

  if (source) {
    source.items = [];
    await source.save();
  }

  // notify buyer + sellers
  await Notification.create([
    {
      recipient: req.user._id,
      title: 'Order placed successfully',
      message: `Your order ${order.orderNumber} for ₹${total.toLocaleString('en-IN')} has been placed.`,
      type: 'order',
      link: `/orders/${order._id}`,
    },
    ...[...new Set(orderItems.map((i) => String(i.seller)))].map((sellerId) => ({
      recipient: sellerId,
      title: 'New order received',
      message: `You have received a new order ${order.orderNumber}.`,
      type: 'order',
      link: `/seller/orders`,
    })),
  ]);

  const populated = await Order.findById(order._id)
    .populate('items.product', 'name images slug')
    .populate('payment');

  sendResponse(res, 201, {
    message: 'Order placed successfully.',
    data: { order: populated },
  });
});

// @route GET /api/orders
exports.getMyOrders = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { user: req.user._id };
  if (req.query.status && req.query.status !== 'all') filter.status = req.query.status;
  if (req.query.returns === '1' || req.query.returns === 'true') filter.returnRequest = { $ne: null };

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .populate('items.product', 'name images slug')
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

// @route GET /api/orders/:id
exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('user', 'name email phone')
    .populate('items.product', 'name images slug')
    .populate('payment');

  if (!order) throw new ApiError(404, 'Order not found.');

  const isOwner = String(order.user._id) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  const isSellerOfOrder = req.user.role === 'seller' && order.items.some((i) => String(i.seller) === String(req.user._id));
  if (!isOwner && !isAdmin && !isSellerOfOrder) throw new ApiError(403, 'You cannot view this order.');

  sendResponse(res, 200, { data: { order } });
});

// @route PUT /api/orders/:id/cancel
exports.cancelOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id)) throw new ApiError(403, 'You cannot cancel this order.');
  if (!CANCELLABLE.includes(order.status)) {
    throw new ApiError(400, `Order cannot be cancelled once it is ${order.status}.`);
  }

  const { reason = '' } = req.body;
  order.status = 'cancelled';
  order.cancelReason = reason;
  order.statusHistory.push({ status: 'cancelled', note: reason || 'Cancelled by customer', by: req.user._id });
  await order.save();

  // restore stock
  await Promise.all(
    order.items.map((item) =>
      Product.findByIdAndUpdate(item.product, { $inc: { stock: item.quantity, soldCount: -item.quantity } })
    )
  );

  // refund if paid
  if (order.isPaid) {
    const payment = await Payment.findOne({ order: order._id });
    if (payment && payment.status === 'paid') {
      payment.status = 'refunded';
      payment.refundedAmount = payment.amount;
      payment.refundedAt = new Date();
      await payment.save();
    }
    order.paymentStatus = 'refunded';
    await order.save();
  }

  await Notification.create([
    {
      recipient: order.user,
      title: 'Order cancelled',
      message: `Your order ${order.orderNumber} has been cancelled.${order.isPaid ? ' Your refund is being processed.' : ''}`,
      type: 'warning',
      link: `/orders/${order._id}`,
    },
    ...[...new Set(order.items.map((i) => String(i.seller)))].map((sellerId) => ({
      recipient: sellerId,
      title: 'Order cancelled',
      message: `Order ${order.orderNumber} has been cancelled by the customer.`,
      type: 'warning',
      link: '/seller/orders',
    })),
  ]);

  sendResponse(res, 200, { message: 'Order cancelled.', data: { order } });
});

// @route POST /api/orders/:id/return
exports.requestReturn = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) throw new ApiError(404, 'Order not found.');
  if (String(order.user) !== String(req.user._id)) throw new ApiError(403, 'You cannot return this order.');
  if (order.status !== 'delivered') throw new ApiError(400, 'Returns are only possible after delivery.');
  if (order.returnRequest) throw new ApiError(400, 'A return request already exists for this order.');

  const { reason, description = '' } = req.body;
  order.returnRequest = {
    status: 'requested',
    reason,
    description,
    refundAmount: order.total,
    history: [{ status: 'requested', note: reason }],
  };
  await order.save();

  await Notification.create([
    {
      recipient: order.user,
      title: 'Return request submitted',
      message: `Your return request for order ${order.orderNumber} has been submitted.`,
      type: 'info',
      link: `/orders/${order._id}`,
    },
    ...[...new Set(order.items.map((i) => String(i.seller)))].map((sellerId) => ({
      recipient: sellerId,
      title: 'Return request received',
      message: `Customer requested a return for order ${order.orderNumber}.`,
      type: 'warning',
      link: '/seller/orders',
    })),
  ]);

  sendResponse(res, 200, { message: 'Return request submitted.', data: { order } });
});
