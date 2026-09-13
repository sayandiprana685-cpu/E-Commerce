import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiUser, FiShoppingBag, FiCheckCircle, FiHome, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [params] = useSearchParams();

  const [role, setRole] = useState(params.get('role') === 'seller' ? 'seller' : 'buyer');
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', shopName: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast('Passwords do not match.', 'error');
    if (form.password.length < 6) return toast('Password must be at least 6 characters.', 'warning');
    setSubmitting(true);
    try {
      const payload = { name: form.name, email: form.email, password: form.password, role };
      if (role === 'seller') payload.shopName = form.shopName;
      const user = await register(payload);
      toast(
        role === 'seller'
          ? `Welcome to Vendora, ${user.name.split(' ')[0]}! Your seller account is pending verification.`
          : `Welcome to Vendora, ${user.name.split(' ')[0]}!`,
        'success'
      );
      navigate(role === 'seller' ? '/seller' : '/account');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h2>Join thousands of happy shoppers</h2>
        <p>Create your free Vendora account in seconds — no credit card required.</p>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          {[
            'Free account with instant checkout',
            'Personalized recommendations',
            'Order tracking and easy returns',
            'Sellers: list products within minutes',
          ].map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: '0.95rem' }}>
              <FiCheckCircle style={{ color: '#fbbf24', flexShrink: 0 }} /> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-col">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1>Create account</h1>
          <p className="auth-sub">
            Already have an account? <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>Sign in</Link>
          </p>

          {/* Role toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
            {[
              { value: 'buyer', label: 'Shop as Buyer', icon: <FiShoppingBag /> },
              { value: 'seller', label: 'Sell on Vendora', icon: <FiBriefcase /> },
            ].map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRole(r.value)}
                className={`pay-option ${role === r.value ? 'selected' : ''}`}
                style={{ flexDirection: 'column', gap: 6, padding: '14px 10px', justifyContent: 'center' }}
              >
                <span style={{ color: role === r.value ? 'var(--primary)' : 'var(--muted)' }}>{r.icon}</span>
                <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Full name</label>
              <div className="input-icon">
                <FiUser size={16} />
                <input className="field" required value={form.name} onChange={set('name')} placeholder="Your name" autoComplete="name" />
              </div>
            </div>

            {role === 'seller' && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ overflow: 'hidden' }}>
                <label className="label">Shop name</label>
                <div className="input-icon">
                  <FiHome size={16} />
                  <input className="field" required value={form.shopName} onChange={set('shopName')} placeholder="e.g. Pixel Gadgets Store" />
                </div>
                <p className="small muted" style={{ marginTop: 6 }}>
                  Seller accounts are reviewed by our team before you can go live.
                </p>
              </motion.div>
            )}

            <div>
              <label className="label">Email address</label>
              <div className="input-icon">
                <FiMail size={16} />
                <input className="field" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div className="form-row">
              <div>
                <label className="label">Password</label>
                <div className="input-icon">
                  <FiLock size={16} />
                  <input className="field" type="password" required value={form.password} onChange={set('password')} placeholder="Min 6 characters" autoComplete="new-password" />
                </div>
              </div>
              <div>
                <label className="label">Confirm password</label>
                <div className="input-icon">
                  <FiLock size={16} />
                  <input className="field" type="password" required value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
                </div>
              </div>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Creating account…' : `Create ${role === 'seller' ? 'Seller' : 'Buyer'} Account`}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
