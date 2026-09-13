const Product = require('../models/Product');
const Review = require('../models/Review');
const Category = require('../models/Category');
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

const SORT_MAP = {
  newest: { createdAt: -1 },
  'price-asc': { price: 1 },
  'price-desc': { price: -1 },
  rating: { ratingsAverage: -1, ratingsQuantity: -1 },
  popular: { soldCount: -1 },
  relevance: { ratingsQuantity: -1 },
};

const PUBLIC_FIELDS =
  'name slug description images category brand seller price discountPercentage stock sku variants specifications tags ratingsAverage ratingsQuantity soldCount isFeatured isNewArrival flashSale status createdAt';

const buildProductQuery = (query) => {
  const filter = { status: { $ne: 'deleted' } };

  if (query.search) {
    filter.$or = [
      { name: { $regex: query.search, $options: 'i' } },
      { description: { $regex: query.search, $options: 'i' } },
      { tags: { $regex: query.search, $options: 'i' } },
    ];
  }
  if (query.category) {
    filter['category.slug'] = query.category;
  } else if (query.categoryId) {
    filter.category = query.categoryId;
  }
  if (query.brand) {
    filter['brand.slug'] = query.brand;
  } else if (query.brandId) {
    filter.brand = query.brandId;
  }
  if (query.minPrice || query.maxPrice) {
    filter.price = {};
    if (query.minPrice) filter.price.$gte = Number(query.minPrice);
    if (query.maxPrice) filter.price.$lte = Number(query.maxPrice);
  }
  if (query.rating) {
    filter.ratingsAverage = { $gte: Number(query.rating) };
  }
  if (query.featured === 'true') filter.isFeatured = true;
  if (query.flashSale === 'true') filter['flashSale.isActive'] = true;
  if (query.isNew === 'true') filter.isNewArrival = true;

  return filter;
};

// @route GET /api/products
exports.getProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(48, parseInt(req.query.limit) || 12);
  const filter = buildProductQuery(req.query);
  const sort = SORT_MAP[req.query.sort] || SORT_MAP.newest;

  const [items, total, categories, brands] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .populate('seller', 'name sellerInfo.shopName')
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .select(PUBLIC_FIELDS),
    Product.countDocuments(filter),
    Category.find().sort('name').select('name slug image'),
    Brand.find().sort('name').select('name slug logo'),
  ]);

  sendResponse(res, 200, {
    data: { products: items, categories, brands },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route GET /api/products/home
exports.getHomeSections = asyncHandler(async (req, res) => {
  const [featured, flashSale, newArrivals, bestSellers, trending, categories, brands, topReviews] =
    await Promise.all([
      Product.find({ status: 'active', isFeatured: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .limit(8)
        .sort({ createdAt: -1 }),
      Product.find({ status: 'active', 'flashSale.isActive': true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .limit(8)
        .sort({ 'flashSale.endsAt': 1 }),
      Product.find({ status: 'active', isNewArrival: true })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .limit(8)
        .sort({ createdAt: -1 }),
      Product.find({ status: 'active', soldCount: { $gt: 0 } })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort({ soldCount: -1 })
        .limit(8),
      Product.find({ status: 'active', ratingsQuantity: { $gte: 1 } })
        .populate('category', 'name slug')
        .populate('brand', 'name slug')
        .sort({ ratingsAverage: -1, ratingsQuantity: -1 })
        .limit(8),
      Category.find({ isFeatured: true }).sort('name').limit(12).select('name slug image'),
      Brand.find({ isFeatured: true }).sort('name').limit(10).select('name slug logo'),
      Review.find({ status: 'visible', rating: { $gte: 4 } })
        .populate('user', 'name avatar')
        .populate('product', 'name slug images')
        .sort({ createdAt: -1 })
        .limit(8),
    ]);

  sendResponse(res, 200, {
    data: {
      featured: featured.length ? featured : bestSellers.slice(0, 4),
      flashSale,
      newArrivals,
      bestSellers,
      trending,
      categories,
      brands,
      topReviews,
    },
  });
});

// @route GET /api/products/:idOrSlug
exports.getProductById = asyncHandler(async (req, res) => {
  const { idOrSlug } = req.params;
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
  const product = await Product.findOne(
    isObjectId ? { _id: idOrSlug, status: { $ne: 'deleted' } } : { slug: idOrSlug, status: { $ne: 'deleted' } }
  )
    .populate('category', 'name slug')
    .populate('brand', 'name slug')
    .populate('seller', 'name sellerInfo.shopName sellerInfo.status');

  if (!product) throw new ApiError(404, 'Product not found.');

  const related = await Product.find({
    _id: { $ne: product._id },
    status: 'active',
    category: product.category._id,
  })
    .limit(4)
    .populate('brand', 'name slug');

  const reviews = await Review.find({ product: product._id, status: 'visible' })
    .populate('user', 'name avatar')
    .sort({ createdAt: -1 })
    .limit(20);

  sendResponse(res, 200, { data: { product, related, reviews } });
});

// ---- Seller product management ----

// @route GET /api/seller/products
exports.getSellerProducts = asyncHandler(async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(50, parseInt(req.query.limit) || 10);
  const filter = { seller: req.user._id, status: { $ne: 'deleted' } };
  if (req.query.search) {
    filter.name = { $regex: req.query.search, $options: 'i' };
  }
  if (req.query.category) filter['category.slug'] = req.query.category;

  const [items, total] = await Promise.all([
    Product.find(filter)
      .populate('category', 'name slug')
      .populate('brand', 'name slug')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);

  sendResponse(res, 200, {
    data: { products: items },
    meta: { page, limit, total, totalPages: Math.ceil(total / limit) || 1 },
  });
});

// @route POST /api/seller/products
exports.createProduct = asyncHandler(async (req, res) => {
  const {
    name,
    description,
    categoryId,
    brandId,
    price,
    discountPercentage,
    stock,
    sku,
    variants,
    specifications,
    tags,
    images,
    isFeatured,
    isNewArrival,
    flashSale,
  } = req.body;

  const [category, brand] = await Promise.all([
    Category.findById(categoryId),
    brandId ? Brand.findById(brandId) : Promise.resolve(null),
  ]);
  if (!category) throw new ApiError(400, 'Invalid category.');

  const finalSku = sku || `SKU-${Date.now().toString(36).toUpperCase()}`;
  const skuExists = await Product.findOne({ sku: finalSku });
  if (skuExists) throw new ApiError(409, 'SKU already exists.');

  let slug = slugify(name);
  const slugExists = await Product.findOne({ slug });
  if (slugExists) slug = `${slug}-${Date.now().toString(36)}`;

  const product = await Product.create({
    name,
    slug,
    description,
    images: images && images.length ? images : ['placeholder'],
    category: category._id,
    brand: brand ? brand._id : null,
    seller: req.user._id,
    price,
    discountPercentage: discountPercentage || 0,
    stock: stock || 0,
    sku: finalSku,
    variants: variants || [],
    specifications: specifications || [],
    tags: tags || [],
    isFeatured: !!isFeatured,
    isNewArrival: isNewArrival !== undefined ? !!isNewArrival : true,
    flashSale: flashSale || { isActive: false },
  });

  sendResponse(res, 201, { message: 'Product created.', data: { product } });
});

// @route PUT /api/seller/products/:id
exports.updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
  if (!product) throw new ApiError(404, 'Product not found.');

  const isOwner = String(product.seller) === String(req.user._id);
  const isAdmin = req.user.role === 'admin';
  if (!isOwner && !isAdmin) throw new ApiError(403, 'You can only manage your own products.');

  const allowed = [
    'name',
    'description',
    'images',
    'price',
    'discountPercentage',
    'stock',
    'variants',
    'specifications',
    'tags',
    'isFeatured',
    'isNewArrival',
    'flashSale',
    'status',
  ];
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) product[field] = req.body[field];
  });
  if (req.body.categoryId) product.category = req.body.categoryId;
  if (req.body.brandId !== undefined) product.brand = req.body.brandId || null;
  if (req.body.name && req.body.name !== product.name) {
    // keep slug stable; only regenerate on explicit name change
    product.slug = `${slugify(req.body.name)}-${Date.now().toString(36)}`;
  }

  await product.save();
  sendResponse(res, 200, { message: 'Product updated.', data: { product } });
});

// @route DELETE /api/seller/products/:id
exports.deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.id, status: { $ne: 'deleted' } });
  if (!product) throw new ApiError(404, 'Product not found.');

  const isOwner = String(product.seller) === String(req.user._id);
  if (!isOwner && req.user.role !== 'admin') throw new ApiError(403, 'You can only delete your own products.');

  product.status = 'deleted';
  await product.save();
  sendResponse(res, 200, { message: 'Product deleted.' });
});
