import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiSave, FiImage, FiTag, FiLayers, FiBox, FiDollarSign } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';

const initialState = {
  name: '',
  description: '',
  categoryId: '',
  brandId: '',
  price: '',
  discountPercentage: 0,
  stock: 1,
  sku: '',
  variants: [],
  specifications: [],
  tags: '',
  images: [''],
  isFeatured: false,
  isNewArrival: true,
  flashSale: { isActive: false, endsAt: '' },
};

const ProductForm = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(initialState);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [catRes, brandRes] = await Promise.all([
          api.get('/categories'),
          api.get('/brands'),
        ]);
        setCategories(catRes.data.data.categories || []);
        setBrands(brandRes.data.data.brands || []);

        if (isEdit) {
          const res = await api.get(`/products/${id}`);
          const product = res.data.data.product;
          setForm({
            name: product.name || '',
            description: product.description || '',
            categoryId: product.category?._id || '',
            brandId: product.brand?._id || '',
            price: product.price || '',
            discountPercentage: product.discountPercentage || 0,
            stock: product.stock || 0,
            sku: product.sku || '',
            variants: product.variants || [],
            specifications: product.specifications || [],
            tags: (product.tags || []).join(', '),
            images: product.images?.length ? product.images : [''],
            isFeatured: !!product.isFeatured,
            isNewArrival: product.isNewArrival !== false,
            flashSale: {
              isActive: !!product.flashSale?.isActive,
              endsAt: product.flashSale?.endsAt ? product.flashSale.endsAt.slice(0, 16) : '',
            },
          });
        }
      } catch (err) {
        toast(err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchMeta();
  }, [id, isEdit, toast]);

  const categoryOptions = useMemo(() => categories, [categories]);

  const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const addLine = (field, placeholder) => {
    setForm((prev) => ({
      ...prev,
      [field]: [...(prev[field] || []), ''],
    }));
  };

  const updateArrayItem = (field, index, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item)),
    }));
  };

  const saveProduct = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...form,
        tags: form.tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        images: (form.images || []).filter(Boolean),
        price: Number(form.price),
        discountPercentage: Number(form.discountPercentage),
        stock: Number(form.stock),
        categoryId: form.categoryId,
        brandId: form.brandId || undefined,
      };

      if (isEdit) {
        await api.put(`/seller/products/${id}`, payload);
        toast('Product updated.', 'success');
      } else {
        await api.post('/seller/products', payload);
        toast('Product created.', 'success');
      }

      navigate('/seller/products');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="card card-pad">Loading product form…</div>;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">{isEdit ? 'Edit Product' : 'Add Product'}</h1>
          <p className="page-sub">Create or update your catalog listing with pricing, inventory, and media details.</p>
        </div>
      </div>

      <form onSubmit={saveProduct} className="card card-pad">
        <div className="grid grid-2">
          <div className="field">
            <label className="label">Product name</label>
            <input className="field" required value={form.name} onChange={(e) => updateField('name', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">SKU</label>
            <input className="field" value={form.sku} onChange={(e) => updateField('sku', e.target.value)} placeholder="Optional" />
          </div>
        </div>

        <div className="field mt-16">
          <label className="label">Description</label>
          <textarea className="textarea" required value={form.description} onChange={(e) => updateField('description', e.target.value)} rows={4} />
        </div>

        <div className="grid grid-3 mt-16">
          <div className="field">
            <label className="label">Category</label>
            <select className="field" required value={form.categoryId} onChange={(e) => updateField('categoryId', e.target.value)}>
              <option value="">Select category</option>
              {categoryOptions.map((category) => (
                <option key={category._id} value={category._id}>{category.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Brand</label>
            <select className="field" value={form.brandId} onChange={(e) => updateField('brandId', e.target.value)}>
              <option value="">No brand</option>
              {brands.map((brand) => (
                <option key={brand._id} value={brand._id}>{brand.name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="label">Tags</label>
            <input className="field" value={form.tags} onChange={(e) => updateField('tags', e.target.value)} placeholder="comma-separated tags" />
          </div>
        </div>

        <div className="grid grid-3 mt-16">
          <div className="field">
            <label className="label">Price</label>
            <input className="field" type="number" min="0" required value={form.price} onChange={(e) => updateField('price', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Discount %</label>
            <input className="field" type="number" min="0" max="90" value={form.discountPercentage} onChange={(e) => updateField('discountPercentage', e.target.value)} />
          </div>
          <div className="field">
            <label className="label">Stock</label>
            <input className="field" type="number" min="0" required value={form.stock} onChange={(e) => updateField('stock', e.target.value)} />
          </div>
        </div>

        <div className="mt-24">
          <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Images</h3>
          {form.images.map((img, idx) => (
            <div key={idx} style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <input
                className="field"
                value={img}
                onChange={(e) => updateArrayItem('images', idx, e.target.value)}
                placeholder="Image URL"
              />
              {idx === form.images.length - 1 && (
                <button type="button" className="btn btn-secondary" onClick={() => addLine('images', 'Image URL')}>
                  <FiImage size={14} /> Add
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-24">
          <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Product highlights</h3>
          <div className="grid grid-2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <input type="checkbox" checked={form.isFeatured} onChange={(e) => updateField('isFeatured', e.target.checked)} />
              Featured product
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <input type="checkbox" checked={form.isNewArrival} onChange={(e) => updateField('isNewArrival', e.target.checked)} />
              New arrival
            </label>
          </div>
        </div>

        <div className="mt-24">
          <h3 style={{ fontWeight: 800, marginBottom: 12 }}>Flash sale</h3>
          <div className="grid grid-2">
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
              <input
                type="checkbox"
                checked={form.flashSale?.isActive || false}
                onChange={(e) =>
                  updateField('flashSale', {
                    ...form.flashSale,
                    isActive: e.target.checked,
                  })
                }
              />
              Enable flash sale
            </label>
            <div className="field">
              <label className="label">Ends at</label>
              <input
                className="field"
                type="datetime-local"
                value={form.flashSale?.endsAt || ''}
                onChange={(e) =>
                  updateField('flashSale', {
                    ...form.flashSale,
                    endsAt: e.target.value,
                  })
                }
              />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 26 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/seller/products')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" /> : <FiSave size={15} />} {isEdit ? 'Save changes' : 'Create product'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductForm;
