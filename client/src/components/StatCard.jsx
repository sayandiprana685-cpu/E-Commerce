import { motion } from 'framer-motion';

const StatCard = ({ icon, label, value, sub, color = 'var(--primary-600)', bg = 'var(--primary-50)', index = 0 }) => (
  <motion.div
    className="card card-hover card-pad"
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay: index * 0.06 }}
  >
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div className="muted small" style={{ fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: '1.65rem', fontWeight: 800, letterSpacing: '-0.5px', marginTop: 4, lineHeight: 1.2 }}>{value}</div>
        {sub && <div className="small muted mt-8">{sub}</div>}
      </div>
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 14,
          background: bg,
          color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20,
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
    </div>
  </motion.div>
);

export default StatCard;
