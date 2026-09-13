const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

// @route GET /api/notifications
exports.getMyNotifications = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 15);
  const filter = {
    $or: [{ recipient: req.user._id }, { audience: req.user.role === 'admin' ? 'admins' : req.user.role === 'seller' ? 'sellers' : 'buyers' }, { audience: 'all' }],
  };

  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, isRead: false }),
  ]);

  sendResponse(res, 200, {
    data: { notifications },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1, unreadCount },
  });
});

// @route PUT /api/notifications/read
exports.markAllRead = asyncHandler(async (req, res) => {
  const filter = {
    $or: [{ recipient: req.user._id }, { audience: req.user.role === 'admin' ? 'admins' : req.user.role === 'seller' ? 'sellers' : 'buyers' }, { audience: 'all' }],
    isRead: false,
  };
  await Notification.updateMany(filter, { isRead: true });
  sendResponse(res, 200, { message: 'All notifications marked as read.' });
});

// @route PUT /api/notifications/:id/read
exports.markRead = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
  sendResponse(res, 200, { message: 'Notification marked as read.' });
});
