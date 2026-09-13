import { useEffect, useState } from 'react';
import { FiSearch, FiTag } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';

const Brands = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchBrands = async () => {
      try {
        const res = await api.get('/brands');
        setBrands(res.data.data.brands || []);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchBrands();
  }, [toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Brands</h1>
          <p className="page-sub">Track the brands currently available on the platform.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : brands.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiTag />} title="No brands found" description="Brands will appear here once they are added to the catalog." />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Featured</th>
              </tr>
            </thead>
            <tbody>
              {brands.map((brand) => (
                <tr key={brand._id}>
                  <td>{brand.name}</td>
                  <td>{brand.slug}</td>
                  <td><span className={`badge ${brand.isFeatured ? 'badge-success' : 'badge-gray'}`}>{brand.isFeatured ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Brands;
