import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { useSocketEvent } from '../../context/SocketContext';
import StatusBadge from '../../components/StatusBadge';
import { fmtDate, money, OWNER_ACTIONS } from '../../utils';

const TABS = [
  { key: 'active', label: 'Active' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: '', label: 'All' },
];
const isActive = (s) => !['delivered', 'cancelled'].includes(s);
const matchesTab = (tab, status) => (tab === 'active' ? isActive(status) : !tab || tab === status);

export default function OwnerOrders() {
  const [tab, setTab] = useState('active');
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(null);
  const [fresh, setFresh] = useState(new Set());

  useEffect(() => {
    setOrders(null);
    api.get('/orders/restaurant', { params: { status: tab } }).then((r) => setOrders(r.data)).catch((e) => setError(errMsg(e)));
  }, [tab]);

  // Incoming orders appear instantly
  useSocketEvent('order:new', (o) => {
    if (!matchesTab(tab, o.status)) return;
    setOrders((list) => (list && !list.some((x) => x._id === o._id) ? [o, ...list] : list));
    setFresh((s) => new Set(s).add(o._id));
  });

  useSocketEvent('order:updated', (o) =>
    setOrders((list) => list?.map((x) => (x._id === o._id ? o : x)).filter((x) => matchesTab(tab, x.status)))
  );

  const updateStatus = async (order, status) => {
    if (status === 'cancelled' && !window.confirm('Cancel this order?')) return;
    setBusy(order._id);
    setError('');
    try {
      const { data } = await api.patch(`/orders/${order._id}/status`, { status });
      setOrders((list) => list.map((x) => (x._id === data._id ? data : x)).filter((x) => matchesTab(tab, x.status)));
      setFresh((s) => {
        const n = new Set(s);
        n.delete(order._id);
        return n;
      });
    } catch (e) {
      setError(errMsg(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      <h1>Orders <span className="live small">● Live</span></h1>
      <div className="segmented">
        {TABS.map((t) => (
          <button key={t.key} className={tab === t.key ? 'active' : ''} onClick={() => setTab(t.key)}>{t.label}</button>
        ))}
      </div>
      {error && <p className="error">{error}</p>}
      {!orders ? (
        <p className="muted">Loading…</p>
      ) : orders.length === 0 ? (
        <p className="muted">No orders here.</p>
      ) : (
        <div className="order-grid">
          {orders.map((o) => (
            <div key={o._id} className={`card card-body order-card ${fresh.has(o._id) ? 'fresh' : ''}`}>
              <div className="row-between">
                <div>
                  <Link to={`/orders/${o._id}`}><strong>#{o._id.slice(-6).toUpperCase()}</strong></Link>
                  <div className="muted small">{fmtDate(o.createdAt)}</div>
                </div>
                <StatusBadge status={o.status} />
              </div>
              <div className="small">
                <strong>{o.user?.name}</strong>
                {o.address?.phone && ` · ${o.address.phone}`}
                <div className="muted">{o.address?.line1}, {o.address?.city}</div>
              </div>
              <ul className="item-list small">
                {o.items.map((i, idx) => <li key={idx}>{i.quantity} × {i.name}</li>)}
              </ul>
              {o.note && <p className="small note">📝 {o.note}</p>}
              <div className="row-between">
                <strong>{money(o.total)}</strong>
                <span className="muted small">{o.paymentMethod === 'cod' ? 'Cash' : 'Card'}</span>
              </div>
              {OWNER_ACTIONS[o.status] && (
                <div className="actions">
                  {OWNER_ACTIONS[o.status].map((a) => (
                    <button
                      key={a.status}
                      className={`btn btn-sm ${a.danger ? 'btn-outline danger-text' : ''}`}
                      disabled={busy === o._id}
                      onClick={() => updateStatus(o, a.status)}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
