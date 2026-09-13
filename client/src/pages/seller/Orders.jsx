import { useEffect, useState } from 'react';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate, formatPrice, orderStatusColor } from '../../utils/format';

const STATUS_OPTIONS = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

const Orders = () => {
  const toast = useToast();
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const res = await api.get('/seller/orders', { params: { page, status } });
        setOrders(res.data.data.orders || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, status, toast]);

  const updateStatus = async (orderId, nextStatus) => {
    try {
      await api.put(`/seller/orders/${orderId}/status`, { status: nextStatus });
      toast('Order updated.', 'success');
      setPage(1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Seller Orders</h1>
          <p className="page-sub">Manage and update all orders that include your products.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option}
            className={`chip ${status === option ? 'active' : ''}`}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === 'all' ? 'All orders' : option}
          </button>
        ))}
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiPackage />} title={status === 'all' ? 'No orders yet' : `No ${status} orders`} description="New orders will appear here when customers buy your products." />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {orders.map((order) => (
              <div key={order._id} className="card card-hover card-pad">
                <div className="flex-between mb-16" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{order.orderNumber}</div>
                    <div className="small muted">Placed on {formatDate(order.createdAt)} by {order.user?.name}</div>
                  </div>
                  <span className={`status-pill ${orderStatusColor(order.status)}`}>{order.status}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex' }}>
                    {order.items.slice(0, 4).map((item, idx) => (
                      <img
                        key={idx}
                        src={item.image || '/placeholder.png'}
                        alt={item.name}
                        style={{ width: 52, height: 52, objectFit: 'cover', borderRadius: 10, marginLeft: idx ? -12 : 0, border: '2px solid #fff' }}
                      />
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {order.items.slice(0, 2).map((item, idx) => (
                      <div key={idx} className="small" style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.name} × {item.quantity}
                      </div>
                    ))}
                    {order.items.length > 2 && <div className="small muted">and {order.items.length - 2} more item(s)</div>}
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 110 }}>
                    <div style={{ fontWeight: 800 }}>{formatPrice(order.total)}</div>
                    <div className="small muted">{order.paymentMethod} · {order.paymentStatus}</div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginTop: 18 }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['confirmed', 'processing', 'shipped', 'delivered'].map((nextStatus) => (
                      <button
                        key={nextStatus}
                        className={`btn btn-sm ${order.status === nextStatus ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => updateStatus(order._id, nextStatus)}
                        disabled={order.status === nextStatus}
                      >
                        Mark {nextStatus}
                      </button>
                    ))}
                  </div>
                  <button className="btn btn-outline btn-sm">
                    View details <FiChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {meta.totalPages > 1 && <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default Orders;
