import { useEffect, useState } from 'react';
import { FiSearch, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const sellerStatusOptions = ['all', 'pending', 'verified', 'rejected'];

const Sellers = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sellers, setSellers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1, pendingCount: 0 });

  useEffect(() => {
    const fetchSellers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/sellers', { params: { search, page, limit: 8, status } });
        setSellers(res.data.data.sellers || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1, pendingCount: 0 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchSellers();
  }, [page, search, status, toast]);

  const verifySeller = async (sellerId, nextStatus) => {
    try {
      await api.put(`/admin/sellers/${sellerId}/verify`, { status: nextStatus });
      toast(`Seller ${nextStatus}.`, 'success');
      setPage(1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Sellers</h1>
          <p className="page-sub">Monitor seller applications, approvals, and account status.</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        {sellerStatusOptions.map((option) => (
          <button
            key={option}
            className={`chip ${status === option ? 'active' : ''}`}
            onClick={() => {
              setStatus(option);
              setPage(1);
            }}
          >
            {option === 'all' ? 'All sellers' : option}
          </button>
        ))}
      </div>

      <div className="card card-pad mb-24">
        <div className="input-icon">
          <FiSearch size={15} />
          <input className="field" placeholder="Search sellers or shop names" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : sellers.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiCheckCircle />} title="No sellers found" description="No sellers match the selected filters." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Seller</th>
                  <th>Shop</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sellers.map((seller) => (
                  <tr key={seller._id}>
                    <td>
                      <div style={{ fontWeight: 700 }}>{seller.name}</div>
                      <div className="small muted">{seller.email}</div>
                    </td>
                    <td>{seller.sellerInfo?.shopName || '—'}</td>
                    <td>{formatDate(seller.createdAt)}</td>
                    <td>
                      <span className={`badge ${seller.sellerInfo?.status === 'verified' ? 'badge-success' : seller.sellerInfo?.status === 'rejected' ? 'badge-danger' : 'badge-warning'}`}>
                        {seller.sellerInfo?.status || 'pending'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => verifySeller(seller._id, 'verified')}>
                          <FiCheckCircle size={13} /> Approve
                        </button>
                        <button className="btn btn-sm btn-ghost" onClick={() => verifySeller(seller._id, 'rejected')} style={{ color: 'var(--danger)' }}>
                          <FiXCircle size={13} /> Reject
                        </button>
                      </div>
                    </td>
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

export default Sellers;
