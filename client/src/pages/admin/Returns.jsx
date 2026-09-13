import { useEffect, useState } from 'react';
import { FiClipboard, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate, formatPrice } from '../../utils/format';

const returnStatusOptions = ['all', 'requested', 'approved', 'rejected', 'refunded'];

const Returns = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/returns', { params: { status, page, limit: 8 } });
        setOrders(res.data.data.orders || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReturns();
  }, [page, status, toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Returns</h1>
          <p className="page-sub">Review and resolve customer return requests.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {returnStatusOptions.map((option) => (
          <button
            key={option}
            className={`chip ${status === option ? 'active' : ''}`}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === 'all' ? 'All returns' : option}
          </button>
        ))}
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : orders.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiClipboard />} title="No return requests" description="Customer return requests will appear here." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Reason</th>
                  <th>Refund</th>
                  <th>Status</th>
                  <th>Requested</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || '—'}</td>
                    <td>{order.returnRequest?.reason || '—'}</td>
                    <td>{formatPrice(order.returnRequest?.refundAmount || 0)}</td>
                    <td>
                      <span className={`badge ${order.returnRequest?.status === 'approved' || order.returnRequest?.status === 'refunded' ? 'badge-success' : order.returnRequest?.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {order.returnRequest?.status || 'requested'}
                      </span>
                    </td>
                    <td>{formatDate(order.returnRequest?.requestedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default Returns;
