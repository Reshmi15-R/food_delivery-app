import { STATUS_LABEL } from '../utils';

export default function StatusBadge({ status }) {
  return <span className={`status status-${status}`}>{STATUS_LABEL[status] || status}</span>;
}
