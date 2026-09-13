import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiZap, FiTruck, FiShield, FiRefreshCw, FiHeadphones, FiMail, FiStar } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import { GridSkeleton } from '../components/Skeletons';
import { formatPrice, finalPrice } from '../utils/format';
import { useToast } from '../context/ToastContext';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
};

const ProductRail = ({ title, icon, products, link, accent }) => (
  <section className="container mt-32">
    <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="section-head">
      <h2 className="section-title">
        <span className="title-bar" /> {icon} {title}
      </h2>
      <Link to={link} className="btn btn-ghost btn-sm">
        View all <FiArrowRight />
      </Link>
    </motion.div>
    <div className="grid grid-4">
      {products.slice(0, 4).map((p, i) => (
        <ProductCard key={p._id} product={p} index={i} />
      ))}
    </div>
  </section>
);

const Countdown = ({ endsAt }) => {
  const [left, setLeft] = useState(Math.max(0, new Date(endsAt) - Date.now()));
  useEffect(() => {
    const t = setInterval(() => setLeft(Math.max(0, new Date(endsAt) - Date.now())), 1000);
    return () => clearInterval(t);
  }, [endsAt]);
  const h = Math.floor(left / 3600000);
  const m = Math.floor((left % 3600000) / 60000);
  const s = Math.floor((left % 60000) / 1000);
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {[
        [h, 'HRS'],
        [m, 'MIN'],
        [s, 'SEC'],
      ].map(([v, l]) => (
        <div key={l} style={{ background: '#0f172a', color: '#fff', borderRadius: 10, padding: '6px 10px', textAlign: 'center', minWidth: 52 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', fontVariantNumeric: 'tabular-nums' }}>{String(v).padStart(2, '0')}</div>
          <div style={{ fontSize: '0.58rem', letterSpacing: '1px', opacity: 0.7 }}>{l}</div>
        </div>
      ))}
    </div>
  );
};

const Home = () => {
  const [sections, setSections] = useState(null);
  const [email, setEmail] = useState('');
  const toast = useToast();

  useEffect(() => {
    api
      .get('/products/home')
      .then((res) => setSections(res.data.data))
      .catch(() => toast('Could not load homepage data.', 'error'));
  }, []);

  if (!sections) {
    return (
      <div className="container" style={{ padding: '40px 0 80px' }}>
        <div className="skeleton" style={{ height: 340, borderRadius: 20 }} />
        <div className="mt-32"><GridSkeleton count={8} /></div>
      </div>
    );
  }

  const flashEndsAt = sections.flashSale[0]?.flashSale?.endsAt;

  return (
    <div style={{ paddingBottom: 70 }}>
      {/* Hero */}
      <section className="container" style={{ paddingTop: 26 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{
            borderRadius: 22,
            background: 'linear-gradient(115deg, #2e1065 0%, #5b21b6 45%, #7c3aed 100%)',
            color: '#fff',
            padding: 'clamp(36px, 6vw, 68px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ position: 'absolute', width: 460, height: 460, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -160, right: -120 }} />
          <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -90, left: '32%' }} />
          <div style={{ position: 'relative', maxWidth: 560 }}>
            <span className="badge" style={{ background: 'rgba(255,255,255,0.16)', color: '#fff', marginBottom: 16 }}>
              <FiZap size={12} /> MEGA LAUNCH SALE — UP TO 40% OFF
            </span>
            <h1 style={{ fontSize: 'clamp(1.9rem, 4.5vw, 3.2rem)', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-1px', marginBottom: 14 }}>
              Shop the future of <span style={{ color: '#fbbf24' }}>online retail</span>
            </h1>
            <p style={{ opacity: 0.85, fontSize: '1.05rem', marginBottom: 26, maxWidth: 460 }}>
              Electronics, fashion, home essentials and more — from verified sellers with fast delivery and complete buyer protection.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn btn-lg" style={{ background: '#fff', color: 'var(--primary-700)' }}>
                Start Shopping <FiArrowRight />
              </Link>
              <Link to="/register?role=seller" className="btn btn-lg" style={{ background: 'rgba(255,255,255,0.14)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)' }}>
                Become a Seller
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Trust strip */}
      <section className="container mt-24">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="grid grid-4" style={{ gap: 14 }}>
          {[
            { icon: <FiTruck />, title: 'Free Shipping', sub: 'On orders over ₹499' },
            { icon: <FiShield />, title: 'Secure Payments', sub: '100% protected checkout' },
            { icon: <FiRefreshCw />, title: 'Easy Returns', sub: '7-day return policy' },
            { icon: <FiHeadphones />, title: '24/7 Support', sub: 'We are always here' },
          ].map((f) => (
            <div key={f.title} className="card card-pad" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: 18 }}>
              <span style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, flexShrink: 0 }}>
                {f.icon}
              </span>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{f.title}</div>
                <div className="small muted">{f.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Featured categories */}
      <section className="container mt-32">
        <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="section-head">
          <h2 className="section-title"><span className="title-bar" /> Featured Categories</h2>
          <Link to="/shop" className="btn btn-ghost btn-sm">All categories <FiArrowRight /></Link>
        </motion.div>
        <div className="grid grid-4" style={{ gap: 14 }}>
          {sections.categories.map((c, i) => (
            <motion.div key={c._id} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.04 }}>
              <Link to={`/shop?category=${c.slug}`} className="card card-hover" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16 }}>
                <img src={c.image} alt={c.name} style={{ width: 54, height: 54, borderRadius: 13, objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{c.name}</div>
                  <div className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    Explore <FiArrowRight size={12} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Flash sale */}
      {sections.flashSale.length > 0 && (
        <section className="container mt-32">
          <motion.div
            {...fadeUp}
            transition={{ duration: 0.4 }}
            className="card"
            style={{ padding: 26, background: 'linear-gradient(120deg, #fff7ed, #fffbeb)', border: '1px solid #fed7aa' }}
          >
            <div className="section-head" style={{ marginBottom: 18 }}>
              <h2 className="section-title" style={{ color: '#c2410c' }}>
                <FiZap style={{ color: '#f59e0b', fill: '#fbbf24' }} /> Flash Sale
              </h2>
              {flashEndsAt && <Countdown endsAt={flashEndsAt} />}
            </div>
            <div className="grid grid-4">
              {sections.flashSale.slice(0, 4).map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </motion.div>
        </section>
      )}

      {/* Trending */}
      {sections.trending.length > 0 && (
        <ProductRail title="Trending Now" icon={<FiStar style={{ color: '#f59e0b', fill: '#fbbf24' }} />} products={sections.trending} link="/shop?sort=rating" />
      )}

      {/* Promotional banner */}
      <section className="container mt-32">
        <motion.div {...fadeUp} transition={{ duration: 0.45 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 18 }}>
          <div style={{ borderRadius: 18, padding: 30, background: 'linear-gradient(120deg, #0f172a, #1e293b)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, top: -30, width: 170, height: 170, borderRadius: '50%', background: 'rgba(124,58,237,0.35)' }} />
            <div style={{ position: 'relative' }}>
              <span className="badge badge-warning">COUPON</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '12px 0 8px' }}>Flat ₹200 OFF</h3>
              <p style={{ opacity: 0.75, fontSize: '0.92rem' }}>On orders above ₹1,499. Use code <b style={{ color: '#fbbf24' }}>FLAT200</b> at checkout.</p>
              <Link to="/shop" className="btn btn-sm mt-16" style={{ background: '#fff', color: '#0f172a' }}>Shop Now <FiArrowRight /></Link>
            </div>
          </div>
          <div style={{ borderRadius: 18, padding: 30, background: 'linear-gradient(120deg, #052e2b, #064e3b)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -30, bottom: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(16,185,129,0.3)' }} />
            <div style={{ position: 'relative' }}>
              <span className="badge badge-success">NEW ARRIVALS</span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, margin: '12px 0 8px' }}>Fresh drops every week</h3>
              <p style={{ opacity: 0.75, fontSize: '0.92rem' }}>Be the first to shop the latest products across every category.</p>
              <Link to="/shop?sort=newest" className="btn btn-sm mt-16" style={{ background: '#fff', color: '#064e3b' }}>Explore <FiArrowRight /></Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Best sellers */}
      {sections.bestSellers.length > 0 && (
        <ProductRail title="Best Sellers" icon={<FiZap style={{ color: 'var(--accent)' }} />} products={sections.bestSellers} link="/shop?sort=popular" />
      )}

      {/* New arrivals */}
      {sections.newArrivals.length > 0 && (
        <ProductRail title="New Arrivals" icon={<FiArrowRight style={{ color: 'var(--info)' }} />} products={sections.newArrivals} link="/shop?sort=newest" />
      )}

      {/* Top brands */}
      {sections.brands.length > 0 && (
        <section className="container mt-32">
          <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="section-head">
            <h2 className="section-title"><span className="title-bar" /> Top Brands</h2>
          </motion.div>
          <div className="grid grid-4" style={{ gap: 14 }}>
            {sections.brands.map((b, i) => (
              <motion.div key={b._id} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.04 }}>
                <Link to={`/shop?brand=${b.slug}`} className="card card-hover" style={{ padding: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <img src={b.logo} alt={b.name} style={{ width: 46, height: 46, borderRadius: 12, objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontWeight: 700 }}>{b.name}</div>
                    <div className="small muted">Shop collection</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Customer reviews */}
      {sections.topReviews.length > 0 && (
        <section className="container mt-32">
          <motion.div {...fadeUp} transition={{ duration: 0.4 }} className="section-head">
            <h2 className="section-title"><span className="title-bar" /> What Customers Say</h2>
          </motion.div>
          <div className="grid grid-3">
            {sections.topReviews.slice(0, 6).map((r, i) => (
              <motion.div key={r._id} {...fadeUp} transition={{ duration: 0.3, delay: i * 0.05 }} className="card card-pad">
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  {Array.from({ length: 5 }).map((_, j) => (
                    <FiStar key={j} size={15} style={{ color: j < r.rating ? '#f59e0b' : '#d7dce5', fill: j < r.rating ? '#f59e0b' : 'transparent' }} />
                  ))}
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.65, color: 'var(--ink-2)', marginBottom: 14 }}>"{r.comment}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--primary-50)', color: 'var(--primary-600)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem' }}>
                    {(r.user?.name || 'A')[0]}
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>{r.user?.name}</div>
                    <div className="small muted">{r.product?.name?.slice(0, 30)}…</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Newsletter */}
      <section className="container mt-32">
        <motion.div
          {...fadeUp}
          transition={{ duration: 0.45 }}
          style={{
            borderRadius: 20,
            background: 'linear-gradient(115deg, #f5f3ff, #ede9fe)',
            border: '1px solid var(--primary-100)',
            padding: 'clamp(30px, 5vw, 52px)',
            textAlign: 'center',
          }}
        >
          <span style={{ width: 56, height: 56, borderRadius: 18, background: 'var(--primary-600)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16, boxShadow: 'var(--shadow-glow)' }}>
            <FiMail />
          </span>
          <h2 style={{ fontSize: '1.55rem', fontWeight: 800, letterSpacing: '-0.5px' }}>Get exclusive deals in your inbox</h2>
          <p className="muted" style={{ margin: '8px auto 22px', maxWidth: 440 }}>
            Subscribe for flash sale alerts, new arrivals and members-only coupons.
          </p>
          <form
            onSubmit={(e) => { e.preventDefault(); toast('Subscribed! Welcome to the Vendora family.', 'success'); setEmail(''); }}
            style={{ display: 'flex', gap: 10, maxWidth: 440, margin: '0 auto', flexDirection: 'row' }}
            className="newsletter-form"
          >
            <input
              className="input"
              type="email"
              required
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ borderRadius: 999 }}
            />
            <button className="btn btn-primary" style={{ borderRadius: 999, paddingLeft: 24, paddingRight: 24 }}>Subscribe</button>
          </form>
        </motion.div>
      </section>
    </div>
  );
};

export default Home;
