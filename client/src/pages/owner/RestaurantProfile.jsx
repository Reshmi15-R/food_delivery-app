import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { PLACEHOLDER_IMG } from '../../utils';

const EMPTY = {
  name: '', description: '', cuisines: '', address: '', city: '', phone: '', image: '',
  deliveryTime: 30, deliveryFee: 30, minOrder: 0, isOpen: true,
};

export default function RestaurantProfile() {
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ text: '', error: false });

  useEffect(() => {
    api
      .get('/restaurants/mine')
      .then(({ data }) => {
        if (data) {
          setExists(true);
          setForm({ ...EMPTY, ...data, cuisines: data.cuisines.join(', ') });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      ...form,
      cuisines: form.cuisines.split(',').map((c) => c.trim()).filter(Boolean),
      deliveryTime: Number(form.deliveryTime),
      deliveryFee: Number(form.deliveryFee),
      minOrder: Number(form.minOrder),
    };
    try {
      if (exists) {
        await api.put('/restaurants/mine', payload);
        setMsg({ text: 'Restaurant updated', error: false });
      } else {
        await api.post('/restaurants', payload);
        navigate('/owner/menu');
      }
    } catch (err) {
      setMsg({ text: errMsg(err), error: true });
    }
  };

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <div className="narrow">
      <h1>{exists ? 'Restaurant profile' : 'Register your restaurant'}</h1>
      {msg.text && <p className={msg.error ? 'error' : 'success'}>{msg.text}</p>}
      <form className="card card-body form" onSubmit={submit}>
        {exists && (
          <label className="toggle">
            <input type="checkbox" checked={form.isOpen} onChange={set('isOpen')} />
            <span>{form.isOpen ? 'Open - accepting orders' : 'Closed - not accepting orders'}</span>
          </label>
        )}
        <label>Restaurant name<input required value={form.name} onChange={set('name')} /></label>
        <label>Description<textarea rows={2} value={form.description} onChange={set('description')} /></label>
        <label>Cuisines (comma separated)<input value={form.cuisines} onChange={set('cuisines')} placeholder="North Indian, Chinese" /></label>
        <div className="form-row">
          <label>Address<input value={form.address} onChange={set('address')} /></label>
          <label>City<input value={form.city} onChange={set('city')} /></label>
        </div>
        <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        <label>Cover image URL<input type="url" value={form.image} onChange={set('image')} placeholder="https://…" /></label>
        {form.image && <img className="preview" src={form.image} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />}
        <div className="form-row three">
          <label>Delivery time (min)<input type="number" min={5} value={form.deliveryTime} onChange={set('deliveryTime')} /></label>
          <label>Delivery fee (₹)<input type="number" min={0} value={form.deliveryFee} onChange={set('deliveryFee')} /></label>
          <label>Min order (₹)<input type="number" min={0} value={form.minOrder} onChange={set('minOrder')} /></label>
        </div>
        <div><button className="btn">{exists ? 'Save changes' : 'Create restaurant'}</button></div>
      </form>
    </div>
  );
}
