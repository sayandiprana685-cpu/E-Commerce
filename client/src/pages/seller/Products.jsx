import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FiPlus, FiEdit3, FiTrash2, FiSearch, FiPackage } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';
import { formatPrice, finalPrice } from '../../utils/format';

const Products = () => {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/seller/products', { params: { page, search } });
      setProducts(res.data.data.products || []);
      setMeta(res.data.meta || { total: 0, totalPages: 1 });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/seller/products/${id}`);
      toast('Product deleted.', 'success');
      setPage(1);
      fetchProducts();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">My Products</h1>
          <p className="page-sub">Manage inventory, pricing, and catalog visibility.</p>
        </div>
        <Link to="/seller/products/new" className="btn btn-primary">
          <FiPlus size={16} /> Add product
        </Link>
      </div>

      <div className="card card-pad mb-24">
        <div className="input-icon">
          <FiSearch size={15} />
          <input
            className="field"
            placeholder="Search products"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiPackage />}
            title="No products listed"
            description="Add your first product to start selling."
            action={<Link to="/seller/products/new" className="btn btn-primary btn-sm"><FiPlus size={14} /> Create product</Link>}
          />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 10 }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{product.name}</div>
                          <div className="small muted">SKU: {product.sku}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatPrice(finalPrice(product.price, product.discountPercentage))}</div>
                      <div className="small muted price-strike">{formatPrice(product.price)}</div>
                    </td>
                    <td>
                      <span className={`badge ${product.stock <= 5 ? 'badge-warning' : 'badge-success'}`}>
                        {product.stock} in stock
                      </span>
                    </td>
                    <td><span className="badge badge-primary">{product.status}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <Link to={`/seller/products/${product._id}/edit`} className="btn btn-secondary btn-sm">
                          <FiEdit3 size={13} /> Edit
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(product._id)} style={{ color: 'var(--danger)' }}>
                          <FiTrash2 size={13} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta.totalPages > 1 && <Pagination page={meta.page || page} totalPages={meta.totalPages} onChange={setPage} />}
        </>
      )}
    </div>
  );
};

export default Products;
