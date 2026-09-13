import { FiStar } from 'react-icons/fi';

export const Stars = ({ value = 0, size = 14 }) => (
  <span style={{ display: 'inline-flex', gap: 2 }}>
    {[1, 2, 3, 4, 5].map((i) => (
      <FiStar
        key={i}
        size={size}
        style={{
          color: i <= Math.round(value) ? '#f59e0b' : '#d7dce5',
          fill: i <= Math.round(value) ? '#f59e0b' : 'transparent',
        }}
      />
    ))}
  </span>
);

const Rating = ({ value = 0, count }) => (
  <span className="flex-center gap-8" style={{ gap: 8 }}>
    <span className="rating-badge">
      {Number(value).toFixed(1)} <FiStar size={11} fill="#fff" />
    </span>
    {count !== undefined && <span className="small muted">({count})</span>}
  </span>
);

export default Rating;
