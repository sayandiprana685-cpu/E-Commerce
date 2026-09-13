import { useEffect, useState } from 'react';
import { FiSearch, FiShoppingBag } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate, formatPrice, orderStatusColor } from '../../utils/format';

const orderStatusOptions = ['all', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

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
        const res = await api.get('/admin/orders', { params: { status, page, limit: 8 } });
        setOrders(res.data.data.orders || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [status, page, toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Orders</h1>
          <p className="page-sub">Track all marketplace orders, payments, and fulfillment.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {orderStatusOptions.map((option) => (
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
          <EmptyState icon={<FiShoppingBag />} title="No orders found" description="No orders match the selected filter." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order._id}>
                    <td>{order.orderNumber}</td>
                    <td>{order.user?.name || 'Guest'}</td>
                    <td>{formatPrice(order.total)}</td>
                    <td><span className={`status-pill ${orderStatusColor(order.status)}`}>{order.status}</span></td>
                    <td>{formatDate(order.createdAt)}</td>
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

export default Orders;
