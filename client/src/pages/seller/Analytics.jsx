import { useEffect, useState } from 'react';
import { FiBarChart2, FiTrendingUp, FiShoppingBag, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice } from '../../utils/format';

const Analytics = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({ stats: {}, salesByDay: [], bestSellers: [] });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/seller/dashboard');
        setDashboard(res.data.data);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [toast]);

  const stats = dashboard.stats || {};
  const chartMax = Math.max(...(dashboard.salesByDay.map((d) => d.revenue || 0) || [1]), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Seller Analytics</h1>
          <p className="page-sub">Review performance, revenue, and best-selling products.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard icon={<FiShoppingBag />} label="Orders" value={stats.totalOrders || 0} sub={`${stats.pendingOrders || 0} pending`} index={0} />
            <StatCard icon={<FiDollarSign />} label="Revenue" value={formatPrice(stats.totalRevenue || 0)} sub={`${stats.unitsSold || 0} units sold`} index={1} color="var(--success)" bg="var(--success-bg)" />
            <StatCard icon={<FiTrendingUp />} label="Completed" value={stats.completedOrders || 0} sub="Delivered orders" index={2} color="var(--info)" bg="var(--info-bg)" />
            <StatCard icon={<FiBarChart2 />} label="Verification" value={stats.verificationStatus || 'pending'} sub="Seller status" index={3} color="var(--warning)" bg="var(--warning-bg)" />
          </div>

          <div className="card card-pad mt-24">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>Revenue by day</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 230 }}>
              {dashboard.salesByDay.map((day) => (
                <div key={day.date} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 180 }}>
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 36,
                        height: `${Math.max(10, (day.revenue / chartMax) * 100)}%`,
                        borderRadius: 10,
                        background: 'linear-gradient(180deg, #c4b5fd 0%, #7c3aed 100%)',
                      }}
                      title={`${day.label}: ${formatPrice(day.revenue)}`}
                    />
                  </div>
                  <span className="small muted" style={{ fontSize: '0.72rem' }}>{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card card-pad mt-24">
            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: 16 }}>Top selling products</h3>
            {dashboard.bestSellers.length === 0 ? (
              <div className="muted">No sales data available yet.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Units sold</th>
                      <th>Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.bestSellers.map((item) => (
                      <tr key={item._id}>
                        <td>{item.name}</td>
                        <td>{item.soldCount || 0}</td>
                        <td>{formatPrice((item.price || 0) * (item.soldCount || 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Analytics;
