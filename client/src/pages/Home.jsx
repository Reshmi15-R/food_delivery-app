import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { money, PLACEHOLDER_IMG } from '../utils';

export default function Home() {
  const [params, setParams] = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [cuisines, setCuisines] = useState([]);
  const [search, setSearch] = useState(params.get('search') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const cuisine = params.get('cuisine') || '';
  const sort = params.get('sort') || 'rating';
  const veg = params.get('veg') === 'true';
  const openNow = params.get('openNow') === 'true';

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    value ? next.set(key, value) : next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    api.get('/restaurants/cuisines').then((r) => setCuisines(r.data)).catch(() => {});
  }, []);

  // Debounce typing into the search box
  useEffect(() => {
    const t = setTimeout(() => setParam('search', search.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  useEffect(() => {
    setLoading(true);
    api
      .get('/restaurants', { params: Object.fromEntries(params) })
      .then((r) => {
        setRestaurants(r.data);
        setError('');
      })
      .catch((e) => setError(errMsg(e)))
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <div>
      <section className="hero">
        <h1>Hungry? We've got you.</h1>
        <p className="muted">Order from the best restaurants near you, tracked live to your door.</p>
        <input
          className="search"
          placeholder="Search restaurants, cuisines or dishes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </section>

      <div className="filters">
        <div className="chips">
          <button className={`chip ${!cuisine ? 'active' : ''}`} onClick={() => setParam('cuisine', '')}>All</button>
          {cuisines.map((c) => (
            <button key={c} className={`chip ${cuisine === c ? 'active' : ''}`} onClick={() => setParam('cuisine', cuisine === c ? '' : c)}>
              {c}
            </button>
          ))}
        </div>
        <div className="filter-row">
          <label className="check">
            <input type="checkbox" checked={veg} onChange={(e) => setParam('veg', e.target.checked ? 'true' : '')} /> Pure veg
          </label>
          <label className="check">
            <input type="checkbox" checked={openNow} onChange={(e) => setParam('openNow', e.target.checked ? 'true' : '')} /> Open now
          </label>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)}>
            <option value="rating">Sort: Rating</option>
            <option value="deliveryTime">Sort: Delivery time</option>
            <option value="deliveryFee">Sort: Delivery fee</option>
            <option value="newest">Sort: Newest</option>
          </select>
        </div>
      </div>

      {error && <p className="error">{error}</p>}
      {loading ? (
        <p className="muted">Loading restaurants…</p>
      ) : restaurants.length === 0 ? (
        <p className="muted center">No restaurants match your filters.</p>
      ) : (
        <div className="grid">
          {restaurants.map((r) => (
            <Link to={`/restaurants/${r._id}`} key={r._id} className={`card restaurant-card ${!r.isOpen ? 'closed' : ''}`}>
              <img src={r.image || PLACEHOLDER_IMG} alt="" onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)} />
              {!r.isOpen && <span className="closed-tag">Closed</span>}
              <div className="card-body">
                <div className="row-between">
                  <h3>{r.name}</h3>
                  <span className="rating">★ {r.rating.toFixed(1)}</span>
                </div>
                <p className="muted small">{r.cuisines.join(', ')}</p>
                <p className="muted small">
                  {r.deliveryTime} min · {r.deliveryFee ? `${money(r.deliveryFee)} delivery` : 'Free delivery'}
                  {r.city && ` · ${r.city}`}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
