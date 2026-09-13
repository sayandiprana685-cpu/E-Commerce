import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiX } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import EmptyState from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';

const Wishlist = ({ embedded = false }) => {
  const [products, setProducts] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { addToCart } = useCart();
  const { toggle } = useWishlist();
  const toast = useToast();

  useEffect(() => {
    api
      .get('/wishlist')
      .then((res) => setProducts(res.data.data.products))
      .catch(() => setProducts([]));
  }, []);

  if (!products) {
    return (
      <div style={{ padding: embedded ? 0 : '40px 0 80px' }}>
        <GridSkeleton count={4} />
      </div>
    );
  }

  if (!products.length) {
    return (
      <div style={{ padding: embedded ? '30px 0' : '60px 0 80px' }}>
        <EmptyState
          icon={<FiHeart size={42} />}
          title="Your wishlist is empty"
          description="Tap the heart on any product to save it here for later."
          action={<Link to="/shop" className="btn btn-primary">Discover products</Link>}
        />
      </div>
    );
  }

  const moveToCart = async (product) => {
    setBusyId(product._id);
    try {
      await addToCart(product._id, 1);
      await toggle(product._id);
      setProducts((list) => list.filter((p) => p._id !== product._id));
      toast(`${product.name.slice(0, 30)} moved to cart.`, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const removeFromWishlist = async (product) => {
    try {
      await toggle(product._id);
      setProducts((list) => list.filter((p) => p._id !== product._id));
      toast('Removed from wishlist.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div style={{ padding: embedded ? 0 : '26px 0 80px' }}>
      {!embedded && (
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 22 }}>
          My Wishlist <span className="muted" style={{ fontSize: '1rem', fontWeight: 600 }}>({products.length})</span>
        </h1>
      )}
      <div className="grid grid-4">
        {products.map((p, i) => (
          <div key={p._id} style={{ position: 'relative' }}>
            <ProductCard product={p} index={i} />
            <button
              className="btn-icon"
              onClick={() => removeFromWishlist(p)}
              aria-label="Remove from wishlist"
              style={{ position: 'absolute', top: 10, left: 10, background: '#fff', border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)', zIndex: 2 }}
            >
              <FiX size={14} />
            </button>
            <button
              className="btn btn-secondary btn-sm btn-block"
              onClick={() => moveToCart(p)}
              disabled={busyId === p._id || p.stock < 1}
              style={{ marginTop: 8 }}
            >
              <FiShoppingCart size={14} /> {busyId === p._id ? 'Moving…' : p.stock < 1 ? 'Out of stock' : 'Move to Cart'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;
