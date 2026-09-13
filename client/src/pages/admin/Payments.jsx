import { useEffect, useState } from 'react';
import { FiSearch, FiCreditCard } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDateTime, paymentStatusColor } from '../../utils/format';

const paymentStatusOptions = ['all', 'paid', 'pending', 'failed', 'refunded'];

const Payments = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/payments', { params: { status, page, limit: 8 } });
        setPayments(res.data.data.payments || []);
        setStats(res.data.data.stats || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [page, status, toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payments</h1>
          <p className="page-sub">Monitor transaction settlements, payment statuses, and refunds.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {paymentStatusOptions.map((option) => (
          <button
            key={option}
            className={`chip ${status === option ? 'active' : ''}`}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === 'all' ? 'All payments' : option}
          </button>
        ))}
      </div>

      {stats.length > 0 && (
        <div className="grid grid-3 mb-24">
          {stats.map((item) => (
            <div key={item._id} className="card card-pad">
              <div className="small muted" style={{ fontWeight: 800 }}>{item._id}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: 6 }}>{formatPrice(item.amount)}</div>
              <div className="small muted mt-8">{item.count} transactions</div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <RowSkeleton rows={5} />
      ) : payments.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiCreditCard />} title="No payments found" description="No payment records match the selected filter." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Customer</th>
                  <th>Order</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment._id}>
                    <td style={{ fontWeight: 700 }}>{payment.transactionId}</td>
                    <td>{payment.user?.name || '—'}</td>
                    <td>{payment.order?.orderNumber || '—'}</td>
                    <td>{payment.method}</td>
                    <td>{formatPrice(payment.amount)}</td>
                    <td><span className={`status-pill ${paymentStatusColor(payment.status)}`}>{payment.status}</span></td>
                    <td className="small muted">{formatDateTime(payment.createdAt)}</td>
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

export default Payments;
