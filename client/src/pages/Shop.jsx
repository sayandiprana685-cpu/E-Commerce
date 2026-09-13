import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiSliders, FiX, FiSearch } from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { GridSkeleton } from '../components/Skeletons';
import { useToast } from '../context/ToastContext';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'popular', label: 'Most popular' },
  { value: 'rating', label: 'Top rated' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
];

const RATING_OPTIONS = [4, 3, 2, 1];
const PRICE_PRESETS = [
  { label: 'Under ₹1,000', min: '', max: '1000' },
  { label: '₹1,000 – ₹5,000', min: '1000', max: '5000' },
  { label: '₹5,000 – ₹20,000', min: '5000', max: '20000' },
  { label: '₹20,000 – ₹50,000', min: '20000', max: '50000' },
  { label: 'Above ₹50,000', min: '50000', max: '' },
];

const Shop = () => {
  const [params, setParams] = useSearchParams();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const search = params.get('search') || '';
  const category = params.get('category') || '';
  const brand = params.get('brand') || '';
  const minPrice = params.get('minPrice') || '';
  const maxPrice = params.get('maxPrice') || '';
  const rating = params.get('rating') || '';
  const sort = params.get('sort') || 'newest';
  const page = parseInt(params.get('page')) || 1;

  const setParam = (key, value, resetPage = true) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (resetPage && key !== 'page') next.delete('page');
    setParams(next);
  };

  const [priceDraft, setPriceDraft] = useState({ min: minPrice, max: maxPrice });
  useEffect(() => {
    setPriceDraft({ min: params.get('minPrice') || '', max: params.get('maxPrice') || '' });
  }, [minPrice, maxPrice]);

  useEffect(() => {
    setLoading(true);
    setError('');
    const query = Object.fromEntries([...params.entries()]);
    api
      .get('/products', { params: query })
      .then((res) => setData(res.data))
      .catch((err) => {
        setError(err.message);
        toast(err.message, 'error');
      })
      .finally(() => setLoading(false));
  }, [params]);

  const activeFilters = useMemo(() => {
    const chips = [];
    if (search) chips.push({ label: `"${search}"`, clear: () => setParam('search', '') });
    if (category)
      chips.push({
        label: data?.data?.categories?.find((c) => c.slug === category)?.name || category,
        clear: () => setParam('category', ''),
      });
    if (brand)
      chips.push({
        label: data?.data?.brands?.find((b) => b.slug === brand)?.name || brand,
        clear: () => setParam('brand', ''),
      });
    if (minPrice || maxPrice)
      chips.push({ label: `${minPrice ? `₹${minPrice}` : '₹0'} – ${maxPrice ? `₹${maxPrice}` : '∞'}`, clear: () => { setParam('minPrice', ''); setParam('maxPrice', ''); } });
    if (rating) chips.push({ label: `${rating}★ & above`, clear: () => setParam('rating', '') });
    return chips;
  }, [search, category, brand, minPrice, maxPrice, rating, data]);

  const clearAll = () => setParams(search ? { search } : {});

  const FilterPanel = () => (
    <aside className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 22 }}>
      <div>
        <h4 className="sidebar-head">Category</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className={`filter-link ${!category ? 'active' : ''}`} onClick={() => setParam('category', '')}>
            All categories
          </button>
          {data?.data?.categories?.map((c) => (
            <button
              key={c._id}
              className={`filter-link ${category === c.slug ? 'active' : ''}`}
              onClick={() => setParam('category', category === c.slug ? '' : c.slug)}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="sidebar-head">Brand</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <button className={`filter-link ${!brand ? 'active' : ''}`} onClick={() => setParam('brand', '')}>
            All brands
          </button>
          {data?.data?.brands?.map((b) => (
            <button
              key={b._id}
              className={`filter-link ${brand === b.slug ? 'active' : ''}`}
              onClick={() => setParam('brand', brand === b.slug ? '' : b.slug)}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="sidebar-head">Price range</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
          {PRICE_PRESETS.map((p) => {
            const isActive = minPrice === p.min && maxPrice === p.max;
            return (
              <button
                key={p.label}
                className={`filter-link ${isActive ? 'active' : ''}`}
                onClick={() =>
                  isActive ? (setParam('minPrice', ''), setParam('maxPrice', '')) : (setParam('minPrice', p.min), setParam('maxPrice', p.max))
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input
            className="field"
            type="number"
            placeholder="Min"
            value={priceDraft.min}
            onChange={(e) => setPriceDraft((d) => ({ ...d, min: e.target.value }))}
          />
          <span className="muted">–</span>
          <input
            className="field"
            type="number"
            placeholder="Max"
            value={priceDraft.max}
            onChange={(e) => setPriceDraft((d) => ({ ...d, max: e.target.value }))}
          />
        </div>
        <button
          className="btn btn-secondary btn-sm btn-block mt-8"
          onClick={() => {
            setParam('minPrice', priceDraft.min);
            setParam('maxPrice', priceDraft.max);
          }}
        >
          Apply price
        </button>
      </div>

      <div>
        <h4 className="sidebar-head">Customer rating</h4>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {RATING_OPTIONS.map((r) => (
            <button
              key={r}
              className={`chip ${rating === String(r) ? 'active' : ''}`}
              onClick={() => setParam('rating', rating === String(r) ? '' : String(r))}
            >
              {r}★ & up
            </button>
          ))}
        </div>
      </div>
    </aside>
  );

  return (
    <div className="container" style={{ padding: '26px 0 80px' }}>
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>
          {search ? `Results for "${search}"` : category ? data?.data?.categories?.find((c) => c.slug === category)?.name || 'Shop' : 'All Products'}
        </h1>
        <p className="muted small" style={{ marginTop: 6 }}>
          {loading ? 'Loading products…' : `${data?.meta?.total || 0} products found`}
        </p>
      </div>

      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 18 }}>
          {activeFilters.map((f) => (
            <span key={f.label} className="chip active" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {f.label}
              <FiX size={13} style={{ cursor: 'pointer' }} onClick={f.clear} />
            </span>
          ))}
          <button className="btn btn-ghost btn-sm" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      <div className="shop-layout">
        <div className="shop-filters">
          <FilterPanel />
        </div>

        <div>
          <div
            className="card"
            style={{
              padding: '12px 16px',
              marginBottom: 18,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              justifyContent: 'space-between',
              flexWrap: 'wrap',
            }}
          >
            <button className="btn btn-outline btn-sm shop-filter-toggle" onClick={() => setShowFilters(true)}>
              <FiSliders size={14} /> Filters
            </button>
            <span className="small muted" style={{ fontWeight: 600 }}>
              {data?.meta ? `Page ${data.meta.page} of ${data.meta.totalPages}` : ''}
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FiSearch className="muted" size={15} />
              <select className="field" style={{ padding: '8px 10px', width: 'auto' }} value={sort} onChange={(e) => setParam('sort', e.target.value)}>
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loading ? (
            <GridSkeleton count={8} />
          ) : error ? (
            <EmptyState
              icon={<FiSearch />}
              title="Could not load products"
              description={error}
              action={<button className="btn btn-primary" onClick={() => setParams(new URLSearchParams(params))}>Retry</button>}
            />
          ) : data?.data?.products?.length ? (
            <motion.div key={`${page}-${category}-${brand}-${sort}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3 }}>
              <div className="grid grid-3">
                {data.data.products.map((p, i) => (
                  <ProductCard key={p._id} product={p} index={i} />
                ))}
              </div>
            </motion.div>
          ) : (
            <EmptyState
              icon={<FiSearch />}
              title="No products found"
              description="Try adjusting your filters or search for something else."
              action={<button className="btn btn-primary" onClick={clearAll}>Clear filters</button>}
            />
          )}

          <div style={{ marginTop: 28 }}>
            <Pagination
              page={data?.meta?.page || 1}
              totalPages={data?.meta?.totalPages || 1}
              onChange={(p) => setParam('page', String(p), false)}
            />
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <motion.div
            className="modal-box"
            style={{ width: 'min(360px, 88vw)', maxHeight: '85vh', overflowY: 'auto' }}
            initial={{ x: -60, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-head">
              <h3>Filters</h3>
              <button className="modal-x" onClick={() => setShowFilters(false)}>
                <FiX />
              </button>
            </div>
            <div className="modal-body">
              <FilterPanel />
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Shop;
