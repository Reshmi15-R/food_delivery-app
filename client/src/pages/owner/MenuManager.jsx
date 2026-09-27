import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { money } from '../../utils';

const EMPTY = { name: '', description: '', price: '', category: '', image: '', isVeg: true, isAvailable: true };

export default function MenuManager() {
  const [items, setItems] = useState(null);
  const [editing, setEditing] = useState(null); // item being edited, or EMPTY for new
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/menu').then((r) => setItems(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const categories = useMemo(() => [...new Set((items || []).map((i) => i.category))], [items]);
  const grouped = useMemo(
    () => categories.map((c) => [c, items.filter((i) => i.category === c)]),
    [categories, items]
  );

  const save = async (form) => {
    setError('');
    try {
      const payload = { ...form, price: Number(form.price) };
      if (form._id) {
        const { data } = await api.put(`/menu/${form._id}`, payload);
        setItems(items.map((i) => (i._id === data._id ? data : i)));
      } else {
        const { data } = await api.post('/menu', payload);
        setItems([...items, data]);
      }
      setEditing(null);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const toggle = async (item) => {
    const { data } = await api.put(`/menu/${item._id}`, { isAvailable: !item.isAvailable });
    setItems(items.map((i) => (i._id === data._id ? data : i)));
  };

  const remove = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    await api.delete(`/menu/${item._id}`);
    setItems(items.filter((i) => i._id !== item._id));
  };

  if (error && !items) {
    return (
      <div className="center">
        <p className="error">{error}</p>
        <Link to="/owner/restaurant" className="btn">Set up restaurant</Link>
      </div>
    );
  }
  if (!items) return <p className="muted">Loading…</p>;

  return (
    <div>
      <div className="row-between">
        <h1>Menu</h1>
        {!editing && <button className="btn" onClick={() => setEditing(EMPTY)}>+ Add item</button>}
      </div>
      {error && <p className="error">{error}</p>}

      {editing && <ItemForm initial={editing} categories={categories} onSave={save} onCancel={() => setEditing(null)} />}

      {items.length === 0 && !editing && <p className="muted">Your menu is empty. Add your first dish!</p>}

      {grouped.map(([cat, list]) => (
        <section key={cat} className="card card-body">
          <h3>{cat} <span className="muted small">({list.length})</span></h3>
          <div className="table-wrap">
            <table className="table">
              <tbody>
                {list.map((item) => (
                  <tr key={item._id} className={!item.isAvailable ? 'unavailable' : ''}>
                    <td>
                      <span className={`veg-mark ${item.isVeg ? 'veg' : 'nonveg'}`} /> <strong>{item.name}</strong>
                      {item.description && <div className="muted small">{item.description}</div>}
                    </td>
                    <td className="num">{money(item.price)}</td>
                    <td>
                      <label className="toggle small">
                        <input type="checkbox" checked={item.isAvailable} onChange={() => toggle(item)} />
                        <span>{item.isAvailable ? 'In stock' : 'Out of stock'}</span>
                      </label>
                    </td>
                    <td className="actions-cell">
                      <button className="btn btn-ghost btn-sm" onClick={() => setEditing(item)}>Edit</button>
                      <button className="btn btn-ghost btn-sm danger-text" onClick={() => remove(item)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}

function ItemForm({ initial, categories, onSave, onCancel }) {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  return (
    <form
      className="card card-body form"
      onSubmit={(e) => {
        e.preventDefault();
        onSave(form);
      }}
    >
      <h3>{form._id ? 'Edit item' : 'New item'}</h3>
      <div className="form-row">
        <label>Name<input required value={form.name} onChange={set('name')} /></label>
        <label>Price (₹)<input required type="number" min={0} step="any" value={form.price} onChange={set('price')} /></label>
      </div>
      <div className="form-row">
        <label>
          Category
          <input required list="categories" value={form.category} onChange={set('category')} placeholder="Starters, Main Course…" />
          <datalist id="categories">{categories.map((c) => <option key={c} value={c} />)}</datalist>
        </label>
        <label>Image URL<input type="url" value={form.image} onChange={set('image')} /></label>
      </div>
      <label>Description<textarea rows={2} value={form.description} onChange={set('description')} /></label>
      <div className="filter-row">
        <label className="check"><input type="checkbox" checked={form.isVeg} onChange={set('isVeg')} /> Vegetarian</label>
        <label className="check"><input type="checkbox" checked={form.isAvailable} onChange={set('isAvailable')} /> Available</label>
      </div>
      <div className="actions">
        <button className="btn">Save</button>
        <button type="button" className="btn btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
