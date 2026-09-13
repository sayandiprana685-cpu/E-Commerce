import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiShoppingCart, FiX } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Rating from './Rating';
import { formatPrice, finalPrice } from '../utils/format';

const QuickView = ({ product, open, onClose }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  if (!open || !product) return null;

  const final = finalPrice(product.price, product.discountPercentage);

  const handleAdd = async () => {
    if (!user) return toast('Please log in to add items to your cart.', 'warning');
    try {
      await addToCart(product._id, 1);
      toast('Added to cart.', 'success');
      onClose();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-box"
        style={{ width: 'min(680px, 100%)' }}
        initial={{ scale: 0.92, y: 20, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 20, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h3>Quick View</h3>
          <button className="modal-x" onClick={onClose} aria-label="Close">
            <FiX />
          </button>
        </div>
        <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          <div style={{ borderRadius: 14, overflow: 'hidden', background: '#f4f5f9', aspectRatio: 1 }}>
            <img src={product.images?.[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="small muted" style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.72rem' }}>
              {product.brand?.name || product.category?.name}
            </span>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, lineHeight: 1.35 }}>{product.name}</h2>
            <Rating value={product.ratingsAverage} count={product.ratingsQuantity} />
            <div className="flex-center gap-12">
              <span className="price-final" style={{ fontSize: '1.3rem' }}>{formatPrice(final)}</span>
              {product.discountPercentage > 0 && <span className="price-strike">{formatPrice(product.price)}</span>}
              {product.discountPercentage > 0 && <span className="discount-badge">-{product.discountPercentage}%</span>}
            </div>
            <p className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>
            <span className={`badge ${product.stock > 0 ? 'badge-success' : 'badge-danger'}`}>
              {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
            </span>
            <div style={{ display: 'flex', gap: 10, marginTop: 6 }}>
              <button className="btn btn-primary" onClick={handleAdd} disabled={product.stock < 1} style={{ flex: 1 }}>
                <FiShoppingCart /> Add to Cart
              </button>
              <Link to={`/product/${product.slug}`} className="btn btn-outline" onClick={onClose} style={{ flex: 1 }}>
                Full Details
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuickView;
