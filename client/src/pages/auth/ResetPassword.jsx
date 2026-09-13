import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiKey, FiLock, FiCheckCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ResetPassword = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [form, setForm] = useState({ token: params.get('token') || '', password: '', confirm: '' });
  const [submitting, setSubmitting] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast('Passwords do not match.', 'error');
    if (form.password.length < 6) return toast('Password must be at least 6 characters.', 'warning');
    if (!form.token.trim()) return toast('Please paste the reset token from your email.', 'warning');
    setSubmitting(true);
    try {
      const res = await api.post('/auth/reset-password', { token: form.token, password: form.password });
      toast(res.data.message || 'Password reset. Please log in.', 'success');
      navigate('/login');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h2>Choose a new password</h2>
        <p>Pick something strong — at least 6 characters. You'll sign in with it right after.</p>
      </div>

      <div className="auth-form-col">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1>Reset password</h1>
          <p className="auth-sub">
            Don't have a token? <Link to="/forgot-password" style={{ fontWeight: 700, color: 'var(--primary)' }}>Request one</Link>
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Reset token</label>
              <div className="input-icon">
                <FiKey size={16} />
                <input className="field" required value={form.token} onChange={set('token')} placeholder="Paste the token from your email" style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} />
              </div>
            </div>
            <div>
              <label className="label">New password</label>
              <div className="input-icon">
                <FiLock size={16} />
                <input className="field" type="password" required value={form.password} onChange={set('password')} placeholder="Min 6 characters" autoComplete="new-password" />
              </div>
            </div>
            <div>
              <label className="label">Confirm new password</label>
              <div className="input-icon">
                <FiCheckCircle size={16} />
                <input className="field" type="password" required value={form.confirm} onChange={set('confirm')} placeholder="Repeat password" autoComplete="new-password" />
              </div>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              {submitting ? 'Resetting…' : 'Reset password'}
            </button>
          </form>

          <p className="small muted" style={{ marginTop: 16, textAlign: 'center' }}>
            <Link to="/login" style={{ fontWeight: 600, color: 'var(--primary)' }}>Back to sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default ResetPassword;
