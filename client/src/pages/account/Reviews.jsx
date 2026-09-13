import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiMessageSquare, FiEdit2, FiTrash2, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const StarPicker = ({ value, onChange }) => (
  <div style={{ display: 'flex', gap: 4 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        type="button"
        onClick={() => onChange(n)}
        aria-label={`${n} star`}
        style={{ background: 'none', border: 'none', padding: 2, color: n <= value ? '#f59e0b' : '#cbd5e1', fontSize: 24, lineHeight: 1, cursor: 'pointer' }}
      >
        <FiStar fill={n <= value ? 'currentColor' : 'none'} />
      </button>
    ))}
  </div>
);

const Reviews = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ rating: 5, title: '', comment: '' });
  const [saving, setSaving] = useState(false);

  const fetchReviews = async () => {
    try {
      const res = await api.get('/reviews/me');
      setReviews(res.data.data.reviews);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReviews(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openEdit = (r) => {
    setEditing(r);
    setForm({ rating: r.rating, title: r.title || '', comment: r.comment });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/reviews/${editing._id}`, form);
      toast('Review updated.', 'success');
      setEditing(null);
      fetchReviews();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm('Delete this review? This cannot be undone.')) return;
    try {
      await api.delete(`/reviews/${r._id}`);
      setReviews((list) => list.filter((x) => x._id !== r._id));
      toast('Review deleted.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Reviews</h1>
          <p className="page-sub">Reviews you've written — edit or remove them anytime.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={4} />
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiMessageSquare />}
            title="No reviews yet"
            description="Share your experience with products you've purchased to help other shoppers."
            action={<Link to="/account/orders?status=delivered" className="btn btn-secondary btn-sm">Review a purchase</Link>}
          />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {reviews.map((r) => (
            <div key={r._id} className="card card-pad">
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                <Link to={`/product/${r.product?.slug || r.product?._id}`} className="cart-item-img" style={{ width: 72, height: 72 }}>
                  <img src={r.product?.images?.[0] || '/placeholder.png'} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Link>
                <div style={{ minWidth: 220, flex: 1 }}>
                  <div className="flex-between" style={{ gap: 8, flexWrap: 'wrap' }}>
                    <Link to={`/product/${r.product?.slug || r.product?._id}`} style={{ fontWeight: 700, fontSize: '0.95rem' }}>
                      {r.product?.name || 'Product'}
                    </Link>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(r)}>
                        <FiEdit2 size={13} /> Edit
                      </button>
                      <button className="btn btn-ghost btn-sm" onClick={() => remove(r)} style={{ color: 'var(--danger)' }}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>
                  <div className="flex-center gap-8 mt-8" style={{ flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', gap: 2, color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <FiStar key={n} size={14} fill={n <= r.rating ? 'currentColor' : 'none'} />
                      ))}
                    </span>
                    {r.isVerifiedPurchase && <span className="badge badge-success">Verified purchase</span>}
                    <span className="small muted">{formatDate(r.createdAt)}</span>
                  </div>
                  {r.title && <div style={{ fontWeight: 700, fontSize: '0.9rem', marginTop: 10 }}>{r.title}</div>}
                  <p className="small muted" style={{ marginTop: 4, lineHeight: 1.7 }}>{r.comment}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Edit review">
        <form onSubmit={saveEdit}>
          <div className="field">
            <label className="label">Your rating</label>
            <StarPicker value={form.rating} onChange={(rating) => setForm((f) => ({ ...f, rating }))} />
          </div>
          <div className="field">
            <label className="label">Title</label>
            <input className="field" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Sum it up in a few words" />
          </div>
          <div className="field">
            <label className="label">Review</label>
            <textarea className="textarea" required value={form.comment} onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))} placeholder="What did you like or dislike?" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
            <button type="button" className="btn btn-outline" onClick={() => setEditing(null)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null} Save changes
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Reviews;
