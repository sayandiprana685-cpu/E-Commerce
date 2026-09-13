import { useEffect, useState } from 'react';
import { FiSearch, FiTag } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate } from '../../utils/format';

const Coupons = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [coupons, setCoupons] = useState([]);

  useEffect(() => {
    const fetchCoupons = async () => {
      try {
        const res = await api.get('/admin/coupons');
        setCoupons(res.data.data.coupons || []);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCoupons();
  }, [toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Coupons</h1>
          <p className="page-sub">Review campaign coupons and promotional discount rules.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : coupons.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiTag />} title="No coupons found" description="Promotional coupon codes will appear here." />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Value</th>
                <th>Usage</th>
                <th>Expires</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => (
                <tr key={coupon._id}>
                  <td style={{ fontWeight: 800 }}>{coupon.code}</td>
                  <td>{coupon.type}</td>
                  <td>{coupon.type === 'percentage' ? `${coupon.value}%` : formatPrice(coupon.value)}</td>
                  <td>{coupon.usedCount}/{coupon.usageLimit}</td>
                  <td>{formatDate(coupon.expiresAt)}</td>
                  <td><span className={`badge ${coupon.isActive ? 'badge-success' : 'badge-gray'}`}>{coupon.isActive ? 'Active' : 'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Coupons;
