import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiHeart,
  FiShoppingCart,
  FiZap,
  FiTruck,
  FiShield,
  FiRefreshCw,
  FiCheckCircle,
  FiChevronRight,
  FiMinus,
  FiPlus,
} from 'react-icons/fi';
import api from '../services/api';
import ProductCard from '../components/ProductCard';
import Rating, { Stars } from '../components/Rating';
import EmptyState from '../components/EmptyState';
import { DetailSkeleton } from '../components/Skeletons';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { formatPrice, finalPrice, formatDate, getInitials } from '../utils/format';

const TABS = ['description', 'specifications', 'reviews'];

const ProductDetail = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { toggle, inWishlist } = useWishlist();
  const toast = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [variantSelection, setVariantSelection] = useState({});
  const [tab, setTab] = useState('description');
  const [adding, setAdding] = useState(false);

  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setLoading(true);
    setNotFound(false);
    setActiveImage(0);
    setQuantity(1);
    setVariantSelection({});
    setTab('description');
    api
      .get(`/products/${slug}`)
      .then((res) => setData(res.data.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const product = data?.product;

  const unitPrice = useMemo(() => {
    if (!product) return 0;
    const base = finalPrice(product.price, product.discountPercentage);
    const delta = (product.variants || []).reduce((sum, v) => {
      const selected = v.options.find((o) => o.value === variantSelection[v.name]);
      return sum + (selected?.priceDelta || 0);
    }, 0);
    return Math.max(0, base + delta);
  }, [product, variantSelection]);

  if (loading) {
    return (
      <div className="container" style={{ padding: '30px 0 80px' }}>
        <DetailSkeleton />
      </div>
    );
  }

  if (notFound || !product) {
    return (
      <div className="container" style={{ padding: '60px 0 80px' }}>
        <EmptyState
          title="Product not found"
          description="This product may have been removed or the link is incorrect."
          action={<Link to="/shop" className="btn btn-primary">Browse products</Link>}
        />
      </div>
    );
  }

  const outOfStock = product.stock < 1;
  const wished = inWishlist(product._id);
  const flashActive = product.flashSale?.isActive && new Date(product.flashSale.endsAt) > new Date();
  const alreadyReviewed = data.reviews.some((r) => user && r.user?._id === user._id);

  const requiredVariants = product.variants || [];
  const allVariantsChosen = requiredVariants.every((v) => variantSelection[v.name]);

  const doAddToCart = async () => {
    if (!user) return toast('Please log in to add items to your cart.', 'warning');
    if (!allVariantsChosen && requiredVariants.length)
      return toast(`Please select: ${requiredVariants.filter((v) => !variantSelection[v.name]).map((v) => v.name).join(', ')}.`, 'warning');
    if (outOfStock) return toast('This product is out of stock.', 'warning');
    setAdding(true);
    try {
      await addToCart(product._id, quantity, variantSelection);
      toast('Added to cart.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setAdding(false);
    }
  };

  const buyNow = async () => {
    if (!user) return navigate('/login');
    if (!allVariantsChosen && requiredVariants.length)
      return toast('Please select all product options first.', 'warning');
    if (outOfStock) return toast('This product is out of stock.', 'warning');
    try {
      await addToCart(product._id, quantity, variantSelection);
      navigate('/checkout');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const handleWishlist = async () => {
    if (!user) return toast('Please log in to use your wishlist.', 'warning');
    try {
      const res = await toggle(product._id);
      toast(res.message, res.data?.inWishlist ? 'success' : 'info');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const submitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) return toast('Please write a few words about the product.', 'warning');
    setSubmittingReview(true);
    try {
      const res = await api.post('/reviews', { productId: product._id, ...reviewForm });
      setData((d) => ({ ...d, reviews: [res.data.data.review, ...d.reviews] }));
      setReviewForm({ rating: 5, title: '', comment: '' });
      toast('Review submitted. Thank you!', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="container" style={{ padding: '22px 0 80px' }}>
      {/* Breadcrumb */}
      <nav className="small muted" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 20 }}>
        <Link to="/">Home</Link> <FiChevronRight size={12} />
        <Link to="/shop">Shop</Link> <FiChevronRight size={12} />
        {product.category && (
          <>
            <Link to={`/shop?category=${product.category.slug}`}>{product.category.name}</Link>
            <FiChevronRight size={12} />
          </>
        )}
        <span className="muted" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 260 }}>
          {product.name}
        </span>
      </nav>

      <div className="pd-layout">
        {/* Gallery */}
        <div>
          <motion.div
            key={activeImage}
            initial={{ opacity: 0.4, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="card"
            style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 18, background: '#f4f5f9', position: 'relative' }}
          >
            <img src={product.images?.[activeImage] || product.images?.[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            {product.discountPercentage > 0 && (
              <span className="discount-badge" style={{ position: 'absolute', top: 14, left: 14, fontSize: '0.85rem', padding: '4px 12px' }}>
                -{product.discountPercentage}% OFF
              </span>
            )}
          </motion.div>
          {product.images?.length > 1 && (
            <div style={{ display: 'flex', gap: 10, marginTop: 12, overflowX: 'auto', paddingBottom: 4 }}>
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`pd-thumb ${i === activeImage ? 'active' : ''}`}
                  style={{
                    width: 72,
                    height: 72,
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: i === activeImage ? '2px solid var(--primary-600)' : '2px solid var(--line)',
                    background: '#f4f5f9',
                    flexShrink: 0,
                    cursor: 'pointer',
                  }}
                >
                  <img src={img} alt={`View ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            {product.brand?.name && (
              <Link to={`/shop?brand=${product.brand.slug}`} className="small" style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.8px', color: 'var(--primary)' }}>
                {product.brand.name}
              </Link>
            )}
            <h1 style={{ fontSize: 'clamp(1.3rem, 2.6vw, 1.8rem)', fontWeight: 800, lineHeight: 1.25, marginTop: 4 }}>
              {product.name}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 10, flexWrap: 'wrap' }}>
              <Rating value={product.ratingsAverage} count={product.ratingsQuantity} />
              <span className="small muted">|</span>
              <span className="small muted">{product.soldCount} sold</span>
              <span className="small muted">|</span>
              <span className={`badge ${outOfStock ? 'badge-danger' : 'badge-success'}`}>
                {outOfStock ? 'Out of stock' : product.stock <= 5 ? `Only ${product.stock} left` : 'In stock'}
              </span>
            </div>
          </div>

          <div className="card" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {flashActive && (
              <span className="badge badge-danger" style={{ alignSelf: 'flex-start', marginBottom: 4 }}>
                <FiZap size={12} /> Flash sale ends {formatDate(product.flashSale.endsAt)}
              </span>
            )}
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--ink)' }}>{formatPrice(unitPrice)}</span>
              {product.discountPercentage > 0 && (
                <>
                  <span className="price-strike" style={{ fontSize: '1.05rem' }}>{formatPrice(product.price)}</span>
                  <span className="discount-badge">Save {formatPrice(product.price - finalPrice(product.price, product.discountPercentage))}</span>
                </>
              )}
            </div>
            <span className="small muted">Inclusive of all taxes • Free delivery on orders above ₹499</span>
          </div>

          {/* Variants */}
          {requiredVariants.map((v) => (
            <div key={v.name}>
              <span className="small" style={{ fontWeight: 700 }}>
                {v.name}: <span className="muted">{variantSelection[v.name] || 'Select an option'}</span>
              </span>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
                {v.options.map((o) => (
                  <button
                    key={o.value}
                    className={`chip ${variantSelection[v.name] === o.value ? 'active' : ''}`}
                    onClick={() => setVariantSelection((s) => ({ ...s, [v.name]: o.value }))}
                  >
                    {o.value}
                    {o.priceDelta ? ` (+${formatPrice(o.priceDelta)})` : ''}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity + actions */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="qty-stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} disabled={quantity <= 1} aria-label="Decrease quantity">
                <FiMinus size={14} />
              </button>
              <span style={{ fontWeight: 700, minWidth: 32, textAlign: 'center' }}>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} disabled={quantity >= product.stock} aria-label="Increase quantity">
                <FiPlus size={14} />
              </button>
            </div>
            <button className="btn btn-primary btn-lg" onClick={doAddToCart} disabled={adding || outOfStock} style={{ flex: 1, minWidth: 170 }}>
              <FiShoppingCart /> {adding ? 'Adding…' : 'Add to Cart'}
            </button>
            <button className="btn btn-lg" onClick={buyNow} disabled={outOfStock} style={{ flex: 1, minWidth: 150, background: '#0f172a', color: '#fff' }}>
              <FiZap /> Buy Now
            </button>
            <motion.button whileTap={{ scale: 0.85 }} className="btn-icon" onClick={handleWishlist} aria-label="Wishlist" style={{ width: 48, height: 48, color: wished ? '#e11d48' : 'var(--muted)', border: '1px solid var(--line)' }}>
              <FiHeart fill={wished ? '#e11d48' : 'transparent'} size={20} />
            </motion.button>
          </div>

          {/* Seller & perks */}
          <div className="grid grid-2" style={{ gap: 12 }}>
            {[
              { icon: <FiTruck />, title: 'Fast delivery', text: '2–5 business days across India' },
              { icon: <FiRefreshCw />, title: '7-day returns', text: 'Easy returns after delivery' },
              { icon: <FiShield />, title: 'Buyer protection', text: 'Secure payments via Vendora' },
              { icon: <FiCheckCircle />, title: 'Verified seller', text: product.seller?.sellerInfo?.shopName || 'Vendora partner' },
            ].map((p) => (
              <div key={p.title} className="card" style={{ padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: 'var(--primary)', display: 'inline-flex' }}>{p.icon}</span>
                <div>
                  <div className="small" style={{ fontWeight: 700 }}>{p.title}</div>
                  <div className="small muted">{p.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: 'flex', gap: 6, borderBottom: '2px solid var(--line)', marginBottom: 22, overflowX: 'auto' }}>
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="pd-tab"
              style={{
                padding: '12px 18px',
                fontWeight: 700,
                fontSize: '0.92rem',
                background: 'none',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--primary-600)' : '2px solid transparent',
                color: tab === t ? 'var(--primary)' : 'var(--muted)',
                marginBottom: -2,
                cursor: 'pointer',
                textTransform: 'capitalize',
                whiteSpace: 'nowrap',
              }}
            >
              {t} {t === 'reviews' && `(${data.reviews.length})`}
            </button>
          ))}
        </div>

        {tab === 'description' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '26px 30px' }}>
            {product.description.split('\n').filter(Boolean).map((para, i) => (
              <p key={i} style={{ marginBottom: 12, lineHeight: 1.75, color: 'var(--ink-2)' }}>
                {para}
              </p>
            ))}
            {product.tags?.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
                {product.tags.map((t) => (
                  <Link key={t} to={`/shop?search=${encodeURIComponent(t)}`} className="chip">
                    #{t}
                  </Link>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {tab === 'specifications' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ overflow: 'hidden' }}>
            {(product.specifications || []).length ? (
              <table className="table">
                <tbody>
                  {product.specifications.map((s, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 700, width: '30%' }}>{s.key}</td>
                      <td style={{ color: 'var(--ink-2)' }}>{s.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="muted" style={{ padding: 26 }}>No specifications listed for this product.</p>
            )}
          </motion.div>
        )}

        {tab === 'reviews' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: 20, alignItems: 'start' }} className="pd-reviews-grid">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.reviews.length === 0 && (
                <div className="card" style={{ padding: 30 }}>
                  <p className="muted">No reviews yet. Be the first to review this product!</p>
                </div>
              )}
              {data.reviews.map((r) => (
                <div key={r._id} className="card" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span className="avatar" style={{ width: 40, height: 40 }}>{getInitials(r.user?.name)}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.92rem' }}>{r.user?.name || 'Customer'}</span>
                        {r.isVerifiedPurchase && (
                          <span className="badge badge-success"><FiCheckCircle size={11} /> Verified purchase</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
                        <Stars value={r.rating} />
                        <span className="small muted">{formatDate(r.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                  {r.title && <div style={{ fontWeight: 700, marginTop: 12 }}>{r.title}</div>}
                  <p style={{ color: 'var(--ink-2)', lineHeight: 1.65, marginTop: 6 }}>{r.comment}</p>
                </div>
              ))}
            </div>

            {/* Review form */}
            <div className="card" style={{ padding: 24, position: 'sticky', top: 90 }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.05rem' }}>Write a review</h3>
              {!user ? (
                <>
                  <p className="small muted" style={{ margin: '8px 0 16px' }}>You need an account to review this product.</p>
                  <Link to="/login" className="btn btn-primary btn-block">Log in to review</Link>
                </>
              ) : alreadyReviewed ? (
                <p className="small muted" style={{ marginTop: 8 }}>
                  You've already reviewed this product. You can edit it from{' '}
                  <Link to="/account/reviews" style={{ fontWeight: 600, color: 'var(--primary)' }}>My Reviews</Link>.
                </p>
              ) : (
                <form onSubmit={submitReview} style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 14 }}>
                  <div>
                    <label className="label">Your rating</label>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setReviewForm((f) => ({ ...f, rating: n }))}
                          aria-label={`${n} star`}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: n <= reviewForm.rating ? '#f59e0b' : '#d1d5db', display: 'inline-flex', padding: 2 }}
                        >
                          <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>★</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="label">Title (optional)</label>
                    <input className="field" value={reviewForm.title} onChange={(e) => setReviewForm((f) => ({ ...f, title: e.target.value }))} placeholder="Sum it up in a few words" />
                  </div>
                  <div>
                    <label className="label">Your review</label>
                    <textarea
                      className="field"
                      rows={4}
                      value={reviewForm.comment}
                      onChange={(e) => setReviewForm((f) => ({ ...f, comment: e.target.value }))}
                      placeholder="What did you like or dislike? How is the quality?"
                    />
                  </div>
                  <button className="btn btn-primary btn-block" disabled={submittingReview}>
                    {submittingReview ? 'Submitting…' : 'Submit review'}
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Related */}
      {data.related?.length > 0 && (
        <section style={{ marginTop: 56 }}>
          <div className="section-head">
            <h2 className="section-title"><span className="title-bar" /> You may also like</h2>
            <Link to={`/shop?category=${product.category?.slug}`} className="btn btn-ghost btn-sm">View all</Link>
          </div>
          <div className="grid grid-4">
            {data.related.map((p, i) => (
              <ProductCard key={p._id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default ProductDetail;
