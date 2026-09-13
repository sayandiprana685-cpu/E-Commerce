import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingCart, FiEye } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Rating from './Rating';
import QuickView from './QuickView';
import { formatPrice, finalPrice } from '../utils/format';

const ProductCard = ({ product, index = 0 }) => {
  const { addToCart } = useCart();
  const { toggle, inWishlist } = useWishlist();
  const { user } = useAuth();
  const toast = useToast();
  const [quickView, setQuickView] = useState(false);
  const [adding, setAdding] = useState(false);

  const final = finalPrice(product.price, product.discountPercentage);
  const wished = inWishlist(product._id);
  const outOfStock = product.stock < 1;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) return toast('Please log in to add items to your cart.', 'warning');
    if (outOfStock) return toast('This product is out of stock.', 'warning');
    setAdding(true);
    try {
      await addToCart(product._id, 1);
      toast(`${product.name.slice(0, 32)}... added to cart.`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) return toast('Please log in to use your wishlist.', 'warning');
    try {
      const res = await toggle(product._id);
      toast(res.message, res.data?.inWishlist ? 'success' : 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.35, delay: Math.min(index * 0.04, 0.3) }}
        whileHover={{ y: -5 }}
      >
        <Link to={`/product/${product.slug}`} className="card card-hover" style={{ display: 'block', overflow: 'hidden', height: '100%' }}>
          <div style={{ position: 'relative', aspectRatio: '1', background: '#f4f5f9', overflow: 'hidden' }}>
            <img
              src={product.images?.[0]}
              alt={product.name}
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.45s ease' }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
            />
            {product.discountPercentage > 0 && (
              <span className="discount-badge" style={{ position: 'absolute', top: 12, left: 12 }}>
                -{product.discountPercentage}% OFF
              </span>
            )}
            {outOfStock && (
              <span className="badge badge-danger" style={{ position: 'absolute', top: 12, right: 12 }}>
                Out of stock
              </span>
            )}
            <div
              style={{ position: 'absolute', right: 12, bottom: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
              onClick={(e) => e.preventDefault()}
            >
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleWishlist}
                className="btn-icon"
                aria-label="Wishlist"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: wished ? '#e11d48' : 'var(--muted)' }}
              >
                <FiHeart fill={wished ? '#e11d48' : 'transparent'} />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => setQuickView(true)}
                className="btn-icon"
                aria-label="Quick view"
                style={{ background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', color: 'var(--muted)' }}
              >
                <FiEye />
              </motion.button>
            </div>
          </div>
          <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            <span className="small muted" style={{ textTransform: 'uppercase', letterSpacing: '0.5px', fontSize: '0.7rem', fontWeight: 700 }}>
              {product.brand?.name || product.category?.name}
            </span>
            <h3
              style={{ fontSize: '0.92rem', fontWeight: 600, lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}
            >
              {product.name}
            </h3>
            <Rating value={product.ratingsAverage} count={product.ratingsQuantity} />
            <div className="flex-center gap-8" style={{ gap: 8 }}>
              <span className="price-final">{formatPrice(final)}</span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="price-strike">{formatPrice(product.price)}</span>
                </>
              )}
            </div>
            <button
              className="btn btn-primary btn-sm btn-block mt-8"
              onClick={handleAdd}
              disabled={adding || outOfStock}
            >
              <FiShoppingCart size={15} />
              {adding ? 'Adding…' : outOfStock ? 'Out of Stock' : 'Add to Cart'}
            </button>
          </div>
        </Link>
      </motion.div>

      <QuickView product={product} open={quickView} onClose={() => setQuickView(false)} />
    </>
  );
};

export default ProductCard;
