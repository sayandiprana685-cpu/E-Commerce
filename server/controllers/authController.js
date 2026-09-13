const User = require('../models/User');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');
const { generateToken, generateResetToken, verifyResetToken } = require('../utils/generateToken');

// In-memory store for reset tokens demo (single instance). Production: use email service + DB.
const resetTokens = new Map();

const sanitizeUser = (user) => {
  const obj = user.toObject({ virtuals: false });
  delete obj.password;
  delete obj.__v;
  return obj;
};

// @route POST /api/auth/register
exports.register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const exists = await User.findOne({ email });
  if (exists) throw new ApiError(409, 'An account with this email already exists.');

  const userData = { name, email, password };
  if (role === 'seller') {
    userData.role = 'seller';
    userData.sellerInfo = {
      shopName: req.body.shopName || `${name}'s Shop`,
      shopDescription: req.body.shopDescription || '',
      status: 'pending',
    };
  }

  const user = await User.create(userData);

  await Notification.create({
    recipient: user._id,
    title: 'Welcome to Vendora',
    message:
      role === 'seller'
        ? 'Your seller account has been created and is pending admin verification.'
        : 'Welcome aboard! Explore trending deals on Vendora today.',
    type: 'success',
    link: role === 'seller' ? '/seller' : '/shop',
  });

  const token = generateToken(user._id, user.role);
  sendResponse(res, 201, {
    message: 'Registration successful.',
    data: { user: sanitizeUser(user), token },
  });
});

// @route POST /api/auth/login
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    throw new ApiError(401, 'Invalid email or password.');
  }
  if (user.isBlocked) throw new ApiError(403, 'Your account has been blocked. Contact support.');

  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken(user._id, user.role);
  sendResponse(res, 200, {
    message: 'Login successful.',
    data: { user: sanitizeUser(user), token },
  });
});

// @route POST /api/auth/logout
exports.logout = asyncHandler(async (req, res) => {
  // JWT is stateless; client discards the token. Endpoint kept for API completeness.
  sendResponse(res, 200, { message: 'Logged out successfully.' });
});

// @route GET /api/auth/me
exports.getMe = asyncHandler(async (req, res) => {
  sendResponse(res, 200, { data: { user: sanitizeUser(req.user) } });
});

// @route POST /api/auth/forgot-password
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  // Do not reveal whether the account exists
  if (!user) {
    return sendResponse(res, 200, {
      message: 'If an account exists for that email, a reset link has been sent.',
      data: { resetToken: undefined },
    });
  }
  const token = generateResetToken(user._id);
  resetTokens.set(token, { userId: String(user._id), expires: Date.now() + 10 * 60 * 1000 });

  // Demo mode: token is returned so the flow is testable without an email service.
  sendResponse(res, 200, {
    message: 'If an account exists for that email, a reset link has been sent.',
    data: { resetToken: token },
  });
});

// @route POST /api/auth/reset-password
exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const entry = resetTokens.get(token);
  if (!entry || entry.expires < Date.now()) {
    throw new ApiError(400, 'Reset link is invalid or has expired.');
  }
  let decoded;
  try {
    decoded = verifyResetToken(token);
  } catch {
    throw new ApiError(400, 'Reset link is invalid or has expired.');
  }
  if (decoded.id !== entry.userId) throw new ApiError(400, 'Reset link is invalid.');

  const user = await User.findById(entry.userId).select('+password');
  if (!user) throw new ApiError(400, 'Account no longer exists.');

  user.password = password;
  await user.save();
  resetTokens.delete(token);

  sendResponse(res, 200, { message: 'Password has been reset. Please log in.' });
});

// @route PUT /api/auth/change-password
exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword))) {
    throw new ApiError(400, 'Current password is incorrect.');
  }
  user.password = newPassword;
  await user.save();
  sendResponse(res, 200, { message: 'Password updated successfully.' });
});
