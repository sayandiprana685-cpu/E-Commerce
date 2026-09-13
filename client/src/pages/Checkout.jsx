import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiMapPin,
  FiCreditCard,
  FiTag,
  FiCheck,
  FiPlus,
  FiTrash2,
  FiShoppingBag,
  FiDollarSign,
  FiSmartphone,
  FiHome,
} from 'react-icons/fi';
import api from '../services/api';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import { formatPrice } from '../utils/format';

const FREE_SHIPPING_AT = 499;
const SHIPPING_FEE = 49;

const PAYMENT_METHODS = [
  { value: 'cod', label: 'Cash on Delivery', desc: 'Pay in cash when your order arrives', icon: <FiDollarSign /> },
  { value: 'card', label: 'Credit / Debit Card', desc: 'Visa, Mastercard, RuPay — simulated gateway', icon: <FiCreditCard /> },
  { value: 'upi', label: 'UPI', desc: 'Pay via any UPI app — simulated', icon: <FiSmartphone /> },
  { value: 'netbanking', label: 'Net Banking', desc: 'All major banks — simulated', icon: <FiHome /> },
];

const EMPTY_ADDRESS = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

const AddressForm = ({ initial, onSave, onCancel, saving }) => {
  const [form, setForm] = useState(initial || EMPTY_ADDRESS);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
      style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div>
          <label className="label">Full name</label>
          <input className="field" required value={form.fullName} onChange={set('fullName')} placeholder="Recipient name" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="field" required value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
        </div>
      </div>
      <div>
        <label className="label">Address line 1</label>
        <input className="field" required value={form.line1} onChange={set('line1')} placeholder="House / flat / street" />
      </div>
      <div>
        <label className="label">Address line 2 (optional)</label>
        <input className="field" value={form.line2} onChange={set('line2')} placeholder="Area, landmark" />
      </div>
      <div className="grid grid-3" style={{ gap: 12 }}>
        <div>
          <label className="label">City</label>
          <input className="field" required value={form.city} onChange={set('city')} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="field" required value={form.state} onChange={set('state')} />
        </div>
        <div>
          <label className="label">PIN code</label>
          <input className="field" required value={form.pincode} onChange={set('pincode')} placeholder="6 digits" />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 600 }}>
        <input type="checkbox" checked={form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} />
        Set as default address
      </label>
      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-primary" disabled={saving} style={{ flex: 1 }}>
          {saving ? 'Saving…' : 'Save address'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const { items, totalItems, itemsTotal, refreshCart } = useCart();
  const navigate = useNavigate();
  const toast = useToast();

  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [couponCode, setCouponCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [placing, setPlacing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [addrRes] = await Promise.all([api.get('/users/addresses'), refreshCart()]);
        const list = addrRes.data.data.addresses || [];
        setAddresses(list);
        const def = list.find((a) => a.isDefault) || list[0];
        if (def) setSelectedAddress(def._id);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const shipping = itemsTotal - discount >= FREE_SHIPPING_AT || itemsTotal === 0 ? 0 : SHIPPING_FEE;
  const total = Math.max(0, itemsTotal - discount) + shipping;

  const saveAddress = async (form) => {
    setSavingAddress(true);
    try {
      const res = await api.post('/users/addresses', form);
      setAddresses(res.data.data.addresses);
      setSelectedAddress(res.data.data.address._id);
      setShowAddressForm(false);
      toast('Address saved.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSavingAddress(false);
    }
  };

  const deleteAddress = async (id, e) => {
    e.stopPropagation();
    try {
      const res = await api.delete(`/users/addresses/${id}`);
      const list = res.data.data.addresses;
      setAddresses(list);
      if (selectedAddress === id) setSelectedAddress((list.find((a) => a.isDefault) || list[0])?._id || null);
      toast('Address removed.', 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCheckingCoupon(true);
    try {
      const res = await api.post('/coupons/validate', { code: couponCode, orderAmount: itemsTotal });
      const coupon = res.data.data.coupon;
      setDiscount(coupon.discount);
      setAppliedCoupon(coupon);
      toast(`Coupon ${coupon.code} applied — you saved ${formatPrice(coupon.discount)}!`, 'success');
    } catch (err) {
      setDiscount(0);
      setAppliedCoupon(null);
      toast(err.message, 'error');
    } finally {
      setCheckingCoupon(false);
    }
  };

  const placeOrder = async () => {
    if (!selectedAddress) return toast('Please select a delivery address.', 'warning');
    const address = addresses.find((a) => a._id === selectedAddress);
    setPlacing(true);
    try {
      const res = await api.post('/orders', {
        shippingAddress: {
          fullName: address.fullName,
          phone: address.phone,
          line1: address.line1,
          line2: address.line2 || '',
          city: address.city,
          state: address.state,
          pincode: address.pincode,
        },
        paymentMethod,
        couponCode: appliedCoupon?.code,
      });
      toast(res.data.message || 'Order placed!', 'success');
      navigate(`/order-success/${res.data.data.order._id}`);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setPlacing(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <div className="skeleton" style={{ height: 320, borderRadius: 18, marginBottom: 20 }} />
        <div className="skeleton" style={{ height: 180, borderRadius: 18 }} />
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="container" style={{ padding: '60px 0 80px' }}>
        <EmptyState
          icon={<FiShoppingBag size={42} />}
          title="Nothing to checkout"
          description="Your cart is empty. Add some products before placing an order."
          action={<Link to="/shop" className="btn btn-primary">Browse products</Link>}
        />
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '26px 0 80px' }}>
      <h1 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 22 }}>Checkout</h1>

      <div className="checkout-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Step 1: Address */}
          <section className="card" style={{ padding: 22 }}>
            <div className="step-head">
              <span className="step-num">1</span>
              <h3 style={{ fontWeight: 800 }}>Delivery address</h3>
            </div>
            <div className="grid grid-2" style={{ gap: 12 }}>
              {addresses.map((a) => (
                <motion.div
                  key={a._id}
                  className={`addr-card ${selectedAddress === a._id ? 'selected' : ''}`}
                  onClick={() => setSelectedAddress(a._id)}
                  whileTap={{ scale: 0.99 }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <strong>{a.fullName}</strong>
                      {a.isDefault && <span className="badge badge-success">Default</span>}
                      {selectedAddress === a._id && (
                        <span className="badge" style={{ background: 'var(--primary-600)', color: '#fff' }}><FiCheck size={11} /> Selected</span>
                      )}
                    </div>
                    <button
                      className="btn-icon"
                      style={{ width: 28, height: 28, color: '#e11d48' }}
                      onClick={(e) => deleteAddress(a._id, e)}
                      aria-label="Delete address"
                    >
                      <FiTrash2 size={13} />
                    </button>
                  </div>
                  <p className="small muted" style={{ marginTop: 8, lineHeight: 1.6 }}>
                    {a.line1}{a.line2 ? `, ${a.line2}` : ''}, {a.city}, {a.state} — {a.pincode}
                    <br />
                    Phone: {a.phone}
                  </p>
                </motion.div>
              ))}
              <button className="addr-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, minHeight: 110, color: 'var(--primary)', fontWeight: 700 }} onClick={() => setShowAddressForm(true)}>
                <FiPlus /> Add new address
              </button>
            </div>
          </section>

          {/* Step 2: Payment */}
          <section className="card" style={{ padding: 22 }}>
            <div className="step-head">
              <span className="step-num">2</span>
              <h3 style={{ fontWeight: 800 }}>Payment method</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))', gap: 12 }}>
              {PAYMENT_METHODS.map((m) => (
                <button
                  key={m.value}
                  className={`pay-option ${paymentMethod === m.value ? 'selected' : ''}`}
                  onClick={() => setPaymentMethod(m.value)}
                >
                  <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{m.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{m.label}</div>
                    <div className="small muted">{m.desc}</div>
                  </div>
                </button>
              ))}
            </div>
            {paymentMethod !== 'cod' && (
              <p className="small muted" style={{ marginTop: 12, background: 'var(--bg)', padding: '10px 14px', borderRadius: 10 }}>
                This is a demo environment — the payment gateway is simulated and no real money is charged.
              </p>
            )}
          </section>

          {/* Step 3: Review */}
          <section className="card" style={{ padding: 22 }}>
            <div className="step-head">
              <span className="step-num">3</span>
              <h3 style={{ fontWeight: 800 }}>Review items ({totalItems})</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {items.map((item) => (
                <div key={item._id} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <img src={item.image} alt={item.name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: 'cover', background: '#f4f5f9' }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</div>
                    <div className="small muted">
                      Qty {item.quantity}
                      {item.variantSelection && Object.keys(item.variantSelection).length > 0 && ` • ${Object.entries(item.variantSelection).map(([k, v]) => `${k}: ${v}`).join(', ')}`}
                    </div>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatPrice(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Summary */}
        <div className="card" style={{ padding: 22, position: 'sticky', top: 90 }}>
          <h3 style={{ fontWeight: 800, marginBottom: 16 }}>Order Summary</h3>

          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            <input
              className="field"
              placeholder="Coupon code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              style={{ textTransform: 'uppercase' }}
            />
            <button className="btn btn-secondary" onClick={applyCoupon} disabled={checkingCoupon || !!appliedCoupon}>
              {checkingCoupon ? '…' : 'Apply'}
            </button>
          </div>
          {appliedCoupon && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--success-bg, #ecfdf5)', color: 'var(--success)', borderRadius: 10, padding: '8px 12px', marginBottom: 14, fontSize: '0.85rem', fontWeight: 700 }}>
              <span className="flex-center" style={{ gap: 6 }}><FiTag size={13} /> {appliedCoupon.code} applied</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  setAppliedCoupon(null);
                  setDiscount(0);
                  setCouponCode('');
                }}
              >
                Remove
              </button>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="flex-between small">
              <span className="muted">Items ({totalItems})</span>
              <span style={{ fontWeight: 700 }}>{formatPrice(itemsTotal)}</span>
            </div>
            {discount > 0 && (
              <div className="flex-between small">
                <span className="muted">Coupon discount</span>
                <span style={{ fontWeight: 700, color: 'var(--success)' }}>− {formatPrice(discount)}</span>
              </div>
            )}
            <div className="flex-between small">
              <span className="muted">Delivery</span>
              <span style={{ fontWeight: 700, color: shipping === 0 ? 'var(--success)' : 'var(--ink)' }}>
                {shipping === 0 ? 'FREE' : formatPrice(shipping)}
              </span>
            </div>
            <hr style={{ border: 'none', borderTop: '1px solid var(--line)', margin: '4px 0' }} />
            <div className="flex-between">
              <span style={{ fontWeight: 800, fontSize: '1.05rem' }}>Total payable</span>
              <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--primary)' }}>{formatPrice(total)}</span>
            </div>
          </div>

          <button className="btn btn-primary btn-lg btn-block mt-16" onClick={placeOrder} disabled={placing || !selectedAddress}>
            {placing ? 'Placing order…' : paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(total)}`}
          </button>
          <p className="small muted" style={{ textAlign: 'center', marginTop: 10 }}>
            By placing your order, you agree to Vendora's terms of sale.
          </p>
        </div>
      </div>

      <Modal open={showAddressForm} onClose={() => setShowAddressForm(false)} title="Add delivery address">
        <AddressForm onSave={saveAddress} onCancel={() => setShowAddressForm(false)} saving={savingAddress} />
      </Modal>
    </div>
  );
};

export default Checkout;
