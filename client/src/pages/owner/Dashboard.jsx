import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../../api';
import { useSocketEvent } from '../../context/SocketContext';
import { money, STATUS_LABEL } from '../../utils';

const RANGES = [7, 14, 30, 90];
const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;

export default function Dashboard() {
  const [restaurant, setRestaurant] = useState(undefined);
  const [days, setDays] = useState(7);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/restaurants/mine').then((r) => setRestaurant(r.data)).catch((e) => setError(errMsg(e)));
  }, []);

  const load = useCallback(() => {
    api.get('/analytics', { params: { days, tz } }).then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
  }, [days]);

  useEffect(() => {
    if (restaurant) load();
  }, [restaurant, load]);

  // Keep numbers current as orders arrive or change
  useSocketEvent('order:new', load);
  useSocketEvent('order:updated', load);

  if (restaurant === undefined) return <p className="muted">Loading…</p>;
  if (!restaurant) {
    return (
      <div className="center">
        <h2>Welcome, partner!</h2>
        <p className="muted">Set up your restaurant profile to start receiving orders.</p>
        <Link to="/owner/restaurant" className="btn">Create restaurant</Link>
      </div>
    );
  }

  const active = stats ? ['placed', 'accepted', 'preparing', 'out_for_delivery'].reduce((s, k) => s + (stats.byStatus[k] || 0), 0) : 0;

  return (
    <div>
      <div className="row-between wrap">
        <div>
          <h1>{restaurant.name}</h1>
          <p className="muted">
            {restaurant.isOpen ? '🟢 Open for orders' : '🔴 Closed'} · Sales overview
          </p>
        </div>
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map((d) => (
            <button key={d} className={days === d ? 'active' : ''} onClick={() => setDays(d)}>
              {d}d
            </button>
          ))}
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      {stats && (
        <>
          <div className="stats">
            <Stat label="Revenue" value={money(stats.revenue)} />
            <Stat label="Orders" value={stats.orders} />
            <Stat label="Avg order value" value={money(stats.avgOrderValue)} />
            <Stat label="Active orders" value={active} link="/owner/orders" />
          </div>

          <div className="card card-body">
            <h3>Daily revenue</h3>
            <RevenueChart data={stats.daily} />
          </div>

          <div className="two-col">
            <div className="card card-body">
              <h3>Top items</h3>
              {stats.topItems.length === 0 ? (
                <p className="muted">No sales in this period.</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr><th>Item</th><th className="num">Sold</th><th className="num">Revenue</th></tr>
                  </thead>
                  <tbody>
                    {stats.topItems.map((t) => (
                      <tr key={t.name}><td>{t.name}</td><td className="num">{t.quantity}</td><td className="num">{money(t.revenue)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
            <div className="card card-body">
              <h3>Orders by status</h3>
              <table className="table">
                <tbody>
                  {Object.keys(STATUS_LABEL).map((s) => (
                    <tr key={s}><td>{STATUS_LABEL[s]}</td><td className="num">{stats.byStatus[s] || 0}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Stat({ label, value, link }) {
  const body = (
    <>
      <div className="muted small">{label}</div>
      <div className="stat-value">{value}</div>
    </>
  );
  return link ? <Link to={link} className="card card-body stat">{body}</Link> : <div className="card card-body stat">{body}</div>;
}

// Single-series bar chart with a per-bar hover tooltip and a table fallback.
function RevenueChart({ data }) {
  const [hover, setHover] = useState(null);
  const [showTable, setShowTable] = useState(false);
  const max = Math.max(...data.map((d) => d.revenue), 1);
  const label = (date) => new Date(date + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  const every = Math.ceil(data.length / 10); // thin out x-axis labels

  if (showTable) {
    return (
      <>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(false)}>Show chart</button>
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Date</th><th className="num">Orders</th><th className="num">Revenue</th></tr></thead>
            <tbody>
              {data.map((d) => (
                <tr key={d.date}><td>{label(d.date)}</td><td className="num">{d.orders}</td><td className="num">{money(d.revenue)}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    <>
      <button className="btn btn-ghost btn-sm" onClick={() => setShowTable(true)}>Show as table</button>
      <div className="chart" role="img" aria-label={`Daily revenue for the last ${data.length} days, peak ${money(max)}`}>
        <div className="chart-y muted small">
          <span>{money(max)}</span>
          <span>{money(max / 2)}</span>
          <span>₹0</span>
        </div>
        <div className="chart-plot">
          <div className="gridline" style={{ bottom: '50%' }} />
          <div className="gridline" style={{ bottom: '100%' }} />
          {data.map((d, i) => (
            <div
              key={d.date}
              className="bar-slot"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              <div className={`bar ${hover === i ? 'hover' : ''}`} style={{ height: `${(d.revenue / max) * 100}%` }} />
              {hover === i && (
                <div className={`tooltip ${i > data.length / 2 ? 'left' : ''}`}>
                  <strong>{label(d.date)}</strong>
                  <div>{money(d.revenue)}</div>
                  <div className="muted">{d.orders} order{d.orders === 1 ? '' : 's'}</div>
                </div>
              )}
              <span className="bar-label muted">{i % every === 0 ? label(d.date) : ''}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
