import { useEffect, useState } from 'react';
import { FiSearch, FiFolder } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';

const Categories = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await api.get('/categories');
        setCategories(res.data.data.categories || []);
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, [toast]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-sub">Review and manage storefront category structure.</p>
        </div>
      </div>

      {loading ? (
        <RowSkeleton rows={5} />
      ) : categories.length === 0 ? (
        <div className="card">
          <EmptyState icon={<FiFolder />} title="No categories" description="Categories will appear here once they are created." />
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
              {categories.map((category) => (
                <tr key={category._id}>
                  <td>{category.name}</td>
                  <td>{category.slug}</td>
                  <td><span className={`badge ${category.isFeatured ? 'badge-success' : 'badge-gray'}`}>{category.isFeatured ? 'Yes' : 'No'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Categories;
