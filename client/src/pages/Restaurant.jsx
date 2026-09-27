import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import QtyControl from '../components/QtyControl';
import { money, PLACEHOLDER_IMG } from '../utils';

export default function Restaurant() {
  const { id } = useParams();
  const { user } = useAuth();
  const { cart, addItem, setQuantity, qtyOf, count, subtotal } = useCart();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [vegOnly, setVegOnly] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api.get(`/restaurants/${id}`).then((r) => setData(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  const grouped = useMemo(() => {
    if (!data) return [];
    const q = query.trim().toLowerCase();
    const map = new Map();
    for (const item of data.menu) {
      if (vegOnly && !item.isVeg) continue;
      if (q && !item.name.toLowerCase().includes(q)) continue;
      if (!map.has(item.category)) map.set(item.category, []);
      map.get(item.category).push(item);
    }
    return [...map.entries()];
  }, [data, vegOnly, query]);

  if (error) return <p className="error">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;
  const { restaurant: r } = data;
  const canOrder = r.isOpen && user?.role !== 'owner';

  return (
    <div>
      <section className="rest-header">
        <img src={r.image || PLACEHOLDER_IMG} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
        <div>
          <h1>{r.name}</h1>
          <p className="muted">{r.cuisines.join(', ')}</p>
          {r.description && <p>{r.description}</p>}
          <p className="muted small">
            ★ {r.rating.toFixed(1)} · {r.deliveryTime} min · {money(r.deliveryFee)} delivery
            {r.minOrder > 0 && ` · Min order ${money(r.minOrder)}`}
          </p>
          {r.address && <p className="muted small">📍 {r.address}{r.city && `, ${r.city}`}</p>}
          {!r.isOpen && <p className="error">This restaurant is currently closed.</p>}
        </div>
      </section>

      <div className="menu-layout">
        <aside className="category-nav">
          <h4>Menu</h4>
          {grouped.map(([cat, items]) => (
            <a key={cat} href={`#cat-${cat}`}>{cat} <span className="muted">({items.length})</span></a>
          ))}
        </aside>

        <div className="menu">
          <div className="filter-row">
            <input placeholder="Search in menu…" value={query} onChange={(e) => setQuery(e.target.value)} />
            <label className="check">
              <input type="checkbox" checked={vegOnly} onChange={(e) => setVegOnly(e.target.checked)} /> Veg only
            </label>
          </div>

          {grouped.length === 0 && <p className="muted">No items found.</p>}
          {grouped.map(([cat, items]) => (
            <section key={cat} id={`cat-${cat}`} className="menu-section">
              <h2>{cat}</h2>
              {items.map((item) => (
                <div key={item._id} className={`menu-item ${!item.isAvailable ? 'unavailable' : ''}`}>
                  <div>
                    <span className={`veg-mark ${item.isVeg ? 'veg' : 'nonveg'}`} title={item.isVeg ? 'Veg' : 'Non-veg'} />
                    <strong>{item.name}</strong>
                    <div>{money(item.price)}</div>
                    {item.description && <p className="muted small">{item.description}</p>}
                  </div>
                  <div className="menu-item-side">
                    {item.image && <img src={item.image} alt="" />}
                    {canOrder && (
                      <QtyControl
                        qty={cart.restaurant?._id === r._id ? qtyOf(item._id) : 0}
                        disabled={!item.isAvailable}
                        onAdd={() => addItem(r, item)}
                        onChange={(q) => setQuantity(item._id, q)}
                      />
                    )}
                  </div>
                </div>
              ))}
            </section>
          ))}
        </div>
      </div>

      {count > 0 && cart.restaurant?._id === r._id && (
        <Link to="/cart" className="cart-bar">
          <span>{count} item{count > 1 ? 's' : ''} · {money(subtotal)}</span>
          <strong>View cart →</strong>
        </Link>
      )}
    </div>
  );
}
