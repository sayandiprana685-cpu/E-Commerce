import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2, FiTrash2, FiMapPin, FiStar } from 'react-icons/fi';
import api from '../../services/api';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/Modal';
import EmptyState from '../../components/EmptyState';
import { RowSkeleton } from '../../components/Skeletons';

const EMPTY = { fullName: '', phone: '', line1: '', line2: '', city: '', state: '', pincode: '', isDefault: false };

const AddressFields = ({ form, setForm }) => {
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  return (
    <>
      <div className="grid grid-2" style={{ gap: 12 }}>
        <div>
          <label className="label">Full name</label>
          <input className="field" required value={form.fullName} onChange={set('fullName')} placeholder="Recipient name" />
        </div>
        <div>
          <label className="label">Phone</label>
          <input className="field" required value={form.phone} onChange={set('phone')} placeholder="10-digit mobile" />
        </div>
      </div>
      <div className="field mt-8">
        <label className="label">Address line 1</label>
        <input className="field" required value={form.line1} onChange={set('line1')} placeholder="House / Flat / Street" />
      </div>
      <div className="field">
        <label className="label">Address line 2 (optional)</label>
        <input className="field" value={form.line2} onChange={set('line2')} placeholder="Landmark, Area" />
      </div>
      <div className="grid grid-3" style={{ gap: 12 }}>
        <div>
          <label className="label">City</label>
          <input className="field" required value={form.city} onChange={set('city')} />
        </div>
        <div>
          <label className="label">State</label>
          <input className="field" required value={form.state} onChange={set('state')} />
        </div>
        <div>
          <label className="label">Pincode</label>
          <input className="field" required value={form.pincode} onChange={set('pincode')} placeholder="6-digit PIN" />
        </div>
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 600, fontSize: '0.88rem', marginTop: 6, cursor: 'pointer' }}>
        <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} style={{ width: 17, height: 17, accentColor: 'var(--primary-600)' }} />
        Set as default address
      </label>
    </>
  );
};

const Addresses = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);

  const fetchAddresses = async () => {
    try {
      const res = await api.get('/users/addresses');
      setAddresses(res.data.data.addresses || []);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAddresses(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openAdd = () => { setEditing(null); setForm(EMPTY); setModalOpen(true); };
  const openEdit = (a) => { setEditing(a); setForm({ ...a }); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const res = await api.put(`/users/addresses/${editing._id}`, form);
        setAddresses(res.data.data.addresses);
        toast('Address updated.', 'success');
      } else {
        const res = await api.post('/users/addresses', form);
        setAddresses(res.data.data.addresses);
        toast('Address added.', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!window.confirm(`Delete address for ${a.fullName}?`)) return;
    try {
      const res = await api.delete(`/users/addresses/${a._id}`);
      setAddresses(res.data.data.addresses);
      toast('Address removed.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const setDefault = async (a) => {
    try {
      const res = await api.put(`/users/addresses/${a._id}`, { isDefault: true });
      setAddresses(res.data.data.addresses);
      toast('Default address updated.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Saved Addresses</h1>
          <p className="page-sub">Manage delivery addresses for faster checkout.</p>
        </div>
        <button className="btn btn-primary" onClick={openAdd}>
          <FiPlus size={16} /> Add address
        </button>
      </div>

      {loading ? (
        <RowSkeleton rows={3} />
      ) : addresses.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FiMapPin />}
            title="No saved addresses"
            description="Save an address now to breeze through checkout next time."
            action={<button className="btn btn-primary btn-sm" onClick={openAdd}><FiPlus size={14} /> Add your first address</button>}
          />
        </div>
      ) : (
        <div className="addr-grid">
          {addresses.map((a) => (
            <div key={a._id} className="card card-pad" style={{ display: 'flex', flexDirection: 'column', borderColor: a.isDefault ? 'var(--primary-600)' : 'var(--line)' }}>
              <div className="flex-between mb-16" style={{ gap: 8 }}>
                <strong>{a.fullName}</strong>
                {a.isDefault ? (
                  <span className="badge badge-success">Default</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" onClick={() => setDefault(a)} title="Set as default">
                    <FiStar size={13} /> Set default
                  </button>
                )}
              </div>
              <p className="small muted" style={{ lineHeight: 1.7, flex: 1 }}>
                {a.line1}{a.line2 ? `, ${a.line2}` : ''}<br />
                {a.city}, {a.state} — {a.pincode}<br />
                {a.country || 'India'} · Phone: {a.phone}
              </p>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button className="btn btn-outline btn-sm" onClick={() => openEdit(a)}>
                  <FiEdit2 size={13} /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" onClick={() => remove(a)} style={{ color: 'var(--danger)' }}>
                  <FiTrash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit address' : 'Add new address'}>
        <form onSubmit={save}>
          <AddressFields form={form} setForm={setForm} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 22 }}>
            <button type="button" className="btn btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? <span className="spinner" /> : null} {editing ? 'Save changes' : 'Add address'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Addresses;
