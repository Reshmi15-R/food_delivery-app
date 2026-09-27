import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useCart } from '../context/CartContext';
import { useSocketEvent } from '../context/SocketContext';
import StatusBadge from '../components/StatusBadge';
import { fmtDate, money } from '../utils';

export default function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const { cart, replaceCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/orders/my').then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  useSocketEvent('order:updated', (o) =>
    setOrders((list) => list?.map((x) => (x._id === o._id ? { ...x, status: o.status } : x)))
  );

  // Rebuild the cart from a past order using current menu prices and availability
  const reorder = async (order) => {
    try {
      const { data } = await api.get(`/restaurants/${order.restaurant._id}`);
      const menu = new Map(data.menu.map((m) => [m._id, m]));
      const items = order.items
        .map((i) => ({ m: menu.get(i.menuItem), quantity: i.quantity }))
        .filter(({ m }) => m?.isAvailable)
        .map(({ m, quantity }) => ({ _id: m._id, name: m.name, price: m.price, isVeg: m.isVeg, quantity }));

      if (!items.length) return setError('None of the items from this order are available right now.');
      if (cart.items.length && !window.confirm('Replace the items currently in your cart?')) return;
      replaceCart(data.restaurant, items);
      if (items.length < order.items.length) alert('Some items are no longer available and were skipped.');
      navigate('/cart');
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (error && !orders) return <p className="error">{error}</p>;
  if (!orders) return <p className="muted">Loading…</p>;

  return (
    <div className="narrow">
      <h1>Your orders</h1>
      {error && <p className="error">{error}</p>}
      {orders.length === 0 && (
        <p className="muted">
          No orders yet. <Link to="/">Find something tasty</Link>
        </p>
      )}
      {orders.map((o) => (
        <div key={o._id} className="card card-body order-card">
          <div className="row-between">
            <div>
              <strong>{o.restaurant?.name || 'Restaurant removed'}</strong>
              <div className="muted small">#{o._id.slice(-6).toUpperCase()} · {fmtDate(o.createdAt)}</div>
            </div>
            <StatusBadge status={o.status} />
          </div>
          <p className="small">{o.items.map((i) => `${i.quantity} × ${i.name}`).join(', ')}</p>
          <div className="row-between">
            <strong>{money(o.total)}</strong>
            <div className="actions">
              <Link to={`/orders/${o._id}`} className="btn btn-ghost btn-sm">
                {['delivered', 'cancelled'].includes(o.status) ? 'Details' : 'Track'}
              </Link>
              {o.restaurant && <button className="btn btn-outline btn-sm" onClick={() => reorder(o)}>Reorder</button>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
