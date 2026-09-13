import { useEffect, useState } from 'react';
import { FiSearch, FiUserX } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatDate } from '../../utils/format';

const Users = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/users', { params: { search, page, limit: 8 } });
        setUsers(res.data.data.users || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [page, search, toast]);

  const toggleBlock = async (userId, blocked) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      toast(blocked ? 'Buyer unblocked.' : 'Buyer blocked.', 'success');
      setPage(1);
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Buyers</h1>
          <p className="page-sub">View, search, and manage customer accounts.</p>
        </div>
      </div>

      <div className="card card-pad mb-24">
        <div className="input-icon">
          <FiSearch size={15} />
          <input className="field" placeholder="Search buyers" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : users.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiUserX />} title="No buyers found" description="No accounts match the current filter." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Buyer</th>
                  <th>Email</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>{user.name}</td>
                    <td>{user.email}</td>
                    <td>{formatDate(user.createdAt)}</td>
                    <td>
                      <span className={`badge ${user.isBlocked ? 'badge-danger' : 'badge-success'}`}>{user.isBlocked ? 'Blocked' : 'Active'}</span>
                    </td>
                    <td>
                      <button className={`btn btn-sm ${user.isBlocked ? 'btn-secondary' : 'btn-ghost'}`} onClick={() => toggleBlock(user._id, user.isBlocked)}>
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
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

export default Users;
