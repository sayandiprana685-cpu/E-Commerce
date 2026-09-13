import { useEffect, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiShoppingBag } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate, orderStatusColor } from '../../utils/format';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped', label: 'Shipped' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'returned', label: 'Returned' },
];

const Orders = () => {
  const toast = useToast();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'all';
  const [status, setStatus] = useState(STATUS_TABS.some((t) => t.value === initialStatus) ? initialStatus : 'all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchOrders = useCallback(async (s, p) => {
    setLoading(true);
    try {
      const res = await api.get('/orders', { params: { status: s, page: p, limit: 8 } });
      setOrders(res.data.data.orders);
      setMeta(res.data.meta);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchOrders(status, page);
  }, [status, page, fetchOrders]);

  const changeStatus = (s) => {
    setStatus(s);
    setPage(1);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Orders</h1>
          <p className="page-sub">Track, review and manage all your purchases.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_TABS.map((t) => (
          <button key={t.value} className={`chip ${status === t.value ? 'active' : ''}`} onClick={() => changeStatus(t.value)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiPackage />}
            title={status === 'all' ? 'No orders yet' : `No ${status} orders`}
            description={status === 'all' ? 'When you place an order, it will show up here with live tracking.' : 'Try a different filter to see your other orders.'}
            action={status === 'all' ? <Link to="/shop" className="btn btn-primary btn-sm"><FiShoppingBag size={14} /> Start shopping</Link> : null}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {orders.map((o) => (
            <div key={o._id} className="card card-hover card-pad">
              <div className="flex-between mb-16" style={{ gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{o.orderNumber}</div>
                    <div className="small muted">Placed on {formatDate(o.createdAt)}</div>
                  </div>
                  <span className={`status-pill ${orderStatusColor(o.status)}`}>{o.status}</span>
                  {o.returnRequest && <span className="status-pill status-requested">Return {o.returnRequest.status}</span>}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 800 }}>{formatPrice(o.total)}</div>
                  <div className="small muted" style={{ textTransform: 'uppercase' }}>{o.paymentMethod} · {o.paymentStatus}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex' }}>
                  {o.items.slice(0, 4).map((i, idx) => (
                    <img
                      key={idx}
                      src={i.image || (i.product?.images?.[0]) || '/placeholder.png'}
                      alt=""
                      className="order-img"
                      style={{ marginLeft: idx ? -12 : 0 }}
                    />
                  ))}
                  {o.items.length > 4 && (
                    <div className="order-img" style={{ marginLeft: -12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: 'var(--muted)' }}>
                      +{o.items.length - 4}
                    </div>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  {o.items.slice(0, 2).map((i, idx) => (
                    <div key={idx} className="small" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {i.name}{i.quantity > 1 ? ` × ${i.quantity}` : ''}
                    </div>
                  ))}
                  {o.items.length > 2 && <div className="small muted">and {o.items.length - 2} more item{o.items.length - 2 > 1 ? 's' : ''}</div>}
                </div>
                <Link to={`/account/orders/${o._id}`} className="btn btn-secondary btn-sm">
                  View details <FiChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
      )}
    </div>
  );
};

export default Orders;
