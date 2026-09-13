import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCompass, FiHome, FiShoppingBag } from 'react-icons/fi';

const NotFound = () => (
  <div className="container" style={{ padding: '80px 0 100px', textAlign: 'center' }}>
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
      <div
        style={{
          fontSize: '6rem',
          fontWeight: 800,
          letterSpacing: '-4px',
          background: 'linear-gradient(135deg, var(--primary-600), var(--accent))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          lineHeight: 1,
        }}
      >
        404
      </div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: 12 }}>This page wandered off</h1>
      <p className="muted" style={{ maxWidth: 420, margin: '10px auto 28px' }}>
        The page you're looking for doesn't exist or has been moved. Let's get you back on track.
      </p>
      <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary btn-lg">
          <FiHome /> Go home
        </Link>
        <Link to="/shop" className="btn btn-outline btn-lg">
          <FiShoppingBag /> Browse products
        </Link>
      </div>
      <div className="muted-2" style={{ marginTop: 40 }}>
        <FiCompass size={28} />
      </div>
    </motion.div>
  </div>
);

export default NotFound;
