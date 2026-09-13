import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiTruck, FiMapPin, FiCreditCard, FiPrinter } from 'react-icons/fi';
import api from '../services/api';
import { Spinner } from '../components/Skeletons';
import EmptyState from '../components/EmptyState';
import { formatPrice, formatDateTime } from '../utils/format';

const OrderSuccess = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/orders/${id}`)
      .then((res) => setOrder(res.data.data.order))
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '80px 0', display: 'flex', justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container" style={{ padding: '60px 0 80px' }}>
        <EmptyState
          title="Order not found"
          description="We couldn't find this order. Check your order history for details."
          action={<Link to="/account/orders" className="btn btn-primary">View my orders</Link>}
        />
      </div>
    );
  }

  const address = order.shippingAddress || {};

  return (
    <div className="container" style={{ padding: '40px 0 80px', maxWidth: 860 }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="card"
        style={{ padding: '44px 36px', textAlign: 'center', marginBottom: 22 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.15 }}
          style={{
            width: 84,
            height: 84,
            borderRadius: '50%',
            background: 'var(--success-bg, #ecfdf5)',
            color: 'var(--success, #059669)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
          }}
        >
          <FiCheckCircle size={42} />
        </motion.div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Order placed successfully!</h1>
        <p className="muted" style={{ marginTop: 8 }}>
          Thanks for shopping with Vendora. Your order <strong>{order.orderNumber}</strong> is confirmed.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 22, flexWrap: 'wrap' }}>
          <Link to={`/account/orders/${order._id}`} className="btn btn-primary">Track order</Link>
          <Link to="/shop" className="btn btn-outline">Continue shopping</Link>
          <button className="btn btn-ghost no-print" onClick={() => window.print()}>
            <FiPrinter size={15} /> Print
          </button>
        </div>
      </motion.div>

      <div className="grid grid-2" style={{ gap: 18 }}>
        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FiMapPin /> Delivery details
          </h3>
          <p style={{ lineHeight: 1.7 }}>
            <strong>{address.fullName}</strong>
            <br />
            {address.line1}{address.line2 ? `, ${address.line2}` : ''}
            <br />
            {address.city}, {address.state} — {address.pincode}
            <br />
            Phone: {address.phone}
          </p>
        </div>

        <div className="card" style={{ padding: 22 }}>
          <h3 style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <FiCreditCard /> Payment summary
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="flex-between small">
              <span className="muted">Placed on</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="flex-between small">
              <span className="muted">Payment method</span>
              <span style={{ textTransform: 'uppercase', fontWeight: 700 }}>{order.paymentMethod}</span>
            </div>
            <div className="flex-between small">
              <span className="muted">Items total</span>
              <span>{formatPrice(order.itemsTotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex-between small">
                <span className="muted">Coupon {order.coupon?.code}</span>
                <span style={{ color: 'var(--success)', fontWeight: 700 }}>− {formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex-between small">
              <span className="muted">Delivery</span>
              <span>{order.shippingFee === 0 ? 'FREE' : formatPrice(order.shippingFee)}</span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--line)' }} />
            <div className="flex-between">
              <span style={{ fontWeight: 800 }}>Total</span>
              <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ padding: 22, marginTop: 18 }}>
        <h3 style={{ fontWeight: 800, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <FiPackage /> Items in this order ({order.items.length})
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {order.items.map((item) => (
            <div key={item._id || item.product?._id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <img src={item.image || item.product?.images?.[0]} alt={item.name} style={{ width: 52, height: 52, borderRadius: 10, objectFit: 'cover', background: '#f4f5f9' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{item.name}</div>
                <div className="small muted">
                  Qty {item.quantity}
                  {item.variantSelection && Object.keys(item.variantSelection).length > 0 && ` • ${Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(', ')}`}
                </div>
              </div>
              <span style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ padding: '16px 22px', marginTop: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
        <FiTruck style={{ color: 'var(--primary)' }} />
        <span className="small">
          You'll receive updates as your order moves through <strong>confirmed → processing → shipped → delivered</strong>. Track it anytime from <Link to="/account/orders">My Orders</Link>.
        </span>
      </div>
    </div>
  );
};

export default OrderSuccess;
