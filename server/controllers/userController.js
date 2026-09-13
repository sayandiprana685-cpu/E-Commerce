const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const sanitizeUser = (user) => {
  const obj = user.toObject({ virtuals: false });
  delete obj.password;
  delete obj.__v;
  return obj;
};

// @route PUT /api/users/profile
exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findById(req.user._id);
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (avatar !== undefined) user.avatar = avatar;
  await user.save();
  sendResponse(res, 200, { message: 'Profile updated.', data: { user: sanitizeUser(user) } });
});

// @route GET /api/users/addresses
exports.getAddresses = asyncHandler(async (req, res) => {
  sendResponse(res, 200, { data: { addresses: req.user.addresses } });
});

// @route POST /api/users/addresses
exports.addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  if (user.addresses.length === 0) req.body.isDefault = true;
  user.addresses.push(req.body);
  await user.save();
  sendResponse(res, 201, {
    message: 'Address added.',
    data: { addresses: user.addresses, address: user.addresses[user.addresses.length - 1] },
  });
});

// @route PUT /api/users/addresses/:addressId
exports.updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');
  if (req.body.isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }
  Object.assign(address, req.body);
  await user.save();
  sendResponse(res, 200, { message: 'Address updated.', data: { addresses: user.addresses } });
});

// @route DELETE /api/users/addresses/:addressId
exports.deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  const address = user.addresses.id(req.params.addressId);
  if (!address) throw new ApiError(404, 'Address not found.');
  const wasDefault = address.isDefault;
  address.deleteOne();
  if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
  await user.save();
  sendResponse(res, 200, { message: 'Address removed.', data: { addresses: user.addresses } });
});
