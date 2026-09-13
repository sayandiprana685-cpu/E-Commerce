const path = require('path');
const asyncHandler = require('../utils/asyncHandler');
const sendResponse = require('../utils/sendResponse');

// @route POST /api/upload/images
exports.uploadImages = asyncHandler(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return sendResponse(res, 400, { success: false, message: 'No files uploaded.' });
  }
  const urls = req.files.map((f) => `/uploads/${f.filename}`);
  sendResponse(res, 200, { message: 'Images uploaded.', data: { urls } });
});
