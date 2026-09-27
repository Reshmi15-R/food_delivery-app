import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useSocketEvent } from '../context/SocketContext';
import OrderTracker from '../components/OrderTracker';
import StatusBadge from '../components/StatusBadge';
import { fmtDate, money } from '../utils';

export default function OrderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/orders/${id}`).then((r) => setOrder(r.data)).catch((e) => setError(errMsg(e)));
  }, [id]);

  // Live status updates
  useSocketEvent('order:updated', (o) => {
    if (o._id === id) setOrder(o);
  });

  const cancel = async () => {
    if (!window.confirm('Cancel this order?')) return;
    try {
      setOrder((await api.patch(`/orders/${id}/cancel`)).data);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  if (error && !order) return <p className="error">{error}</p>;
  if (!order) return <p className="muted">Loading…</p>;
  const isCustomer = String(order.user._id) === String(user._id);

  return (
    <div className="narrow">
      <Link to={isCustomer ? '/orders' : '/owner/orders'} className="muted small">← All orders</Link>
      <div className="row-between">
        <h1>Order #{order._id.slice(-6).toUpperCase()}</h1>
        <StatusBadge status={order.status} />
      </div>
      <p className="muted">
        {order.restaurant.name} · placed {fmtDate(order.createdAt)}
        {order.status !== 'delivered' && order.status !== 'cancelled' && <span className="live"> ● Live</span>}
      </p>

      <div className="card card-body">
        <OrderTracker order={order} />
      </div>

      <div className="card card-body">
        <h3>Items</h3>
        {order.items.map((i, idx) => (
          <div key={idx} className="row-between small">
            <span>{i.quantity} × {i.name}</span>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <hr />
        <div className="row-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div className="row-between muted"><span>Delivery</span><span>{money(order.deliveryFee)}</span></div>
        <div className="row-between total"><span>Total</span><span>{money(order.total)}</span></div>
        <p className="muted small">Payment: {order.paymentMethod === 'cod' ? 'Cash on delivery' : 'Card on delivery'}</p>
      </div>

      <div className="card card-body">
        <h3>Delivery to</h3>
        <p>
          {!isCustomer && <><strong>{order.user.name}</strong><br /></>}
          {order.address.line1}, {order.address.city} - {order.address.pincode}
          {order.address.phone && <><br />📞 {order.address.phone}</>}
        </p>
        {order.note && <p className="muted">Note: {order.note}</p>}
      </div>

      {error && <p className="error">{error}</p>}
      {isCustomer && order.status === 'placed' && (
        <button className="btn btn-danger" onClick={cancel}>Cancel order</button>
      )}
    </div>
  );
}
