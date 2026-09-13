const Category = require('../models/Category');
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

// @route GET /api/categories
exports.getCategories = asyncHandler(async (req, res) => {
  const categories = await Category.find().sort('name');
  sendResponse(res, 200, { data: { categories } });
});

// @route POST /api/admin/categories
exports.createCategory = asyncHandler(async (req, res) => {
  const { name, description, image, isFeatured } = req.body;
  const exists = await Category.findOne({ slug: slugify(name) });
  if (exists) throw new ApiError(409, 'Category already exists.');
  const category = await Category.create({
    name,
    slug: slugify(name),
    description: description || '',
    image: image || '',
    isFeatured: !!isFeatured,
  });
  sendResponse(res, 201, { message: 'Category created.', data: { category } });
});

// @route PUT /api/admin/categories/:id
exports.updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  if (req.body.name) {
    category.name = req.body.name;
    category.slug = slugify(req.body.name);
  }
  ['description', 'image', 'isFeatured'].forEach((f) => {
    if (req.body[f] !== undefined) category[f] = req.body[f];
  });
  await category.save();
  sendResponse(res, 200, { message: 'Category updated.', data: { category } });
});

// @route DELETE /api/admin/categories/:id
exports.deleteCategory = asyncHandler(async (req, res) => {
  const Product = require('../models/Product');
  const count = await Product.countDocuments({ category: req.params.id, status: { $ne: 'deleted' } });
  if (count > 0) throw new ApiError(400, `Cannot delete: ${count} product(s) use this category.`);
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) throw new ApiError(404, 'Category not found.');
  sendResponse(res, 200, { message: 'Category deleted.' });
});
