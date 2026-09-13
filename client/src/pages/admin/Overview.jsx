import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiUsers, FiShield, FiPackage, FiShoppingBag, FiDollarSign, FiBarChart2 } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate } from '../../utils/format';

const Overview = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({ stats: {}, revenueByMonth: [], topCategories: [], recentOrders: [] });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get('/admin/dashboard');
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
  const revenueMax = Math.max(...(dashboard.revenueByMonth.map((m) => m.revenue || 0) || [1]), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Admin Overview</h1>
          <p className="page-sub">Platform-wide performance, user growth, and marketplace activity.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard icon={<FiUsers />} label="Buyers" value={stats.totalUsers || 0} sub="Registered users" index={0} />
            <StatCard icon={<FiShield />} label="Sellers" value={stats.totalSellers || 0} sub={`${stats.pendingSellers || 0} pending approval`} index={1} color="var(--info)" bg="var(--info-bg)" />
            <StatCard icon={<FiPackage />} label="Products" value={stats.totalProducts || 0} sub="Active listings" index={2} color="var(--success)" bg="var(--success-bg)" />
            <StatCard icon={<FiDollarSign />} label="Revenue" value={formatPrice(stats.totalRevenue || 0)} sub={`${stats.totalOrders || 0} total orders`} index={3} color="var(--warning)" bg="var(--warning-bg)" />
          </div>

          <div className="grid dash-2col mt-24">
            <div className="card card-pad">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Monthly revenue</h3>
                <span className="badge badge-primary">12 month trend</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 220 }}>
                {dashboard.revenueByMonth.map((month) => (
                  <div key={`${month.year}-${month.month}`} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 180 }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 32,
                          height: `${Math.max(8, (month.revenue / revenueMax) * 100)}%`,
                          borderRadius: 8,
                          background: 'linear-gradient(180deg, #c4b5fd 0%, #6d28d9 100%)',
                        }}
                        title={`${month.label}: ${formatPrice(month.revenue)}`}
                      />
                    </div>
                    <span className="small muted" style={{ fontSize: '0.68rem' }}>{month.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Top categories</h3>
                <Link to="/admin/products" className="small" style={{ color: 'var(--primary)', fontWeight: 700 }}>Manage catalog</Link>
              </div>
              {dashboard.topCategories.length === 0 ? (
                <div className="muted" style={{ padding: '20px' }}>No category data available.</div>
              ) : (
                dashboard.topCategories.map((category) => (
                  <div key={category._id || category.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{category.name}</div>
                      <div className="small muted">{category.products} products</div>
                    </div>
                    <div style={{ fontWeight: 800 }}>{category.sold} sold</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card card-pad mt-24">
            <div className="flex-between mb-16">
              <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent orders</h3>
              <Link to="/admin/orders" className="small" style={{ color: 'var(--primary)', fontWeight: 700 }}>View all orders</Link>
            </div>
            {dashboard.recentOrders.length === 0 ? (
              <div className="muted">No recent orders.</div>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Total</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>{order.orderNumber}</td>
                        <td>{order.user?.name || 'Guest'}</td>
                        <td>{formatPrice(order.total)}</td>
                        <td>{formatDate(order.createdAt)}</td>
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

export default Overview;
