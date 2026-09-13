import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiFacebook, FiTwitter, FiInstagram, FiYoutube } from 'react-icons/fi';

const Footer = () => (
  <footer style={{ background: '#0f172a', color: '#cbd5e1', marginTop: 'auto' }}>
    <div className="container" style={{ padding: '56px 0 36px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 36 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 16 }}>
            <span style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#a855f7)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>V</span>
            <span style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>Vendora</span>
          </div>
          <p style={{ fontSize: '0.88rem', lineHeight: 1.7, opacity: 0.8 }}>
            Your premium online marketplace. Quality products from verified sellers, delivered fast with complete buyer protection.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
            {[FiFacebook, FiTwitter, FiInstagram, FiYoutube].map((Icon, i) => (
              <a key={i} href="#" aria-label="social link" style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e2e8f0' }}>
                <Icon size={16} />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Shop</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
            <Link to="/shop">All Products</Link>
            <Link to="/shop?flashSale=true">Flash Sale</Link>
            <Link to="/shop?sort=newest">New Arrivals</Link>
            <Link to="/shop?sort=popular">Best Sellers</Link>
            <Link to="/wishlist">Wishlist</Link>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Sell on Vendora</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
            <Link to="/register?role=seller">Become a Seller</Link>
            <Link to="/seller">Seller Dashboard</Link>
            <Link to="/login">Seller Login</Link>
          </div>
        </div>

        <div>
          <h4 style={{ color: '#fff', fontSize: '0.95rem', fontWeight: 700, marginBottom: 16 }}>Support</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem', opacity: 0.85 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiMail size={14} /> support@vendora.com</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiPhone size={14} /> 1800-VENDORA</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><FiMapPin size={14} /> Bengaluru, India</span>
          </div>
        </div>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', marginTop: 36, paddingTop: 22, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10, fontSize: '0.82rem', opacity: 0.65 }}>
        <span>© {new Date().getFullYear()} Vendora Commerce Pvt. Ltd. All rights reserved.</span>
        <span>Demo project — no real payments are processed.</span>
      </div>
    </div>
  </footer>
);

export default Footer;
