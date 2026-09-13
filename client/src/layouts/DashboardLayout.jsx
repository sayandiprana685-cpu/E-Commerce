import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { FiMenu, FiX, FiLogOut, FiBell, FiChevronRight, FiGrid, FiPackage, FiHeart, FiUser, FiCreditCard, FiMessageSquare, FiRotateCcw, FiShoppingBag, FiBarChart2, FiTag, FiLayers, FiUsers, FiShield, FiHome, FiPercent, FiDollarSign, FiSettings, FiPlusCircle, FiList, FiRefreshCw } from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { getInitials } from '../utils/format';

const BUYER_MENU = [
  { to: '/account', icon: <FiGrid />, label: 'Overview', end: true },
  { to: '/account/orders', icon: <FiPackage />, label: 'Orders' },
  { to: '/account/returns', icon: <FiRotateCcw />, label: 'Returns' },
  { to: '/account/wishlist', icon: <FiHeart />, label: 'Wishlist' },
  { to: '/account/reviews', icon: <FiMessageSquare />, label: 'Reviews' },
  { to: '/account/payments', icon: <FiCreditCard />, label: 'Payments' },
  { to: '/account/addresses', icon: <FiHome />, label: 'Addresses' },
  { to: '/account/notifications', icon: <FiBell />, label: 'Notifications' },
  { to: '/account/profile', icon: <FiUser />, label: 'Profile' },
];

const SELLER_MENU = [
  { to: '/seller', icon: <FiGrid />, label: 'Overview', end: true },
  { to: '/seller/products', icon: <FiTag />, label: 'Products' },
  { to: '/seller/products/new', icon: <FiPlusCircle />, label: 'Add Product' },
  { to: '/seller/orders', icon: <FiShoppingBag />, label: 'Orders' },
  { to: '/seller/analytics', icon: <FiBarChart2 />, label: 'Analytics' },
  { to: '/account/notifications', icon: <FiBell />, label: 'Notifications' },
  { to: '/account/profile', icon: <FiSettings />, label: 'Profile' },
];

const ADMIN_MENU = [
  { to: '/admin', icon: <FiGrid />, label: 'Overview', end: true },
  { to: '/admin/users', icon: <FiUsers />, label: 'Buyers' },
  { to: '/admin/sellers', icon: <FiShield />, label: 'Sellers' },
  { to: '/admin/products', icon: <FiTag />, label: 'Products' },
  { to: '/admin/categories', icon: <FiLayers />, label: 'Categories' },
  { to: '/admin/brands', icon: <FiPercent />, label: 'Brands' },
  { to: '/admin/orders', icon: <FiShoppingBag />, label: 'Orders' },
  { to: '/admin/payments', icon: <FiDollarSign />, label: 'Payments' },
  { to: '/admin/coupons', icon: <FiList />, label: 'Coupons' },
  { to: '/admin/reviews', icon: <FiMessageSquare />, label: 'Reviews' },
  { to: '/admin/returns', icon: <FiRefreshCw />, label: 'Returns' },
  { to: '/admin/notifications', icon: <FiBell />, label: 'Notifications' },
];

const DashboardLayout = ({ role }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menu = role === 'admin' ? ADMIN_MENU : role === 'seller' ? SELLER_MENU : BUYER_MENU;
  const roleLabel = role === 'admin' ? 'Admin Panel' : role === 'seller' ? 'Seller Center' : 'My Account';

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const sidebar = (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--line)' }}>
        <div className="flex-center gap-12">
          <span style={{ width: 38, height: 38, borderRadius: 11, background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '1.1rem' }}>V</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.4px' }}>Vendora</div>
            <div className="small muted" style={{ fontWeight: 600 }}>{roleLabel}</div>
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, overflowY: 'auto', padding: '14px 12px' }}>
        {menu.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 11,
              marginBottom: 3, fontWeight: 600, fontSize: '0.9rem', color: isActive ? 'var(--primary)' : 'var(--ink-2)',
              background: isActive ? 'var(--primary-50)' : 'transparent',
              borderLeft: isActive ? 'none' : 'none',
            })}
            activeStyle={{ background: 'var(--primary-50)', color: 'var(--primary)' }}
          >
            <span style={{ fontSize: 17, display: 'flex' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--line)', padding: 14 }}>
        <div className="card" style={{ padding: 13, display: 'flex', alignItems: 'center', gap: 11, borderRadius: 14 }}>
          <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', flexShrink: 0 }}>
            {getInitials(user?.name)}
          </span>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.86rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div className="small muted" style={{ textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button
            className="modal-x"
            onClick={() => { logout(); navigate('/'); }}
            aria-label="Logout"
            title="Logout"
            style={{ color: 'var(--danger)' }}
          >
            <FiLogOut />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Desktop sidebar */}
      <aside className="dash-sidebar" style={{ width: 'var(--sidebar-w)', background: '#fff', borderRight: '1px solid var(--line)', position: 'sticky', top: 0, height: '100vh' }}>
        {sidebar}
      </aside>

      {/* Mobile sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 190 }} />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 280, background: '#fff', zIndex: 200, boxShadow: 'var(--shadow-lg)' }}
            >
              {sidebar}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Topbar */}
        <div className="dash-topbar" style={{ position: 'sticky', top: 0, zIndex: 90, background: 'rgba(248,250,252,0.9)', backdropFilter: 'blur(10px)', borderBottom: '1px solid var(--line)', display: 'flex', alignItems: 'center', gap: 14, padding: '13px 26px' }}>
          <button className="btn-icon btn-ghost dash-menu-btn" onClick={() => setSidebarOpen(true)} aria-label="Open sidebar">
            <FiMenu size={20} />
          </button>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="dash-breadcrumb">{roleLabel}</span>
            <FiChevronRight size={14} className="muted" />
            <span className="muted" style={{ fontWeight: 500, textTransform: 'capitalize' }}>
              {location.pathname.split('/').filter(Boolean).slice(1).join(' / ').replace(/-/g, ' ') || 'Overview'}
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            {role !== 'admin' && (
              <button className="btn btn-ghost btn-sm" onClick={() => navigate('/shop')}>
                <FiHome size={15} /> Store
              </button>
            )}
            {role !== 'admin' && (
              <button className="btn-icon btn-ghost" onClick={() => navigate('/account/notifications')} aria-label="Notifications" style={{ position: 'relative' }}>
                <FiBell size={18} />
              </button>
            )}
          </div>
        </div>

        <motion.div key={location.pathname} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} style={{ padding: '26px' }} className="dash-content">
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardLayout;
