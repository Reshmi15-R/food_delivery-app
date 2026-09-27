import { useState } from 'react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import AddressForm from '../components/AddressForm';

export default function Profile() {
  const { user, setUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone || '', currentPassword: '', newPassword: '' });
  const [msg, setMsg] = useState({ text: '', error: false });
  const [editing, setEditing] = useState(null); // address id, 'new', or null
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const flash = (text, error = false) => setMsg({ text, error });

  const saveProfile = async (e) => {
    e.preventDefault();
    try {
      const { data } = await api.put('/users/profile', form);
      setUser(data);
      setForm({ ...form, currentPassword: '', newPassword: '' });
      flash('Profile updated');
    } catch (err) {
      flash(errMsg(err), true);
    }
  };

  const saveAddress = async (addr) => {
    try {
      const { data } =
        editing === 'new' ? await api.post('/users/addresses', addr) : await api.put(`/users/addresses/${editing}`, addr);
      setUser({ ...user, addresses: data });
      setEditing(null);
    } catch (err) {
      flash(errMsg(err), true);
    }
  };

  const removeAddress = async (id) => {
    if (!window.confirm('Delete this address?')) return;
    const { data } = await api.delete(`/users/addresses/${id}`);
    setUser({ ...user, addresses: data });
  };

  return (
    <div className="narrow">
      <h1>Profile</h1>
      {msg.text && <p className={msg.error ? 'error' : 'success'}>{msg.text}</p>}

      <form className="card card-body form" onSubmit={saveProfile}>
        <h3>Account</h3>
        <label>Email<input value={user.email} disabled /></label>
        <div className="form-row">
          <label>Name<input required value={form.name} onChange={set('name')} /></label>
          <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        </div>
        <h4>Change password</h4>
        <div className="form-row">
          <label>Current password<input type="password" value={form.currentPassword} onChange={set('currentPassword')} /></label>
          <label>New password<input type="password" minLength={6} value={form.newPassword} onChange={set('newPassword')} /></label>
        </div>
        <div><button className="btn">Save changes</button></div>
      </form>

      {user.role === 'customer' && (
        <section className="card card-body">
          <div className="row-between">
            <h3>Saved addresses</h3>
            {editing !== 'new' && <button className="btn btn-ghost btn-sm" onClick={() => setEditing('new')}>+ Add</button>}
          </div>
          {editing === 'new' && <AddressForm onSubmit={saveAddress} onCancel={() => setEditing(null)} />}
          {user.addresses.length === 0 && editing !== 'new' && <p className="muted">No saved addresses.</p>}
          {user.addresses.map((a) =>
            editing === a._id ? (
              <AddressForm key={a._id} initial={a} onSubmit={saveAddress} onCancel={() => setEditing(null)} />
            ) : (
              <div key={a._id} className="row-between address-row">
                <div>
                  <strong>{a.label}</strong>
                  <div className="muted small">{a.line1}, {a.city} - {a.pincode}{a.phone && ` · ${a.phone}`}</div>
                </div>
                <div className="actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(a._id)}>Edit</button>
                  <button className="btn btn-ghost btn-sm danger-text" onClick={() => removeAddress(a._id)}>Delete</button>
                </div>
              </div>
            )
          )}
        </section>
      )}
    </div>
  );
}
