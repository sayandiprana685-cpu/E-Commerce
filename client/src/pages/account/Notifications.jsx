import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiBell, FiCheck, FiPackage, FiAlertTriangle, FiInfo, FiCheckCircle, FiTag, FiInbox } from 'react-icons/fi';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import { RowSkeleton } from '../../components/Skeletons';
import { timeAgo } from '../../utils/format';

const TYPE_META = {
  order: { icon: <FiPackage />, bg: 'var(--primary-50)', color: 'var(--primary)' },
  warning: { icon: <FiAlertTriangle />, bg: 'var(--warning-bg)', color: 'var(--warning)' },
  success: { icon: <FiCheckCircle />, bg: 'var(--success-bg)', color: 'var(--success)' },
  promo: { icon: <FiTag />, bg: '#fffbeb', color: 'var(--accent-dark)' },
  info: { icon: <FiInfo />, bg: 'var(--info-bg)', color: 'var(--info)' },
};

const normalizeLink = (link, role) => {
  if (!link) return '';
  if (link.startsWith('/orders/')) return `/account${link}`;
  if (link.startsWith('/seller') && role === 'seller') return link;
  if (link.startsWith('/admin') && role === 'admin') return link;
  return link;
};

const Notifications = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const role = user?.role || 'buyer';
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [meta, setMeta] = useState({ page: 1, totalPages: 1, unreadCount: 0 });
  const [page, setPage] = useState(1);

  const fetchNotifications = useCallback(async (p) => {
    setLoading(true);
    try {
      const res = await api.get('/notifications', { params: { page: p, limit: 15 } });
      setNotifications(res.data.data.notifications);
      setMeta(res.data.meta);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchNotifications(page);
  }, [page, fetchNotifications]);

  const markAllRead = async () => {
    try {
      await api.put('/notifications/read');
      setNotifications((list) => list.map((n) => ({ ...n, isRead: true })));
      setMeta((m) => ({ ...m, unreadCount: 0 }));
      toast('All notifications marked as read.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const openNotification = async (n) => {
    if (!n.isRead) {
      try {
        await api.put(`/notifications/${n._id}/read`);
        setNotifications((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
        setMeta((m) => ({ ...m, unreadCount: Math.max(0, m.unreadCount - 1) }));
      } catch {
        // non-blocking — still navigate
      }
    }
    const link = normalizeLink(n.link, role);
    if (link) navigate(link);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-sub">
            {meta.unreadCount > 0 ? `${meta.unreadCount} unread notification${meta.unreadCount > 1 ? 's' : ''}` : "You're all caught up."}
          </p>
        </div>
        {meta.unreadCount > 0 && (
          <button className="btn btn-secondary btn-sm" onClick={markAllRead}>
            <FiCheck size={14} /> Mark all as read
          </button>
        )}
      </div>

      <div className="card">
        {loading ? (
          <div style={{ padding: 20 }}><RowSkeleton rows={6} /></div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<FiInbox />}
            title="No notifications"
            description="Order updates, return decisions and offers will show up here."
          />
        ) : (
          notifications.map((n) => {
            const t = TYPE_META[n.type] || TYPE_META.info;
            return (
              <div
                key={n._id}
                className={`notif-item ${n.isRead ? '' : 'unread'}`}
                onClick={() => openNotification(n)}
                style={{ cursor: n.link ? 'pointer' : 'default' }}
              >
                <div className="notif-icon" style={{ background: t.bg, color: t.color }}>{t.icon}</div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <strong style={{ fontSize: '0.92rem' }}>{n.title}</strong>
                    {!n.isRead && <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary-600)', flexShrink: 0 }} />}
                  </div>
                  <div className="small muted" style={{ marginTop: 2, lineHeight: 1.6 }}>{n.message}</div>
                  <div className="small muted" style={{ marginTop: 4 }}>{timeAgo(n.createdAt)}</div>
                </div>
                <FiBell size={14} className="muted" style={{ opacity: 0.4, marginTop: 4 }} />
              </div>
            );
          })
        )}
      </div>

      {!loading && meta.totalPages > 1 && (
        <Pagination page={meta.page} totalPages={meta.totalPages} onChange={setPage} />
      )}
    </div>
  );
};

export default Notifications;
