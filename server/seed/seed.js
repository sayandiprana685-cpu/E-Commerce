/**
 * Vendora database seeder
 * Usage: npm run seed
 * Creates admin (from .env), demo sellers, buyers, categories, brands,
 * products, coupons, orders and reviews.
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('../config/db');

const User = require('../models/User');
const Category = require('../models/Category');
const Brand = require('../models/Brand');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const Review = require('../models/Review');
const Coupon = require('../models/Coupon');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');

const PALETTE = [
  ['#6366f1', '#a855f7'],
  ['#0ea5e9', '#6366f1'],
  ['#10b981', '#0ea5e9'],
  ['#f59e0b', '#ef4444'],
  ['#ec4899', '#8b5cf6'],
  ['#14b8a6', '#22c55e'],
  ['#f97316', '#f59e0b'],
  ['#64748b', '#334155'],
  ['#3b82f6', '#06b6d4'],
  ['#a855f7', '#ec4899'],
];

const svgImage = (label, idx) => {
  const [c1, c2] = PALETTE[idx % PALETTE.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="600" fill="url(#g)"/><circle cx="470" cy="130" r="180" fill="rgba(255,255,255,0.12)"/><circle cx="120" cy="480" r="140" fill="rgba(255,255,255,0.10)"/><text x="300" y="290" font-family="Segoe UI,Arial,sans-serif" font-size="64" font-weight="700" fill="rgba(255,255,255,0.95)" text-anchor="middle">${label}</text><text x="300" y="350" font-family="Segoe UI,Arial,sans-serif" font-size="26" fill="rgba(255,255,255,0.75)" text-anchor="middle">VENDORA</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const slugify = (t) =>
  t.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];

const run = async () => {
  await connectDB();

  console.log('Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Category.deleteMany({}),
    Brand.deleteMany({}),
    Product.deleteMany({}),
    Cart.deleteMany({}),
    Wishlist.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
    Coupon.deleteMany({}),
    Payment.deleteMany({}),
    Notification.deleteMany({}),
  ]);

  console.log('Creating users...');
  const admin = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email: process.env.ADMIN_EMAIL || 'admin@vendora.com',
    password: process.env.ADMIN_PASSWORD || 'Admin@123',
    role: 'admin',
  });

  const sellerDefs = [
    {
      name: 'Ravi Kumar',
      email: 'seller@vendora.com',
      password: 'Seller@123',
      shopName: 'TechNova Store',
      shopDescription: 'Premium electronics and gadgets at unbeatable prices.',
      status: 'verified',
    },
    {
      name: 'Priya Sharma',
      email: 'seller2@vendora.com',
      password: 'Seller@123',
      shopName: 'Urban Threads',
      shopDescription: 'Trendy fashion for the modern wardrobe.',
      status: 'verified',
    },
    {
      name: 'Arjun Mehta',
      email: 'seller3@vendora.com',
      password: 'Seller@123',
      shopName: 'HomeCraft Living',
      shopDescription: 'Beautiful home and kitchen essentials.',
      status: 'pending',
    },
  ];
  const sellers = [];
  for (const s of sellerDefs) {
    const { name, email, password, ...info } = s;
    sellers.push(await User.create({ name, email, password, role: 'seller', sellerInfo: info }));
  }

  const buyerDefs = [
    { name: 'Ananya Das', email: 'buyer@vendora.com', password: 'Buyer@123' },
    { name: 'Rahul Verma', email: 'buyer2@vendora.com', password: 'Buyer@123' },
    { name: 'Sneha Iyer', email: 'buyer3@vendora.com', password: 'Buyer@123' },
  ];
  const buyers = [];
  for (const b of buyerDefs) {
    buyers.push(
      await User.create({
        ...b,
        role: 'buyer',
        addresses: [
          {
            label: 'Home',
            fullName: b.name,
            phone: `98${rand(10000000, 99999999)}`,
            line1: `${rand(1, 200)}, Green Park Colony`,
            city: pick(['Mumbai', 'Delhi', 'Bengaluru', 'Kolkata', 'Pune']),
            state: pick(['Maharashtra', 'Delhi', 'Karnataka', 'West Bengal']),
            pincode: `${rand(400001, 700099)}`,
            country: 'India',
            isDefault: true,
          },
        ],
      })
    );
  }

  console.log('Creating categories and brands...');
  const categoryDefs = [
    { name: 'Electronics', featured: true },
    { name: 'Fashion', featured: true },
    { name: 'Home & Kitchen', featured: true },
    { name: 'Beauty', featured: true },
    { name: 'Sports', featured: true },
    { name: 'Books', featured: true },
    { name: 'Toys & Games', featured: false },
    { name: 'Footwear', featured: true },
  ];
  const categories = [];
  for (let i = 0; i < categoryDefs.length; i++) {
    const c = categoryDefs[i];
    categories.push(
      await Category.create({
        name: c.name,
        slug: slugify(c.name),
        description: `Shop the best ${c.name.toLowerCase()} products on Vendora.`,
        isFeatured: c.featured,
        image: svgImage(c.name.split(' ')[0].slice(0, 4).toUpperCase(), i),
      })
    );
  }

  const brandDefs = ['NovaTech', 'Zephyr', 'Aurelia', 'UrbanFit', 'Lumina', 'Craftly', 'Everest', 'Momentum'];
  const brands = [];
  for (let i = 0; i < brandDefs.length; i++) {
    brands.push(
      await Brand.create({
        name: brandDefs[i],
        slug: slugify(brandDefs[i]),
        description: `${brandDefs[i]} — quality you can trust.`,
        isFeatured: i < 6,
        logo: svgImage(brandDefs[i].slice(0, 2).toUpperCase(), i + 3),
      })
    );
  }

  console.log('Creating products...');
  const electronicsSeller = sellers[0];
  const fashionSeller = sellers[1];
  const homeSeller = sellers[2];

  const productDefs = [
    // Electronics (TechNova)
    { name: 'NovaTech Pulse X Wireless Earbuds', category: 'Electronics', brand: 'NovaTech', seller: 0, price: 2999, discount: 35, specs: [['Battery', '32 hours with case'], ['Driver', '12mm dynamic'], ['Bluetooth', 'v5.3'], ['Water resistance', 'IPX5']], tags: ['earbuds', 'audio', 'wireless'] },
    { name: 'NovaTech Volt 65W GaN Fast Charger', category: 'Electronics', brand: 'NovaTech', seller: 0, price: 1499, discount: 25, specs: [['Output', '65W max'], ['Ports', '2x USB-C, 1x USB-A'], ['Technology', 'GaN II']], tags: ['charger', 'fast charging'] },
    { name: 'Zephyr AirBook 14 Laptop', category: 'Electronics', brand: 'Zephyr', seller: 0, price: 54999, discount: 12, specs: [['Processor', 'Intel Core i5-13th Gen'], ['RAM', '16GB LPDDR5'], ['Storage', '512GB NVMe SSD'], ['Display', '14" 2.2K IPS']], tags: ['laptop', 'computer'] },
    { name: 'NovaTech SonicWave Bluetooth Speaker', category: 'Electronics', brand: 'NovaTech', seller: 0, price: 2199, discount: 30, specs: [['Battery', '18 hours'], ['Output', '20W RMS'], ['Rating', 'IPX7']], tags: ['speaker', 'audio'] },
    { name: 'Zephyr FitBand 5 Smartwatch', category: 'Electronics', brand: 'Zephyr', seller: 0, price: 3499, discount: 40, specs: [['Display', '1.6" AMOLED'], ['Battery', '10 days'], ['Sensors', 'HR, SpO2, sleep']], tags: ['smartwatch', 'wearable'] },
    { name: 'Lumina ProStudio 4K Webcam', category: 'Electronics', brand: 'Lumina', seller: 0, price: 4999, discount: 15, specs: [['Resolution', '4K @30fps'], ['Field of view', '90°'], ['Mic', 'Dual noise-cancelling']], tags: ['webcam', 'streaming'] },
    { name: 'NovaTech PowerCell 20000mAh Power Bank', category: 'Electronics', brand: 'NovaTech', seller: 0, price: 1899, discount: 28, specs: [['Capacity', '20000mAh'], ['Output', '22.5W fast charge'], ['Ports', 'USB-C + 2x USB-A']], tags: ['power bank'] },
    { name: 'Zephyr TabSlate 11 Tablet', category: 'Electronics', brand: 'Zephyr', seller: 0, price: 27999, discount: 10, specs: [['Display', '11" 2K LCD'], ['RAM', '8GB'], ['Storage', '256GB']], tags: ['tablet'] },
    { name: 'Lumina ViewCast HDMI 2.1 Cable 2m', category: 'Electronics', brand: 'Lumina', seller: 0, price: 799, discount: 20, specs: [['Version', 'HDMI 2.1'], ['Length', '2 meters'], ['Supports', '8K@60Hz']], tags: ['cable', 'hdmi'] },
    { name: 'Momentum Gaming Mouse GM-7', category: 'Electronics', brand: 'Momentum', seller: 0, price: 1699, discount: 22, specs: [['Sensor', '26K DPI optical'], ['Buttons', '8 programmable'], ['Weight', '89g']], tags: ['mouse', 'gaming'] },

    // Fashion (Urban Threads)
    { name: 'UrbanFit Classic Cotton T-Shirt', category: 'Fashion', brand: 'UrbanFit', seller: 1, price: 599, discount: 33, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'S' }, { name: 'Size', value: 'M' }, { name: 'Size', value: 'L' }, { name: 'Size', value: 'XL' }] }, { name: 'Color', options: [{ name: 'Color', value: 'Black' }, { name: 'Color', value: 'White' }, { name: 'Color', value: 'Navy' }] }], specs: [['Material', '100% combed cotton'], ['Fit', 'Regular']], tags: ['tshirt', 'clothing'] },
    { name: 'Aurelia Denim Jacket', category: 'Fashion', brand: 'Aurelia', seller: 1, price: 2499, discount: 30, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'S' }, { name: 'Size', value: 'M' }, { name: 'Size', value: 'L' }] }], specs: [['Material', 'Cotton denim'], ['Wash', 'Mid-blue stone wash']], tags: ['jacket', 'denim'] },
    { name: 'UrbanFit Slim-Fit Chinos', category: 'Fashion', brand: 'UrbanFit', seller: 1, price: 1299, discount: 25, variants: [{ name: 'Size', options: [{ name: 'Size', value: '30' }, { name: 'Size', value: '32' }, { name: 'Size', value: '34' }] }], specs: [['Material', 'Cotton twill'], ['Fit', 'Slim']], tags: ['chinos', 'pants'] },
    { name: 'Aurelia Floral Summer Dress', category: 'Fashion', brand: 'Aurelia', seller: 1, price: 1899, discount: 40, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'S' }, { name: 'Size', value: 'M' }, { name: 'Size', value: 'L' }] }], specs: [['Material', 'Rayon'], ['Length', 'Midi']], tags: ['dress', 'summer'] },
    { name: 'UrbanFit Activewear Track Pants', category: 'Fashion', brand: 'UrbanFit', seller: 1, price: 999, discount: 20, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'M' }, { name: 'Size', value: 'L' }, { name: 'Size', value: 'XL' }] }], specs: [['Material', 'Polyester blend'], ['Features', 'Zip pockets']], tags: ['track pants', 'activewear'] },
    { name: 'Aurelia Leather Crossbody Bag', category: 'Fashion', brand: 'Aurelia', seller: 1, price: 2999, discount: 35, specs: [['Material', 'Vegan leather'], ['Capacity', '4L']], tags: ['bag', 'handbag'] },
    { name: 'UrbanFit Hooded Sweatshirt', category: 'Fashion', brand: 'UrbanFit', seller: 1, price: 1399, discount: 28, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'M' }, { name: 'Size', value: 'L' }, { name: 'Size', value: 'XL' }] }, { name: 'Color', options: [{ name: 'Color', value: 'Grey' }, { name: 'Color', value: 'Maroon' }] }], specs: [['Material', 'Fleece cotton'], ['Fit', 'Oversized']], tags: ['hoodie', 'sweatshirt'] },

    // Footwear
    { name: 'Momentum Runner Pro Shoes', category: 'Footwear', brand: 'Momentum', seller: 1, price: 3299, discount: 30, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'UK 7' }, { name: 'Size', value: 'UK 8' }, { name: 'Size', value: 'UK 9' }] }], specs: [['Upper', 'Engineered mesh'], ['Sole', 'EVA foam']], tags: ['shoes', 'running'] },
    { name: 'Everest Trail Hiking Boots', category: 'Footwear', brand: 'Everest', seller: 1, price: 4499, discount: 18, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'UK 8' }, { name: 'Size', value: 'UK 9' }] }], specs: [['Upper', 'Nubuck leather'], ['Membrane', 'Waterproof']], tags: ['boots', 'hiking'] },
    { name: 'UrbanFit Everyday Canvas Sneakers', category: 'Footwear', brand: 'UrbanFit', seller: 1, price: 1599, discount: 25, variants: [{ name: 'Size', options: [{ name: 'Size', value: 'UK 6' }, { name: 'Size', value: 'UK 7' }, { name: 'Size', value: 'UK 8' }] }], specs: [['Upper', 'Canvas'], ['Sole', 'Vulcanized rubber']], tags: ['sneakers', 'casual'] },

    // Home & Kitchen (Craftly + HomeCraft)
    { name: 'Craftly Ceramic Dinner Set (16 pcs)', category: 'Home & Kitchen', brand: 'Craftly', seller: 2, price: 3499, discount: 32, specs: [['Material', 'Stoneware ceramic'], ['Pieces', '16'], ['Microwave safe', 'Yes']], tags: ['dinner set', 'kitchen'] },
    { name: 'Craftly Bamboo Cutting Board', category: 'Home & Kitchen', brand: 'Craftly', seller: 2, price: 799, discount: 15, specs: [['Material', 'Moso bamboo'], ['Size', '38 x 25 cm']], tags: ['cutting board'] },
    { name: 'Lumina Aroma Diffuser + 3 Oils', category: 'Home & Kitchen', brand: 'Lumina', seller: 2, price: 1499, discount: 38, specs: [['Capacity', '300ml'], ['Runtime', '8 hours'], ['Includes', '3 essential oils']], tags: ['diffuser', 'aroma'] },
    { name: 'Craftly Stainless Steel Cookware Set', category: 'Home & Kitchen', brand: 'Craftly', seller: 2, price: 5999, discount: 25, specs: [['Material', 'Triply stainless steel'], ['Pieces', '5'], ['Induction ready', 'Yes']], tags: ['cookware'] },
    { name: 'Lumina LED Desk Lamp with Wireless Charging', category: 'Home & Kitchen', brand: 'Lumina', seller: 2, price: 1899, discount: 20, specs: [['Brightness', '1000 lumens'], ['Charging', '10W Qi wireless'], ['Modes', '5 color temps']], tags: ['lamp', 'desk'] },
    { name: 'Craftly Memory Foam Pillow (2 pcs)', category: 'Home & Kitchen', brand: 'Craftly', seller: 2, price: 1699, discount: 30, specs: [['Filling', 'Memory foam'], ['Cover', 'Bamboo viscose'], ['Count', '2']], tags: ['pillow', 'bedding'] },

    // Beauty
    { name: 'Aurelia Glow Vitamin C Serum', category: 'Beauty', brand: 'Aurelia', seller: 2, price: 899, discount: 35, specs: [['Volume', '30ml'], ['Key ingredient', '15% Vitamin C']], tags: ['serum', 'skincare'] },
    { name: 'Aurelia Rosewater Face Mist', category: 'Beauty', brand: 'Aurelia', seller: 2, price: 399, discount: 10, specs: [['Volume', '120ml'], ['Type', 'Alcohol-free mist']], tags: ['face mist'] },
    { name: 'Lumina Luxe Matte Lipstick Set', category: 'Beauty', brand: 'Lumina', seller: 1, price: 1299, discount: 22, variants: [{ name: 'Shade', options: [{ name: 'Shade', value: 'Coral' }, { name: 'Shade', value: 'Ruby' }, { name: 'Shade', value: 'Nude' }] }], specs: [['Finish', 'Matte'], ['Count', '3 shades']], tags: ['lipstick', 'makeup'] },

    // Sports
    { name: 'Momentum Yoga Mat 6mm', category: 'Sports', brand: 'Momentum', seller: 0, price: 899, discount: 18, specs: [['Thickness', '6mm'], ['Material', 'TPE'], ['Includes', 'Carry strap']], tags: ['yoga', 'fitness'] },
    { name: 'Everest Adjustable Dumbbell 10kg', category: 'Sports', brand: 'Everest', seller: 0, price: 2199, discount: 15, specs: [['Weight', '10kg'], ['Type', 'Adjustable']], tags: ['dumbbell', 'gym'] },
    { name: 'Momentum Resistance Band Set (5)', category: 'Sports', brand: 'Momentum', seller: 0, price: 599, discount: 33, specs: [['Levels', '5 resistance levels'], ['Material', 'Natural latex']], tags: ['resistance bands'] },
    { name: 'Everest Camping Tent 4-Person', category: 'Sports', brand: 'Everest', seller: 2, price: 4999, discount: 20, specs: [['Capacity', '4 person'], ['Season', '3-season'], ['Setup', 'Pop-up']], tags: ['tent', 'camping'] },

    // Books
    { name: 'The Silent Algorithm - Tech Thriller', category: 'Books', brand: null, seller: 1, price: 449, discount: 20, specs: [['Author', 'A. Krishnan'], ['Pages', '412'], ['Format', 'Paperback']], tags: ['book', 'thriller'] },
    { name: 'Mastering Modern JavaScript', category: 'Books', brand: null, seller: 0, price: 699, discount: 25, specs: [['Author', 'S. Reddy'], ['Pages', '560'], ['Edition', '3rd']], tags: ['book', 'programming'] },
    { name: 'Mindful Living: A Daily Guide', category: 'Books', brand: null, seller: 1, price: 399, discount: 10, specs: [['Author', 'M. Fernandes'], ['Pages', '288']], tags: ['book', 'wellness'] },

    // Toys & Games
    { name: 'Craftly Wooden Building Blocks (100 pcs)', category: 'Toys & Games', brand: 'Craftly', seller: 2, price: 1299, discount: 20, specs: [['Pieces', '100'], ['Material', 'Neem wood'], ['Age', '3+']], tags: ['blocks', 'kids'] },
    { name: 'Momentum Table Tennis Racket Set', category: 'Toys & Games', brand: 'Momentum', seller: 0, price: 899, discount: 15, specs: [['Included', '2 rackets + 3 balls'], ['Blade', '5-ply wood']], tags: ['table tennis'] },
  ];

  const products = [];
  for (let i = 0; i < productDefs.length; i++) {
    const d = productDefs[i];
    const category = categories.find((c) => c.name === d.category);
    const brand = d.brand ? brands.find((b) => b.name === d.brand) : null;
    const seller = sellers[d.seller];
    const initials = d.name.split(' ').map((w) => w[0]).join('').slice(0, 3).toUpperCase();
    products.push(
      await Product.create({
        name: d.name,
        slug: `${slugify(d.name)}-${i + 1}`,
        description: `${d.name} — a premium quality product from ${brand ? brand.name : 'Vendora Marketplace'}. ${d.category === 'Books' ? 'A must-read addition to your collection.' : 'Built to last with careful attention to detail and backed by excellent customer service.'} Enjoy fast delivery, easy returns and complete buyer protection on every purchase from Vendora.`,
        images: [svgImage(initials, i), svgImage(initials, i + 4), svgImage(initials, i + 8)],
        category: category._id,
        brand: brand ? brand._id : null,
        seller: seller._id,
        price: d.price,
        discountPercentage: d.discount,
        stock: rand(3, 80),
        sku: `VND-${String(i + 1).padStart(4, '0')}`,
        variants: d.variants || [],
        specifications: (d.specs || []).map(([key, value]) => ({ key, value })),
        tags: d.tags,
        isFeatured: i < 12,
        isNewArrival: i >= productDefs.length - 14,
        flashSale: i % 7 === 0 ? { isActive: true, endsAt: new Date(Date.now() + 3 * 24 * 3600 * 1000) } : { isActive: false },
        soldCount: rand(0, 120),
      })
    );
  }

  console.log('Creating coupons...');
  await Coupon.create([
    { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 999, maxDiscount: 500, usageLimit: 500, expiresAt: new Date(Date.now() + 90 * 24 * 3600 * 1000) },
    { code: 'FLAT200', type: 'flat', value: 200, minOrderAmount: 1499, usageLimit: 300, expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000) },
    { code: 'MEGA25', type: 'percentage', value: 25, minOrderAmount: 4999, maxDiscount: 2000, usageLimit: 100, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
  ]);

  console.log('Creating orders...');
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'delivered', 'delivered', 'cancelled'];
  const payments = [];
  const orders = [];
  for (let i = 0; i < 26; i++) {
    const buyer = pick(buyers);
    const itemCount = rand(1, 3);
    const chosen = [];
    while (chosen.length < itemCount) {
      const p = pick(products);
      if (!chosen.includes(p)) chosen.push(p);
    }
    const items = chosen.map((p) => ({
      product: p._id,
      seller: p.seller,
      name: p.name,
      image: p.images[0],
      price: Math.round(p.price * (1 - p.discountPercentage / 100)),
      quantity: rand(1, 2),
      variantSelection: {},
    }));
    const itemsTotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const shippingFee = itemsTotal >= 499 ? 0 : 49;
    const daysAgo = rand(0, 45);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 3600 * 1000);
    const status = statuses[i % statuses.length];
    const paymentMethod = pick(['cod', 'card', 'upi']);
    const isPaid = paymentMethod !== 'cod';

    const order = await Order.create({
      user: buyer._id,
      items,
      shippingAddress: buyer.addresses[0],
      itemsTotal,
      shippingFee,
      total: itemsTotal + shippingFee,
      status,
      paymentMethod,
      isPaid: isPaid && status !== 'cancelled',
      paymentStatus: status === 'cancelled' ? (isPaid ? 'refunded' : 'pending') : isPaid ? 'paid' : status === 'delivered' ? 'paid' : 'pending',
      paidAt: isPaid ? createdAt : null,
      deliveredAt: status === 'delivered' ? new Date(createdAt.getTime() + 4 * 24 * 3600 * 1000) : null,
      statusHistory: [{ status: 'pending', note: 'Order placed', at: createdAt }],
      createdAt,
      updatedAt: createdAt,
    });

    if (isPaid) {
      const payment = await Payment.create({
        order: order._id,
        user: buyer._id,
        amount: order.total,
        method: paymentMethod,
        status: order.paymentStatus === 'refunded' ? 'refunded' : 'paid',
        refundedAmount: order.paymentStatus === 'refunded' ? order.total : 0,
        refundedAt: order.paymentStatus === 'refunded' ? new Date() : null,
      });
      order.payment = payment._id;
      await order.save();
      payments.push(payment);
    }
    orders.push(order);
  }

  console.log('Creating reviews...');
  const reviewTexts = [
    ['Excellent product!', 'Exactly as described. Delivery was quick and packaging was neat. Highly recommended.'],
    ['Good value for money', 'Works well for the price. Would buy from this seller again.'],
    ['Pretty decent', 'Quality is good, though delivery took a day longer than expected.'],
    ['Absolutely love it', 'Exceeded my expectations. The build quality is fantastic for this price range.'],
    ['Satisfactory', 'Does the job. Nothing extraordinary but no complaints either.'],
    ['Great purchase', 'Gifted it to my sister and she loved it. Five stars from me.'],
  ];
  const deliveredOrders = orders.filter((o) => o.status === 'delivered');
  let reviewIdx = 0;
  for (const order of deliveredOrders) {
    for (const item of order.items) {
      if (Math.random() > 0.6) continue;
      const existing = await Review.findOne({ product: item.product, user: order.user });
      if (existing) continue;
      const [title, comment] = reviewTexts[reviewIdx % reviewTexts.length];
      reviewIdx++;
      await Review.create({
        product: item.product,
        user: order.user,
        order: order._id,
        rating: pick([4, 5, 5, 3, 4]),
        title,
        comment,
        isVerifiedPurchase: true,
      });
    }
  }

  // recalculate ratings
  const allProducts = await Product.find();
  for (const p of allProducts) {
    await Review.recalculateProductRating(p._id);
  }

  console.log('Creating notifications...');
  await Notification.create([
    { recipient: buyers[0]._id, title: 'Welcome to Vendora', message: 'Explore flash sales and grab up to 40% off on trending products!', type: 'promo', link: '/shop' },
    { audience: 'all', title: 'Mega Sale is live', message: 'Flat 25% off on orders above ₹4,999. Use code MEGA25 at checkout.', type: 'promo', link: '/shop' },
    { audience: 'sellers', title: 'Payout schedule updated', message: 'Seller payouts now settle every Tuesday and Friday.', type: 'info', link: '/seller' },
  ]);

  console.log('\n========== SEED COMPLETE ==========');
  console.log(`Users: admin + ${sellers.length} sellers + ${buyers.length} buyers`);
  console.log(`Categories: ${categories.length}, Brands: ${brands.length}`);
  console.log(`Products: ${products.length}, Orders: ${orders.length}`);
  console.log('\nDemo credentials:');
  console.log(`  Admin  : ${admin.email} / ${process.env.ADMIN_PASSWORD || 'Admin@123'}`);
  console.log('  Seller : seller@vendora.com / Seller@123');
  console.log('  Seller : seller2@vendora.com / Seller@123 (Urban Threads)');
  console.log('  Seller : seller3@vendora.com / Seller@123 (pending verification)');
  console.log('  Buyer  : buyer@vendora.com / Buyer@123');
  console.log('  Buyer  : buyer2@vendora.com / Buyer@123');
  console.log('===================================\n');

  await mongoose.connection.close();
};

run().catch(async (err) => {
  console.error('Seed failed:', err);
  await mongoose.connection.close().catch(() => {});
  process.exit(1);
});
