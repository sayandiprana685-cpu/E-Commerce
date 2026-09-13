import { useEffect, useState } from 'react';
import { FiBell, FiSend } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';

const Notifications = () => {
  const toast = useToast();
  const [form, setForm] = useState({ title: '', message: '', type: 'info', audience: 'all', link: '' });
  const [sending, setSending] = useState(false);

  const handleSend = async (e) => {
    e.preventDefault();
    setSending(true);

    try {
      await api.post('/admin/notifications', form);
      toast('Notification broadcast sent.', 'success');
      setForm({ title: '', message: '', type: 'info', audience: 'all', link: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">Broadcast alerts and campaign messages to buyers, sellers, or everyone.</p>
        </div>
      </div>

      <div className="card card-pad">
        <form onSubmit={handleSend}>
          <div className="grid grid-2">
            <div className="field">
              <label className="label">Title</label>
              <input className="field" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field">
              <label className="label">Audience</label>
              <select className="field" value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })}>
                <option value="all">Everyone</option>
                <option value="buyers">Buyers</option>
                <option value="sellers">Sellers</option>
                <option value="admins">Admins</option>
              </select>
            </div>
          </div>

          <div className="field mt-16">
            <label className="label">Message</label>
            <textarea className="textarea" required rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          </div>

          <div className="grid grid-2 mt-16">
            <div className="field">
              <label className="label">Type</label>
              <select className="field" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="promo">Promo</option>
              </select>
            </div>
            <div className="field">
              <label className="label">Link</label>
              <input className="field" value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} placeholder="Optional route, e.g. /shop" />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 20 }}>
            <button type="submit" className="btn btn-primary" disabled={sending}>
              <FiSend size={15} /> {sending ? 'Sending...' : 'Send notification'}
            </button>
          </div>
        </form>
      </div>

      <div className="card card-pad mt-24">
        <EmptyState icon={<FiBell />} title="Broadcast Center" description="Use the form above to send platform-wide announcements and reminders." />
      </div>
    </div>
  );
};

export default Notifications;
