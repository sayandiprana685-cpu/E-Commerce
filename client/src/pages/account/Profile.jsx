import { useState } from 'react';
import { FiUser, FiLock, FiSave, FiShield, FiMail } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getInitials, formatDate } from '../../utils/format';

const Profile = () => {
  const { user, refreshUser } = useAuth();
  const toast = useToast();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [saving, setSaving] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdError, setPwdError] = useState('');
  const [changingPwd, setChangingPwd] = useState(false);

  const saveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put('/users/profile', form);
      await refreshUser();
      toast('Profile updated.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwd.newPassword !== pwd.confirmPassword) {
      setPwdError('New passwords do not match.');
      return;
    }
    if (pwd.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    setChangingPwd(true);
    try {
      await api.put('/auth/change-password', {
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast('Password changed successfully.', 'success');
    } catch (err) {
      setPwdError(err.message);
    } finally {
      setChangingPwd(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Profile Settings</h1>
          <p className="page-sub">Manage your personal information and account security.</p>
        </div>
      </div>

      <div className="grid dash-2col-even">
        {/* Personal info */}
        <div className="card card-pad">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiUser size={16} /> Personal Information
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 22 }}>
            {form.avatar ? (
              <img src={form.avatar} alt="avatar" style={{ width: 68, height: 68, borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--primary-100)' }} />
            ) : (
              <div className="avatar" style={{ width: 68, height: 68, fontSize: '1.3rem' }}>{getInitials(form.name)}</div>
            )}
            <div>
              <div style={{ fontWeight: 800 }}>{user?.name}</div>
              <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                <FiMail size={12} /> {user?.email}
              </div>
              <div className="small muted mt-8" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <FiShield size={12} /> {user?.role} · Member since {formatDate(user?.createdAt)}
              </div>
            </div>
          </div>

          <form onSubmit={saveProfile}>
            <div className="field">
              <label className="label">Full name</label>
              <input className="field" required value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">Phone</label>
              <input className="field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="10-digit mobile number" />
            </div>
            <div className="field">
              <label className="label">Avatar image URL</label>
              <input className="field" value={form.avatar} onChange={(e) => setForm((f) => ({ ...f, avatar: e.target.value }))} placeholder="https://…" />
            </div>
            <button type="submit" className="btn btn-primary" disabled={saving || form.name === user?.name && form.phone === (user?.phone || '') && form.avatar === (user?.avatar || '')}>
              {saving ? <span className="spinner" /> : <FiSave size={15} />} Save changes
            </button>
          </form>
        </div>

        {/* Change password */}
        <div className="card card-pad">
          <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FiLock size={16} /> Change Password
          </h3>
          <form onSubmit={changePassword}>
            <div className="field">
              <label className="label">Current password</label>
              <input className="field" type="password" required value={pwd.currentPassword} onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))} />
            </div>
            <div className="field">
              <label className="label">New password</label>
              <input className="field" type="password" required value={pwd.newPassword} onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))} placeholder="Minimum 6 characters" />
            </div>
            <div className="field">
              <label className="label">Confirm new password</label>
              <input className="field" type="password" required value={pwd.confirmPassword} onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))} />
            </div>
            {pwdError && <div className="form-error mb-16">{pwdError}</div>}
            <button type="submit" className="btn btn-secondary" disabled={changingPwd}>
              {changingPwd ? <span className="spinner" /> : <FiLock size={15} />} Update password
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
