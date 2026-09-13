import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowLeft, FiCheck, FiX, FiRotateCcw, FiMapPin, FiCreditCard, FiTag } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import { Spinner } from '../../components/Skeletons';
import { formatPrice, formatDate, formatDateTime, orderStatusColor, paymentStatusColor, ORDER_FLOW } from '../../utils/format';

const FLOW_LABELS = {
  pending: 'Order Placed',
  confirmed: 'Order Confirmed',
  processing: 'Packed / Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
};

const CANCELLABLE = ['pending', 'confirmed', 'processing'];

const CANCEL_REASONS = [
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery taking too long',
  'Item no longer needed',
  'Other',
];

const RETURN_REASONS = [
  'Damaged or defective item',
  'Wrong item received',
  'Item did not match description',
  'Missing parts or accessories',
  'Quality not as expected',
  'Changed my mind',
];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState(CANCEL_REASONS[0]);
  const [showReturn, setShowReturn] = useState(false);
  const [returnReason, setReturnReason] = useState(RETURN_REASONS[0]);
  const [returnDesc, setReturnDesc] = useState('');
  const [working, setWorking] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${id}`);
      setOrder(res.data.data.order);
    } catch (err) {
      toast(err.message, 'error');
      navigate('/account/orders', { replace: true });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) return <Spinner label="Loading order…" />;
  if (!order) return null;

  const historyOf = (s) => order.statusHistory.find((h) => h.status === s);

  let steps;
  if (['cancelled', 'returned'].includes(order.status)) {
    const reached = ORDER_FLOW.filter((s) => historyOf(s));
    steps = [
      ...reached.map((s) => ({ status: s, state: 'done' })),
      { status: order.status, state: 'current' },
    ];
  } else {
    const currentIdx = Math.max(0, ORDER_FLOW.indexOf(order.status));
    steps = ORDER_FLOW.map((s, i) => ({ status: s, state: i < currentIdx ? 'done' : i === currentIdx ? 'current' : 'todo' }));
  }

  const canCancel = CANCELLABLE.includes(order.status);
  const canReturn = order.status === 'delivered' && !order.returnRequest;

  const doCancel = async () => {
    setWorking(true);
    try {
      const res = await api.put(`/orders/${order._id}/cancel`, { reason: cancelReason });
      setOrder(res.data.data.order);
      setShowCancel(false);
      toast('Order cancelled successfully.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const doReturn = async () => {
    setWorking(true);
    try {
      const res = await api.post(`/orders/${order._id}/return`, { reason: returnReason, description: returnDesc });
      setOrder(res.data.data.order);
      setShowReturn(false);
      setReturnDesc('');
      toast('Return request submitted.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setWorking(false);
    }
  };

  const addr = order.shippingAddress;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/account/orders')} style={{ marginBottom: 14 }}>
        <FiArrowLeft size={15} /> Back to orders
      </button>

      <div className="page-head">
        <div>
          <h1 className="page-title">Order {order.orderNumber}</h1>
          <p className="page-sub">Placed on {formatDateTime(order.createdAt)}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span className={`status-pill ${orderStatusColor(order.status)}`}>{order.status}</span>
          <span className={`status-pill ${paymentStatusColor(order.paymentStatus)}`}>Payment {order.paymentStatus}</span>
        </div>
      </div>

      {(canCancel || canReturn) && (
        <div className="card card-pad mb-16" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <strong>Need to make a change?</strong>
            <p className="small muted" style={{ marginTop: 2 }}>
              {canCancel ? 'This order can still be cancelled.' : 'This order is eligible for return.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {canReturn && (
              <button className="btn btn-primary btn-sm" onClick={() => setShowReturn(true)}>
                <FiRotateCcw size={14} /> Request return
              </button>
            )}
            {canCancel && (
              <button className="btn btn-danger btn-sm" onClick={() => setShowCancel(true)}>
                <FiX size={14} /> Cancel order
              </button>
            )}
          </div>
        </div>
      )}

      <div className="grid dash-2col">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Timeline */}
          <div className="card card-pad">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 20 }}>Order Timeline</h3>
            <div className="timeline">
              {steps.map((step, i) => {
                const h = historyOf(step.status);
                return (
                  <div key={step.status} className={`timeline-step ${step.state}`}>
                    <div className="timeline-rail">
                      <div className="timeline-dot">
                        {step.state === 'done' ? <FiCheck size={13} /> : step.state === 'current' ? (step.status === 'cancelled' ? <FiX size={13} /> : <FiTag size={12} />) : null}
                      </div>
                      {i < steps.length - 1 && <div className="timeline-line" />}
                    </div>
                    <div className="timeline-body">
                      <div className="timeline-title" style={{ fontWeight: 700, fontSize: '0.9rem', color: step.state === 'todo' ? 'var(--muted-2)' : 'var(--ink)' }}>
                        {FLOW_LABELS[step.status] || (step.status === 'cancelled' ? 'Order Cancelled' : 'Order Returned')}
                      </div>
                      <div className="small muted">
                        {h ? formatDateTime(h.at) : step.state === 'todo' ? 'Pending' : ''}
                        {h?.note ? ` — ${h.note}` : ''}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {order.status === 'cancelled' && order.cancelReason && (
              <div className="form-error mt-16">Cancellation reason: {order.cancelReason}</div>
            )}
          </div>

          {/* Items */}
          <div className="card">
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Items ({order.items.length})</h3>
            </div>
            {order.items.map((item) => (
              <div key={item._id} className="list-row" style={{ padding: '16px 20px' }}>
                <img
                  src={item.image || (item.product?.images?.[0]) || '/placeholder.png'}
                  alt={item.name}
                  className="order-img"
                  style={{ width: 56, height: 56 }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link
                    to={`/product/${item.product?.slug || item.product?._id || ''}`}
                    style={{ fontWeight: 700, fontSize: '0.92rem', display: 'block' }}
                  >
                    {item.name}
                  </Link>
                  {item.variantSelection && Object.keys(item.variantSelection).length > 0 && (
                    <div className="small muted">
                      {Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                    </div>
                  )}
                  <div className="small muted">Qty: {item.quantity}</div>
                </div>
                <strong style={{ whiteSpace: 'nowrap' }}>{formatPrice(item.price * item.quantity)}</strong>
              </div>
            ))}
          </div>

          {/* Return request panel */}
          {order.returnRequest && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card card-pad">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Return Request</h3>
                <span className={`status-pill status-${order.returnRequest.status}`}>{order.returnRequest.status}</span>
              </div>
              <p className="small"><strong>Reason:</strong> {order.returnRequest.reason}</p>
              {order.returnRequest.description && (
                <p className="small muted" style={{ marginTop: 4 }}>{order.returnRequest.description}</p>
              )}
              <p className="small muted" style={{ marginTop: 8 }}>
                Requested on {formatDateTime(order.returnRequest.requestedAt)} · Refund amount: <strong style={{ color: 'var(--ink)' }}>{formatPrice(order.returnRequest.refundAmount)}</strong>
              </p>
              {order.returnRequest.history?.length > 0 && (
                <div className="mt-16" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {order.returnRequest.history.map((h, i) => (
                    <div key={i} className="small muted" style={{ display: 'flex', gap: 8 }}>
                      <span style={{ fontWeight: 700, textTransform: 'capitalize', color: 'var(--ink-2)' }}>{h.status}</span>
                      · {formatDateTime(h.at)}{h.note ? ` — ${h.note}` : ''}
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Side column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card card-pad">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14 }}>Payment Summary</h3>
            <div className="flex-between mb-8"><span className="muted small">Items total</span><span className="small">{formatPrice(order.itemsTotal)}</span></div>
            <div className="flex-between mb-8"><span className="muted small">Shipping</span><span className="small">{order.shippingFee === 0 ? 'Free' : formatPrice(order.shippingFee)}</span></div>
            <div className="flex-between mb-8"><span className="muted small">Discount {order.coupon?.code ? `(${order.coupon.code})` : ''}</span><span className="small" style={{ color: 'var(--success)' }}>-{formatPrice(order.discount)}</span></div>
            <hr className="divider" />
            <div className="flex-between"><strong>Total Paid</strong><strong style={{ fontSize: '1.1rem' }}>{formatPrice(order.total)}</strong></div>
            <div className="mt-16" style={{ display: 'flex', alignItems: 'center', gap: 8 }} >
              <FiCreditCard size={15} className="muted" />
              <span className="small" style={{ textTransform: 'uppercase', fontWeight: 700 }}>{order.paymentMethod}</span>
              <span className={`status-pill ${paymentStatusColor(order.paymentStatus)}`}>{order.paymentStatus}</span>
            </div>
          </div>

          <div className="card card-pad">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiMapPin size={15} className="muted" /> Shipping Address
            </h3>
            <div style={{ fontWeight: 700 }}>{addr.fullName}</div>
            <p className="small muted" style={{ marginTop: 4, lineHeight: 1.7 }}>
              {addr.line1}{addr.line2 ? `, ${addr.line2}` : ''}<br />
              {addr.city}, {addr.state} {addr.pincode}<br />
              {addr.country}
            </p>
            <p className="small muted mt-8">Phone: {addr.phone}</p>
          </div>
        </div>
      </div>

      {/* Cancel modal */}
      <Modal open={showCancel} onClose={() => setShowCancel(false)} title="Cancel this order?">
        <p className="muted small mb-16">Let us know why you're cancelling. Your payment (if any) will be refunded automatically.</p>
        <div className="field-group" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {CANCEL_REASONS.map((r) => (
            <label key={r} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', border: '1.5px solid var(--line)', borderRadius: 10, cursor: 'pointer', fontSize: '0.9rem', fontWeight: 600, background: cancelReason === r ? 'var(--primary-50)' : '#fff', borderColor: cancelReason === r ? 'var(--primary-600)' : 'var(--line)' }}>
              <input type="radio" checked={cancelReason === r} onChange={() => setCancelReason(r)} style={{ accentColor: 'var(--primary-600)' }} />
              {r}
            </label>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button className="btn btn-outline" onClick={() => setShowCancel(false)}>Keep order</button>
          <button className="btn btn-danger" onClick={doCancel} disabled={working}>
            {working ? <span className="spinner" /> : <FiX size={15} />} Confirm cancellation
          </button>
        </div>
      </Modal>

      {/* Return modal */}
      <Modal open={showReturn} onClose={() => setShowReturn(false)} title="Request a return">
        <p className="muted small mb-16">Select a reason and describe the issue. Our team will review your request shortly.</p>
        <div className="field">
          <label className="label">Reason</label>
          <select className="select" value={returnReason} onChange={(e) => setReturnReason(e.target.value)}>
            {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="field">
          <label className="label">Description (optional)</label>
          <textarea
            className="textarea"
            value={returnDesc}
            onChange={(e) => setReturnDesc(e.target.value)}
            placeholder="Add any details that will help us process your return faster…"
          />
        </div>
        <p className="small muted" style={{ background: 'var(--info-bg)', padding: '10px 14px', borderRadius: 8 }}>
          On approval, a refund of <strong style={{ color: 'var(--ink)' }}>{formatPrice(order.total)}</strong> will be initiated to your original payment method.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button className="btn btn-outline" onClick={() => setShowReturn(false)}>Not now</button>
          <button className="btn btn-primary" onClick={doReturn} disabled={working}>
            {working ? <span className="spinner" /> : <FiRotateCcw size={15} />} Submit request
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default OrderDetail;
