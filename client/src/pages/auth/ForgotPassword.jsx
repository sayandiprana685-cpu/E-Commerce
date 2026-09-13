import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiMail, FiSend, FiKey, FiCopy } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const ForgotPassword = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [resetToken, setResetToken] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResetToken(res.data.data.resetToken || null);
      toast(res.data.message, 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-hero">
        <h2>Reset your password</h2>
        <p>Enter the email linked to your Vendora account and we'll get you back in.</p>
      </div>

      <div className="auth-form-col">
        <motion.div className="auth-card" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <h1>Forgot password</h1>
          <p className="auth-sub">
            Remembered it? <Link to="/login" style={{ fontWeight: 700, color: 'var(--primary)' }}>Back to sign in</Link>
          </p>

          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label className="label">Email address</label>
              <div className="input-icon">
                <FiMail size={16} />
                <input className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </div>
            </div>
            <button className="btn btn-primary btn-lg btn-block" disabled={submitting}>
              <FiSend /> {submitting ? 'Sending…' : 'Send reset link'}
            </button>
          </form>

          {resetToken && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 14,
                background: 'var(--info-bg)',
                border: '1px solid #bae6fd',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--info)', marginBottom: 8 }}>
                <FiKey size={15} /> Demo mode — your reset token
              </div>
              <p className="small" style={{ color: 'var(--ink-2)', marginBottom: 10 }}>
                In production this token is emailed to you. For this demo, copy it or continue directly:
              </p>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="field" readOnly value={resetToken} style={{ fontFamily: 'monospace', fontSize: '0.78rem' }} onFocus={(e) => e.target.select()} />
                <button
                  className="btn btn-outline"
                  onClick={() => {
                    navigator.clipboard?.writeText(resetToken);
                    toast('Token copied to clipboard.', 'success');
                  }}
                  aria-label="Copy token"
                >
                  <FiCopy />
                </button>
              </div>
              <Link to={`/reset-password?token=${resetToken}`} className="btn btn-primary btn-block mt-16">
                Continue to reset password
              </Link>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ForgotPassword;
