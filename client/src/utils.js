export const money = (n) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const STATUS_FLOW = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered'];

export const STATUS_LABEL = {
  placed: 'Order placed',
  accepted: 'Accepted',
  preparing: 'Preparing',
  out_for_delivery: 'Out for delivery',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

// Next actions available to a restaurant owner for each status
export const OWNER_ACTIONS = {
  placed: [
    { status: 'accepted', label: 'Accept' },
    { status: 'cancelled', label: 'Reject', danger: true },
  ],
  accepted: [
    { status: 'preparing', label: 'Start preparing' },
    { status: 'cancelled', label: 'Cancel', danger: true },
  ],
  preparing: [{ status: 'out_for_delivery', label: 'Out for delivery' }],
  out_for_delivery: [{ status: 'delivered', label: 'Mark delivered' }],
};

export const fmtDate = (d) =>
  new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export const PLACEHOLDER_IMG =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250"><rect width="100%" height="100%" fill="#f3e9e2"/><text x="50%" y="50%" font-size="48" text-anchor="middle" dominant-baseline="middle">🍽️</text></svg>'
  );
