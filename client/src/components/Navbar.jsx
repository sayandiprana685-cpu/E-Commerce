import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiSearch, FiHeart, FiShoppingCart, FiUser, FiMenu, FiX, FiLogOut, FiPackage,
  FiSettings, FiGrid, FiBell, FiChevronDown, FiHome,
} from 'react-icons/fi';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { getInitials } from '../utils/format';

const Logo = () => (
  <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
    <span
      style={{
        width: 38, height: 38, borderRadius: 11,
        background: 'linear-gradient(135deg, #6d28d9, #9333ea)',
        color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontWeight: 800, fontSize: '1.15rem', boxShadow: 'var(--shadow-glow)',
      }}
    >
      V
    </span>
    <span style={{ fontSize: '1.3rem', fontWeight: 800, letterSpacing: '-0.8px', color: 'var(--ink)' }}>
      Vendora<span style={{ color: 'var(--primary-600)' }}>.</span>
    </span>
  </Link>
);

const Navbar = ({ categories }) => {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { ids } = useWishlist();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [catOpen, setCatOpen] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const submitSearch = (e) => {
    e.preventDefault();
    navigate(search.trim() ? `/shop?search=${encodeURIComponent(search.trim())}` : '/shop');
    setMenuOpen(false);
  };

  const dashboardPath = user?.role === 'admin' ? '/admin' : user?.role === 'seller' ? '/seller' : '/account';

  return (
    <motion.header
      initial={{ y: -70, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      style={{ position: 'sticky', top: 0, zIndex: 100, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid var(--line)' }}
    >
      <div className="container" style={{ display: 'flex', alignItems: 'center', gap: 20, height: 70 }}>
        <button className="btn-icon btn-ghost nav-menu-btn" onClick={() => setMenuOpen(true)} aria-label="Open menu">
          <FiMenu size={22} />
        </button>

        <Logo />

        <form onSubmit={submitSearch} className="nav-search-form" style={{ flex: 1, maxWidth: 560, position: 'relative' }}>
          <FiSearch style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)' }} />
          <input
            className="input"
            placeholder="Search products, brands and more…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: 40, borderRadius: 999, background: '#f4f5f9', border: '1.5px solid transparent' }}
          />
        </form>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button
            className="btn-icon btn-ghost"
            onClick={() => navigate(user ? '/account/wishlist' : '/login')}
            aria-label="Wishlist"
            style={{ position: 'relative' }}
          >
            <FiHeart size={20} />
            {user && ids.length > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 0, background: '#e11d48', color: '#fff', fontSize: '0.62rem', fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {ids.length}
              </span>
            )}
          </button>
          <button
            className="btn-icon btn-ghost"
            onClick={() => navigate(user ? '/cart' : '/login')}
            aria-label="Cart"
            style={{ position: 'relative' }}
          >
            <FiShoppingCart size={20} />
            {user && totalItems > 0 && (
              <span style={{ position: 'absolute', top: 2, right: 0, background: 'var(--primary-600)', color: '#fff', fontSize: '0.62rem', fontWeight: 700, borderRadius: 999, minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div ref={profileRef} style={{ position: 'relative' }}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                style={{ display: 'flex', alignItems: 'center', gap: 9, background: 'none', border: 'none', padding: '5px 8px', borderRadius: 12 }}
                className="card-hover"
              >
                <span style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#6d28d9,#9333ea)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                  {getInitials(user.name)}
                </span>
                <span style={{ fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {user.name.split(' ')[0]} <FiChevronDown size={14} />
                </span>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.97 }}
                    transition={{ duration: 0.16 }}
                    className="card"
                    style={{ position: 'absolute', right: 0, top: 'calc(100% + 10px)', width: 230, padding: '8px', zIndex: 110, boxShadow: 'var(--shadow-lg)' }}
                  >
                    <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--line)', marginBottom: 6 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{user.name}</div>
                      <div className="small muted">{user.email}</div>
                      <span className="badge badge-primary" style={{ marginTop: 6, textTransform: 'capitalize' }}>{user.role}</span>
                    </div>
                    {[
                      { to: dashboardPath, icon: <FiGrid size={16} />, label: 'Dashboard' },
                      { to: '/account/orders', icon: <FiPackage size={16} />, label: 'My Orders' },
                      { to: '/account/notifications', icon: <FiBell size={16} />, label: 'Notifications' },
                      { to: '/account/profile', icon: <FiSettings size={16} />, label: 'Settings' },
                    ].map((item) => (
                      <Link key={item.to} to={item.to} onClick={() => setProfileOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 500, color: 'var(--ink-2)' }}>
                        {item.icon} {item.label}
                      </Link>
                    ))}
                    <button
                      onClick={() => { logout(); setProfileOpen(false); navigate('/'); }}
                      style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 12px', borderRadius: 9, fontSize: '0.9rem', fontWeight: 500, color: 'var(--danger)', background: 'none', border: 'none', width: '100%' }}
                    >
                      <FiLogOut size={16} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="nav-auth-btns" style={{ display: 'flex', gap: 8 }}>
              <Link to="/login" className="btn btn-outline btn-sm">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </nav>
      </div>

      {/* Category bar */}
      <div className="container nav-cat-bar" id="cat-bar">
        <button
          onClick={() => setCatOpen((v) => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', fontWeight: 700, fontSize: '0.87rem', color: 'var(--ink)', padding: '6px 10px', borderRadius: 8 }}
        >
          <FiMenu size={15} /> All Categories
        </button>
        {categories.slice(0, 9).map((c) => (
          <NavLink
            key={c._id}
            to={`/shop?category=${c.slug}`}
            style={({ isActive }) => ({
              padding: '6px 12px', borderRadius: 999, fontSize: '0.85rem', fontWeight: 500,
              color: isActive ? 'var(--primary)' : 'var(--muted)', whiteSpace: 'nowrap',
            })}
          >
            {c.name}
          </NavLink>
        ))}
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', zIndex: 190 }}
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
              style={{ position: 'fixed', top: 0, left: 0, bottom: 0, width: 290, background: '#fff', zIndex: 200, padding: 22, overflowY: 'auto', boxShadow: 'var(--shadow-lg)' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <Logo />
                <button className="modal-x" onClick={() => setMenuOpen(false)}><FiX /></button>
              </div>
              <form onSubmit={submitSearch} style={{ position: 'relative', marginBottom: 20 }}>
                <FiSearch style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--muted-2)' }} />
                <input className="input" placeholder="Search…" value={search} onChange={(e) => setSearch(e.target.value)} style={{ paddingLeft: 36 }} />
              </form>
              <div className="small muted" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 10 }}>Categories</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 22 }}>
                {categories.map((c) => (
                  <Link key={c._id} to={`/shop?category=${c.slug}`} onClick={() => setMenuOpen(false)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, fontWeight: 500, fontSize: '0.92rem', color: 'var(--ink-2)' }}>
                    <FiHome size={15} /> {c.name}
                  </Link>
                ))}
              </div>
              {!user && (
                <div style={{ display: 'flex', gap: 10 }}>
                  <Link to="/login" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Login</Link>
                  <Link to="/register" className="btn btn-primary" style={{ flex: 1 }} onClick={() => setMenuOpen(false)}>Sign Up</Link>
                </div>
              )}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
