export const ProductCardSkeleton = () => (
  <div className="card" style={{ overflow: 'hidden' }}>
    <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 0 }} />
    <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="skeleton" style={{ height: 11, width: '40%' }} />
      <div className="skeleton" style={{ height: 15, width: '90%' }} />
      <div className="skeleton" style={{ height: 11, width: '55%' }} />
      <div className="skeleton" style={{ height: 17, width: '45%' }} />
      <div className="skeleton" style={{ height: 34, width: '100%', borderRadius: 10 }} />
    </div>
  </div>
);

export const GridSkeleton = ({ count = 8 }) => (
  <div className="grid grid-4">
    {Array.from({ length: count }).map((_, i) => (
      <ProductCardSkeleton key={i} />
    ))}
  </div>
);

export const RowSkeleton = ({ rows = 5 }) => (
  <div className="card card-pad" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton" style={{ height: 46 }} />
    ))}
  </div>
);

export const StatCardSkeleton = () => (
  <div className="grid grid-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="card card-pad">
        <div className="skeleton" style={{ height: 38, width: 38, borderRadius: 12 }} />
        <div className="skeleton mt-16" style={{ height: 13, width: '60%' }} />
        <div className="skeleton mt-8" style={{ height: 26, width: '40%' }} />
      </div>
    ))}
  </div>
);

export const DetailSkeleton = () => (
  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, padding: '40px 0' }}>
    <div className="skeleton" style={{ aspectRatio: '1', borderRadius: 18 }} />
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="skeleton" style={{ height: 14, width: '30%' }} />
      <div className="skeleton" style={{ height: 30, width: '85%' }} />
      <div className="skeleton" style={{ height: 14, width: '40%' }} />
      <div className="skeleton" style={{ height: 26, width: '35%' }} />
      <div className="skeleton" style={{ height: 90 }} />
      <div className="skeleton" style={{ height: 46, borderRadius: 12 }} />
    </div>
  </div>
);

export const Spinner = ({ label = 'Loading…' }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, padding: '60px 0' }}>
    <div
      style={{
        width: 40,
        height: 40,
        border: '4px solid var(--primary-100)',
        borderTopColor: 'var(--primary-600)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    />
    <span className="muted small">{label}</span>
  </div>
);
