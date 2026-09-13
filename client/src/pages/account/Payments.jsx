import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiCreditCard, FiRefreshCw } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDateTime, paymentStatusColor } from '../../utils/format';

const METHOD_LABELS = {
  cod: 'Cash on Delivery',
  card: 'Card',
  upi: 'UPI',
  netbanking: 'Net Banking',
};

const Payments = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/payments/me');
      setPayments(res.data.data.payments);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPayments(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPaid = payments.filter((p) => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  const totalRefunded = payments.filter((p) => p.status === 'refunded').reduce((s, p) => s + (p.refundedAmount || p.amount), 0);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Payment History</h1>
          <p className="page-sub">All transactions across your orders, including refunds.</p>
        </div>
        <button className="btn btn-outline btn-sm" onClick={fetchPayments}>
          <FiRefreshCw size={14} /> Refresh
        </button>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : payments.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiCreditCard />}
            title="No transactions yet"
            description="Online payments for your orders will be recorded here. Cash on delivery orders appear after payment is confirmed."
            action={<Link to="/shop" className="btn btn-primary btn-sm">Browse products</Link>}
          />
        </div>
      ) : (
        <>
          <div className="grid grid-2 mb-16">
            <div className="card card-pad">
              <div className="small muted" style={{ fontWeight: 700 }}>Total Paid</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4 }}>{formatPrice(totalPaid)}</div>
              <div className="small muted mt-8">{payments.filter((p) => p.status === 'paid').length} successful payments</div>
            </div>
            <div className="card card-pad">
              <div className="small muted" style={{ fontWeight: 700 }}>Total Refunded</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: 4, color: 'var(--success)' }}>{formatPrice(totalRefunded)}</div>
              <div className="small muted mt-8">{payments.filter((p) => p.status === 'refunded').length} refunds processed</div>
            </div>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Transaction</th>
                  <th>Order</th>
                  <th>Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td style={{ fontWeight: 700, fontSize: '0.82rem' }}>{p.transactionId}</td>
                    <td>
                      {p.order ? (
                        <Link to={`/account/orders/${p.order._id}`} style={{ color: 'var(--primary)', fontWeight: 600 }}>
                          {p.order.orderNumber}
                        </Link>
                      ) : (
                        <span className="muted small">—</span>
                      )}
                    </td>
                    <td>{METHOD_LABELS[p.method] || p.method}</td>
                    <td style={{ fontWeight: 700 }}>
                      {formatPrice(p.amount)}
                      {p.status === 'refunded' && p.refundedAmount > 0 && (
                        <div className="small" style={{ color: 'var(--success)', fontWeight: 600 }}>Refunded {formatPrice(p.refundedAmount)}</div>
                      )}
                    </td>
                    <td><span className={`status-pill ${paymentStatusColor(p.status)}`}>{p.status}</span></td>
                    <td className="small muted">{formatDateTime(p.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

export default Payments;
