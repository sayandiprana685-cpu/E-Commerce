import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiTruck, FiHeart, FiBell, FiShoppingBag, FiChevronRight, FiCreditCard, FiMapPin } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate, orderStatusColor, timeAgo } from '../../utils/format';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'processing', 'shipped'];

const Overview = () => {
  const { user } = useAuth();
  const { ids: wishlistIds } = useWishlist();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [ordersRes, notifRes] = await Promise.all([
          api.get('/orders', { params: { limit: 50 } }),
          api.get('/notifications', { params: { limit: 5 } }),
        ]);
        if (!mounted) return;
        setOrders(ordersRes.data.data.orders);
        setTotalOrders(ordersRes.data.meta.total);
        setNotifications(notifRes.data.data.notifications);
        setUnread(notifRes.data.meta.unreadCount);
      } catch (err) {
        if (mounted) toast(err.message, 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeOrders = orders.filter((o) => ACTIVE_STATUSES.includes(o.status)).length;
  const totalSpent = orders
    .filter((o) => !['cancelled', 'returned'].includes(o.status))
    .reduce((sum, o) => sum + o.total, 0);
  const recent = orders.slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hello, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="page-sub">Here's what's happening with your account.</p>
        </div>
        <Link to="/shop" className="btn btn-primary">
          <FiShoppingBag size={16} /> Continue shopping
        </Link>
      </div>

      {loading ? (
        <RowSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard index={0} icon={<FiPackage />} label="Total Orders" value={totalOrders} sub={`${recent.length ? `Last: ${formatDate(recent[0].createdAt)}` : 'No orders yet'}`} />
            <StatCard index={1} icon={<FiTruck />} label="Active Orders" value={activeOrders} sub="Being processed or shipped" color="var(--info)" bg="var(--info-bg)" />
            <StatCard index={2} icon={<FiHeart />} label="Wishlist Items" value={wishlistIds.length} sub="Saved for later" color="var(--danger)" bg="var(--danger-bg)" />
            <StatCard index={3} icon={<FiBell />} label="Unread Alerts" value={unread} sub="Notifications" color="var(--warning)" bg="var(--warning-bg)" />
          </div>

          <div className="grid dash-2col mt-24">
            {/* Recent orders */}
            <div className="card">
              <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent Orders</h3>
                <Link to="/account/orders" className="small" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  View all <FiChevronRight size={14} />
                </Link>
              </div>
              {recent.length === 0 ? (
                <EmptyState
                  icon={<FiPackage />}
                  title="No orders yet"
                  description="Your orders will appear here once you start shopping."
                  action={<Link to="/shop" className="btn btn-primary btn-sm">Browse products</Link>}
                />
              ) : (
                recent.map((o) => (
                  <Link
                    key={o._id}
                    to={`/account/orders/${o._id}`}
                    className="order-row"
                    style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}
                  >
                    <div style={{ display: 'flex' }}>
                      {o.items.slice(0, 3).map((i, idx) => (
                        <img
                          key={idx}
                          src={i.image || (i.product?.images?.[0]) || '/placeholder.png'}
                          alt=""
                          style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover', border: '2px solid #fff', marginLeft: idx ? -12 : 0, background: '#f4f5f9' }}
                        />
                      ))}
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{o.orderNumber}</div>
                      <div className="small muted">
                        {o.items.length} item{o.items.length > 1 ? 's' : ''} · {formatDate(o.createdAt)}
                      </div>
                    </div>
                    <span className={`status-pill ${orderStatusColor(o.status)}`}>{o.status}</span>
                    <div style={{ fontWeight: 800, fontSize: '0.92rem' }}>{formatPrice(o.total)}</div>
                  </Link>
                ))
              )}
            </div>

            {/* Side column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div className="card card-pad">
                <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>Lifetime Summary</h3>
                <div className="flex-between mb-8">
                  <span className="muted small">Total spent</span>
                  <strong>{formatPrice(totalSpent)}</strong>
                </div>
                <div className="flex-between mb-8">
                  <span className="muted small">Orders placed</span>
                  <strong>{totalOrders}</strong>
                </div>
                <div className="flex-between">
                  <span className="muted small">Member since</span>
                  <strong>{formatDate(user?.createdAt)}</strong>
                </div>
                <hr className="divider" />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Link to="/account/addresses" className="btn btn-secondary btn-sm"><FiMapPin size={14} /> Addresses</Link>
                  <Link to="/account/payments" className="btn btn-secondary btn-sm"><FiCreditCard size={14} /> Payments</Link>
                </div>
              </div>

              <div className="card">
                <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Notifications</h3>
                  <Link to="/account/notifications" className="small" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View all <FiChevronRight size={14} />
                  </Link>
                </div>
                {notifications.length === 0 ? (
                  <p className="muted small" style={{ padding: '18px 20px' }}>You're all caught up.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n._id} style={{ display: 'flex', gap: 10, padding: '12px 20px', borderBottom: '1px solid #f1f5f9', background: n.isRead ? 'transparent' : 'var(--primary-50)' }}>
                      <span style={{ fontSize: 15, marginTop: 2, color: 'var(--primary)' }}><FiBell /></span>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{n.title}</div>
                        <div className="small muted" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{n.message}</div>
                        <div className="small muted" style={{ marginTop: 2 }}>{timeAgo(n.createdAt)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Overview;
