import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiTrash2, FiShoppingCart, FiArrowRight, FiTag, FiShoppingBag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import EmptyState from '../components/EmptyState';
import { formatPrice } from '../utils/format';
import { useToast } from '../context/ToastContext';

const FREE_SHIPPING_AT = 499;
const SHIPPING_FEE = 49;

const Cart = () => {
  const { items, totalItems, itemsTotal, updateQuantity, removeItem, clear, refreshCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();
  const [busyId, setBusyId] = useState(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    refreshCart().finally(() => setMounted(true));
  }, []);

  const shipping = itemsTotal >= FREE_SHIPPING_AT || itemsTotal === 0 ? 0 : SHIPPING_FEE;
  const awayFromFree = FREE_SHIPPING_AT - itemsTotal;

  const changeQty = async (item, quantity) => {
    if (quantity < 1) return;
    setBusyId(item._id);
    try {
      await updateQuantity(item._id, quantity);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  const doRemove = async (item) => {
    setBusyId(item._id);
    try {
      await removeItem(item._id);
      toast('Item removed from cart.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (!mounted) {
    return (
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <div className="skeleton" style={{ height: 120, borderRadius: 16, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 220, borderRadius: 16 }} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container" style={{ padding: '60px 0 80px' }}>
        <EmptyState
          icon={<FiShoppingCart size={42} />}
          title="Your cart is empty"
          description="Looks like you haven't added anything yet. Explore trending products and find something you love."
          action={<Link to="/shop" className="btn btn-primary">Start shopping</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '26px 0 80px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
          Shopping Cart <span className="muted" style={{ fontSize: '1rem', fontWeight: 600 }}>({totalItems} items)</span>
        </h1>
        <button className="btn btn-ghost btn-sm" onClick={() => clear().then(() => toast('Cart cleared.', 'info')).catch((e) => toast(e.message, 'error'))}>
          <FiTrash2 size={14} /> Clear cart
        </button>
      </div>

      {awayFromFree > 0 && (
        <div className="card" style={{ padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10, borderLeft: '3px solid var(--accent)' }}>
          <FiTag style={{ color: 'var(--accent)' }} />
          <span className="small">
            Add items worth <strong>{formatPrice(awayFromFree)}</strong> more to get <strong>FREE delivery</strong>
          </span>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 22, alignItems: 'start' }} className="cart-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {items.map((item, idx) => (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="card"
              style={{ padding: 16, display: 'flex', gap: 16, alignItems: 'center' }}
            >
              <Link to={`/product/${item.product?.slug || ''}`} className="cart-item-img">
                <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }} />
              </Link>
              <div style={{ flex: 1, minWidth: 0 }}>
                <Link to={`/product/${item.product?.slug || ''}`} style={{ fontWeight: 700, fontSize: '0.95rem', display: 'block' }}>
                  {item.name}
                </Link>
                {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
                  <div className="small muted" style={{ marginTop: 4 }}>
                    {Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(' • ')}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, flexWrap: 'wrap' }}>
                  <span className="price-final">{formatPrice(item.price)}</span>
                  <span className="small muted">each</span>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 10 }}>
                <div className="qty-stepper">
                  <button onClick={() => changeQty(item, item.quantity - 1)} disabled={busyId === item._id || item.quantity <= 1} aria-label="Decrease">−</button>
                  <span style={{ fontWeight: 700, minWidth: 28, textAlign: 'center' }}>{item.quantity}</span>
                  <button onClick={() => changeQty(item, item.quantity + 1)} disabled={busyId === item._id} aria-label="Increase">+</button>
                </div>
                <span style={{ fontWeight: 800 }}>{formatPrice(item.price * item.quantity)}</span>
                <button className="btn btn-ghost btn-sm" style={{ color: '#e11d48' }} onClick={() => doRemove(item)} disabled={busyId === item._id}>
                  <FiTrash2 size={14} /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="card" style={{ padding: 22, position: 'sticky', top: 90 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiShoppingBag /> Order Summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-between small">
              <span className="muted">Items ({totalItems})</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(itemsTotal)}</span>
            </div>
            <div className="flex-between small">
              <span className="muted">Delivery</span>
              <span style={{ fontWeight: 700, color: shipping === 0 ? 'var(--success)' : 'var(--ink)' }}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
            <div className="flex-between">
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>{formatPrice(itemsTotal + shipping)}</span>
            </div>
          </div>
          <button className="btn btn-primary btn-lg btn-block mt-16" onClick={() => navigate('/checkout')}>
            Proceed to Checkout <FiArrowRight />
          </button>
          <Link to="/shop" className="btn btn-ghost btn-block mt-8">Continue shopping</Link>
        </div>
      </div>
    </div>
  );
};

export default Cart;
