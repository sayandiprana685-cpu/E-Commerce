const Brand = require('../models/Brand');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const sendResponse = require('../utils/sendResponse');

const slugify = (text) =>
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

// @route GET /api/brands
exports.getBrands = asyncHandler(async (req, res) => {
  const brands = await Brand.find().sort('name');
  sendResponse(res, 200, { data: { brands } });
});

// @route POST /api/admin/brands
exports.createBrand = asyncHandler(async (req, res) => {
  const { name, description, logo, isFeatured } = req.body;
  const exists = await Brand.findOne({ slug: slugify(name) });
  if (exists) throw new ApiError(409, 'Brand already exists.');
  const brand = await Brand.create({
    name,
    slug: slugify(name),
    description: description || '',
    logo: logo || '',
    isFeatured: !!isFeatured,
  });
  sendResponse(res, 201, { message: 'Brand created.', data: { brand } });
});

// @route PUT /api/admin/brands/:id
exports.updateBrand = asyncHandler(async (req, res) => {
  const brand = await Brand.findById(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found.');
  if (req.body.name) {
    brand.name = req.body.name;
    brand.slug = slugify(req.body.name);
  }
  ['description', 'logo', 'isFeatured'].forEach((f) => {
    if (req.body[f] !== undefined) brand[f] = req.body[f];
  });
  await brand.save();
  sendResponse(res, 200, { message: 'Brand updated.', data: { brand } });
});

// @route DELETE /api/admin/brands/:id
exports.deleteBrand = asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const count = await Product.countDocuments({ brand: req.params.id, status: { $ne: 'deleted' } });
  if (count > 0) throw new ApiError(400, `Cannot delete: ${count} product(s) use this brand.`);
  const brand = await Brand.findByIdAndDelete(req.params.id);
  if (!brand) throw new ApiError(404, 'Brand not found.');
  sendResponse(res, 200, { message: 'Brand deleted.' });
});
