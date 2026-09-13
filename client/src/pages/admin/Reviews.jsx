import { useEffect, useState } from 'react';
import { FiSearch, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const reviewStatusOptions = ['all', 'visible', 'hidden'];

const Reviews = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/reviews', { params: { status, page, limit: 8 } });
        setReviews(res.data.data.reviews || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [page, status, toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reviews</h1>
          <p className="page-sub">Moderate customer feedback and review visibility.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {reviewStatusOptions.map((option) => (
          <button
            key={option}
            className={`chip ${status === option ? 'active' : ''}`}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === 'all' ? 'All reviews' : option}
          </button>
        ))}
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : reviews.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiStar />} title="No reviews found" description="Review moderation results will appear here." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Review</th>
                  <th>Product</th>
                  <th>Rating</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{review.title || 'Review'}</div>
                      <div className="small muted">{review.comment}</div>
                    </td>
                    <td>{review.product?.name || '—'}</td>
                    <td>{review.rating} / 5</td>
                    <td><span className={`badge ${review.status === 'visible' ? 'badge-success' : 'badge-gray'}`}>{review.status}</span></td>
                    <td>{formatDate(review.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default Reviews;
