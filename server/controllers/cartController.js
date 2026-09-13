const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) cart = await Cart.create({ user: userId, items: [] });
  return cart;
};

const serializeCart = (cart) => ({
  items: cart.items,
  itemsTotal: cart.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
  totalItems: cart.items.reduce((sum, i) => sum + i.quantity, 0),
});

// @route GET /api/cart
exports.getCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  await cart.populate({
    path: 'items.product',
    select: 'name price discountPercentage stock images status variants',
  });
  sendResponse(res, 200, { data: { cart: serializeCart(cart) } });
});

// @route POST /api/cart
exports.addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity = 1, variantSelection = {} } = req.body;

  const product = await Product.findOne({ _id: productId, status: 'active' });
  if (!product) throw new ApiError(404, 'Product not found or unavailable.');
  if (product.stock < 1) throw new ApiError(400, 'Product is out of stock.');

  const qty = Math.max(1, parseInt(quantity));
  if (product.stock < qty) throw new ApiError(400, `Only ${product.stock} left in stock.`);

  const unitPrice = Math.round(product.price * (1 - product.discountPercentage / 100));
  const image = product.images && product.images[0] ? product.images[0] : '';

  const cart = await getOrCreateCart(req.user._id);

  const selectionKey = JSON.stringify(variantSelection || {});
  const existing = cart.items.find(
    (i) =>
      String(i.product) === String(productId) && JSON.stringify(i.variantSelection || {}) === selectionKey
  );

  if (existing) {
    const newQty = existing.quantity + qty;
    if (product.stock < newQty) throw new ApiError(400, `Only ${product.stock} left in stock.`);
    existing.quantity = newQty;
  } else {
    cart.items.push({
      product: product._id,
      quantity: qty,
      variantSelection,
      price: unitPrice,
      name: product.name,
      image,
    });
  }
  await cart.save();
  sendResponse(res, 200, { message: 'Added to cart.', data: { cart: serializeCart(cart) } });
});

// @route PUT /api/cart/:itemId
exports.updateCartItem = asyncHandler(async (req, res) => {
  const { quantity } = req.body;
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');

  const product = await Product.findById(item.product);
  if (!product) throw new ApiError(404, 'Product no longer exists.');

  const qty = parseInt(quantity);
  if (qty < 1) throw new ApiError(400, 'Quantity must be at least 1.');
  if (product.stock < qty) throw new ApiError(400, `Only ${product.stock} left in stock.`);

  item.quantity = qty;
  item.price = Math.round(product.price * (1 - product.discountPercentage / 100));
  await cart.save();
  sendResponse(res, 200, { message: 'Cart updated.', data: { cart: serializeCart(cart) } });
});

// @route DELETE /api/cart/:itemId
exports.removeCartItem = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  const item = cart.items.id(req.params.itemId);
  if (!item) throw new ApiError(404, 'Cart item not found.');
  item.deleteOne();
  await cart.save();
  sendResponse(res, 200, { message: 'Item removed from cart.', data: { cart: serializeCart(cart) } });
});

// @route DELETE /api/cart
exports.clearCart = asyncHandler(async (req, res) => {
  const cart = await getOrCreateCart(req.user._id);
  cart.items = [];
  await cart.save();
  sendResponse(res, 200, { message: 'Cart cleared.', data: { cart: serializeCart(cart) } });
});
