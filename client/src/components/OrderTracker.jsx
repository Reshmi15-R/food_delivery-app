import { STATUS_FLOW, STATUS_LABEL, fmtDate } from '../utils';

export default function OrderTracker({ order }) {
  if (order.status === 'cancelled') {
    return <div className="status-banner cancelled">✕ This order was cancelled</div>;
  }
  const current = STATUS_FLOW.indexOf(order.status);
  const timeOf = (s) => order.statusHistory?.find((h) => h.status === s)?.at;

  return (
    <ol className="tracker">
      {STATUS_FLOW.map((s, i) => (
        <li key={s} className={i < current ? 'done' : i === current ? 'current' : ''}>
          <span className="dot">{i <= current ? '✓' : i + 1}</span>
          <span className="label">{STATUS_LABEL[s]}</span>
          {timeOf(s) && <span className="muted small">{fmtDate(timeOf(s))}</span>}
        </li>
      ))}
    </ol>
  );
}
