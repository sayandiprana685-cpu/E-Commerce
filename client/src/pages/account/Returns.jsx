import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiRotateCcw, FiChevronRight, FiClock } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate, formatDateTime } from '../../utils/format';

const RETURN_HELP = {
  requested: { label: 'Under review', tone: 'status-requested', desc: 'Our team is reviewing your request. You will be notified once a decision is made.' },
  approved: { label: 'Approved', tone: 'status-approved', desc: 'Your return has been approved. Keep the item ready for pickup.' },
  rejected: { label: 'Rejected', tone: 'status-rejected', desc: 'This return request was rejected. Contact support if you believe this is a mistake.' },
  refunded: { label: 'Refunded', tone: 'status-refunded', desc: 'Your refund has been processed to the original payment method.' },
};

const Returns = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get('/orders', { params: { returns: 1, limit: 50 } });
        if (mounted) setReturns(res.data.data.orders);
      } catch (err) {
        if (mounted) toast(err.message, 'error');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Returns</h1>
          <p className="page-sub">Track status of your return requests and refunds.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={4} />
      ) : returns.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiRotateCcw />}
            title="No return requests"
            description="Returns can be requested from an order's details page after it has been delivered."
            action={<Link to="/account/orders?status=delivered" className="btn btn-secondary btn-sm">View delivered orders</Link>}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {returns.map((o) => {
            const r = o.returnRequest;
            const help = RETURN_HELP[r.status] || RETURN_HELP.requested;
            return (
              <div key={o._id} className="card card-pad">
                <div className="flex-between mb-16" style={{ gap: 10, flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>{o.orderNumber}</div>
                    <div className="small muted">Requested on {formatDateTime(r.requestedAt)} · Placed {formatDate(o.createdAt)}</div>
                  </div>
                  <span className={`status-pill ${help.tone}`}>{help.label}</span>
                </div>

                <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex' }}>
                    {o.items.slice(0, 3).map((i, idx) => (
                      <img
                        key={idx}
                        src={i.image || (i.product?.images?.[0]) || '/placeholder.png'}
                        alt=""
                        className="order-img"
                        style={{ marginLeft: idx ? -12 : 0 }}
                      />
                    ))}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div className="small" style={{ fontWeight: 700 }}>{r.reason}</div>
                    {r.description && <div className="small muted" style={{ marginTop: 2 }}>{r.description}</div>}
                    <div className="small muted mt-8">Refund amount: <strong style={{ color: 'var(--ink)' }}>{formatPrice(r.refundAmount)}</strong></div>
                  </div>
                </div>

                <div className="mt-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <p className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FiClock size={13} /> {help.desc}
                  </p>
                  <Link to={`/account/orders/${o._id}`} className="btn btn-secondary btn-sm">
                    View order <FiChevronRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Returns;
