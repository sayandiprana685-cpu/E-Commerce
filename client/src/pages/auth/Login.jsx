import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiLock, FiLogIn, FiCheckCircle } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const FEATURES = [
  'Track every order in real time',
  'Wishlist & smart recommendations',
  'Exclusive coupons and flash sales',
  'Secure payments with buyer protection',
];

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showDemo, setShowDemo] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const user = await login(form.email, form.password);
      toast(`Welcome back, ${user.name.split(' ')[0]}!`, 'success');
      const from = location.state?.from;
      if (from) navigate(from);
      else if (user.role === 'admin') navigate('/admin');
      else if (user.role === 'seller') navigate('/seller');
      else navigate('/account');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = (email, password) => {
    setForm({ email, password });
    setShowDemo(false);
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h2>Welcome back to Vendora</h2>
        <p>Sign in to access your orders, wishlist, and member-only deals.</p>
        <div style={{ marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12, position: 'relative' }}>
          {FEATURES.map((f) => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, fontSize: '0.95rem' }}>
              <FiCheckCircle style={{ color: '#fbbf24', flexShrink: 0 }} /> {f}
            </div>
          ))}
        </div>
      </div>

      <div className="auth-form-col">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1>Sign in</h1>
          <p className="auth-sub">New to Vendora? <Link to="/register" style={{ fontWeight: 700, color: 'var(--primary)' }}>Create an account</Link></p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Email address</label>
              <div className="input-icon">
                <FiMail size={16} />
                <input className="field" type="email" required value={form.email} onChange={set('email')} placeholder="you@example.com" autoComplete="email" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="input-icon">
                <FiLock size={16} />
                <input className="field" type="password" required value={form.password} onChange={set('password')} placeholder="••••••••" autoComplete="current-password" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link to="/forgot-password" className="small" style={{ fontWeight: 600, color: 'var(--primary)' }}>Forgot password?</Link>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              <FiLogIn /> {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div style={{ marginTop: 18 }}>
            <button className="btn btn-ghost btn-sm btn-block" onClick={() => setShowDemo((s) => !s)}>
              Use a demo account
            </button>
            {showDemo && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} style={{ overflow: 'hidden' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
                  {[
                    { label: 'Admin — admin@vendora.com', email: 'admin@vendora.com', password: 'Admin@123' },
                    { label: 'Seller — seller@vendora.com', email: 'seller@vendora.com', password: 'Seller@123' },
                    { label: 'Buyer — buyer@vendora.com', email: 'buyer@vendora.com', password: 'Buyer@123' },
                  ].map((d) => (
                    <button key={d.email} className="btn btn-outline btn-sm" onClick={() => fillDemo(d.email, d.password)}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
