import { useEffect, useState } from 'react';
import { FiSearch, FiPackage } from 'react-icons/fi';
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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await api.get('/admin/products', { params: { search, page, limit: 8 } });
        setProducts(res.data.data.products || []);
        setMeta(res.data.meta || { total: 0, totalPages: 1 });
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [page, search, toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">Review all platform products and catalog activity.</p>
        </div>
      </div>

      <div className="card card-pad mb-24">
        <div className="input-icon">
          <FiSearch size={15} />
          <input className="field" placeholder="Search products" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : products.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiPackage />} title="No products found" description="No products match the current search." />
        </div>
      ) : (
        <>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Seller</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={product.images?.[0] || '/placeholder.png'} alt={product.name} style={{ width: 44, height: 44, borderRadius: 10, objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontWeight: 700 }}>{product.name}</div>
                          <div className="small muted">{product.category?.name || 'Uncategorized'}</div>
                        </div>
                      </div>
                    </td>
                    <td>{product.seller?.sellerInfo?.shopName || product.seller?.name || '—'}</td>
                    <td>
                      <div style={{ fontWeight: 700 }}>{formatPrice(finalPrice(product.price, product.discountPercentage))}</div>
                      <div className="small muted price-strike">{formatPrice(product.price)}</div>
                    </td>
                    <td>{product.stock || 0}</td>
                    <td><span className="badge badge-primary">{product.status}</span></td>
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
