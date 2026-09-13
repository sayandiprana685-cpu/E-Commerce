import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiShoppingBag, FiDollarSign, FiAlertTriangle, FiChevronRight } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import StatCard from '../../components/StatCard';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, formatDate, orderStatusColor } from '../../utils/format';

const Overview = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState({
    stats: {},
    salesByDay: [],
    recentOrders: [],
    lowStock: [],
    bestSellers: [],
  });

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
  const maxSales = Math.max(...(dashboard.salesByDay.map((d) => d.revenue || 0) || [1]), 1);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Seller Overview</h1>
          <p className="page-sub">Track your performance, sales, and inventory health.</p>
        </div>
        <Link to="/seller/products/new" className="btn btn-primary">
          <FiPackage size={16} /> Add product
        </Link>
      </div>

      {loading ? (
        <RowSkeleton rows={6} />
      ) : (
        <>
          <div className="grid grid-4">
            <StatCard icon={<FiPackage />} label="Total Products" value={stats.totalProducts || 0} sub="Live listings" index={0} />
            <StatCard icon={<FiShoppingBag />} label="Total Orders" value={stats.totalOrders || 0} sub={`${stats.pendingOrders || 0} pending`} index={1} color="var(--info)" bg="var(--info-bg)" />
            <StatCard icon={<FiDollarSign />} label="Revenue" value={formatPrice(stats.totalRevenue || 0)} sub={`Sold ${stats.unitsSold || 0} units`} index={2} color="var(--success)" bg="var(--success-bg)" />
            <StatCard icon={<FiAlertTriangle />} label="Low stock" value={stats.lowStockCount || 0} sub={`${stats.completedOrders || 0} completed orders`} index={3} color="var(--warning)" bg="var(--warning-bg)" />
          </div>

          <div className="grid dash-2col mt-24">
            <div className="card card-pad">
              <div className="flex-between mb-16">
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Revenue Trend</h3>
                <span className="badge badge-primary">Last 14 days</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, minHeight: 210, paddingTop: 8 }}>
                {dashboard.salesByDay.map((day) => (
                  <div key={day.date} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', height: 170 }}>
                      <div
                        style={{
                          width: '100%',
                          maxWidth: 36,
                          height: `${Math.max(8, (day.revenue / maxSales) * 100)}%`,
                          borderRadius: 10,
                          background: 'linear-gradient(180deg, #a78bfa 0%, #6d28d9 100%)',
                          boxShadow: '0 8px 16px rgba(109,40,217,0.18)',
                        }}
                        title={`${day.label}: ${formatPrice(day.revenue)}`}
                      />
                    </div>
                    <span className="small muted" style={{ fontSize: '0.72rem' }}>{day.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Best Sellers</h3>
                <Link to="/seller/products" className="small" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Manage products <FiChevronRight size={14} />
                </Link>
              </div>
              {dashboard.bestSellers.length === 0 ? (
                <EmptyState icon={<FiPackage />} title="No sales yet" description="Your top-selling products will appear here once orders start coming in." />
              ) : (
                dashboard.bestSellers.map((product) => (
                  <div key={product._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} style={{ width: 48, height: 48, borderRadius: 10, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{product.name}</div>
                      <div className="small muted">{product.soldCount || 0} units sold</div>
                    </div>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>{formatPrice(product.price || 0)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="grid dash-2col mt-24">
            <div className="card">
              <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Recent Orders</h3>
                <Link to="/seller/orders" className="small" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  View all <FiChevronRight size={14} />
                </Link>
              </div>

              {dashboard.recentOrders.length === 0 ? (
                <EmptyState icon={<FiShoppingBag />} title="No orders yet" description="Orders will appear here when buyers purchase your products." />
              ) : (
                dashboard.recentOrders.map((order) => (
                  <div key={order._id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{order.orderNumber}</div>
                      <div className="small muted">{order.user?.name || 'Customer'} · {formatDate(order.createdAt)}</div>
                    </div>
                    <span className={`status-pill ${orderStatusColor(order.status)}`}>{order.status}</span>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', minWidth: 90, textAlign: 'right' }}>{formatPrice(order.total)}</div>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <div className="flex-between" style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>Low Stock</h3>
                <Link to="/seller/products" className="small" style={{ color: 'var(--primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>
                  Restock <FiChevronRight size={14} />
                </Link>
              </div>

              {dashboard.lowStock.length === 0 ? (
                <EmptyState icon={<FiAlertTriangle />} title="Inventory healthy" description="You don’t have any products with stock below the warning threshold." />
              ) : (
                dashboard.lowStock.map((item) => (
                  <div key={item._id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px', borderBottom: '1px solid #f1f5f9' }}>
                    <img src={item.images?.[0] || '/placeholder.png'} alt={item.name} style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'cover' }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{item.name}</div>
                      <div className="small muted">Only {item.stock} left</div>
                    </div>
                    <span className="badge badge-warning">Low</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Overview;
