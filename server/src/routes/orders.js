import { Router } from 'express';
import Order from '../models/Order.js';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { protect, requireRole } from '../middleware/auth.js';
import { emitOrder } from '../socket.js';

const router = Router();
router.use(protect);

// Allowed status transitions for restaurant owners
const NEXT = {
  placed: ['accepted', 'cancelled'],
  accepted: ['preparing', 'cancelled'],
  preparing: ['out_for_delivery'],
  out_for_delivery: ['delivered'],
  delivered: [],
  cancelled: [],
};

const populateOrder = (q) => q.populate('restaurant', 'name image phone address').populate('user', 'name email phone');

// Customer: place order. Prices are always taken from the database, never the client.
router.post('/', async (req, res) => {
  const { restaurantId, items, addressId, address: inlineAddress, paymentMethod, note } = req.body;
  if (!restaurantId || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ message: 'Restaurant and items are required' });
  }

  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  if (!restaurant.isOpen) return res.status(400).json({ message: 'Restaurant is currently closed' });

  const ids = items.map((i) => i.menuItem);
  const dbItems = await MenuItem.find({ _id: { $in: ids }, restaurant: restaurant._id });
  const byId = new Map(dbItems.map((m) => [String(m._id), m]));

  const orderItems = [];
  for (const { menuItem, quantity } of items) {
    const m = byId.get(String(menuItem));
    const qty = Math.floor(Number(quantity));
    if (!m) return res.status(400).json({ message: 'An item in your cart no longer exists' });
    if (!m.isAvailable) return res.status(400).json({ message: `${m.name} is currently unavailable` });
    if (!(qty >= 1 && qty <= 50)) return res.status(400).json({ message: 'Invalid quantity' });
    orderItems.push({ menuItem: m._id, name: m.name, price: m.price, quantity: qty });
  }

  const subtotal = orderItems.reduce((s, i) => s + i.price * i.quantity, 0);
  if (subtotal < restaurant.minOrder) {
    return res.status(400).json({ message: `Minimum order is ₹${restaurant.minOrder}` });
  }

  let address = addressId ? req.user.addresses.id(addressId) : inlineAddress;
  if (!address?.line1 || !address?.city || !address?.pincode) {
    return res.status(400).json({ message: 'A valid delivery address is required' });
  }
  address = { label: address.label, line1: address.line1, city: address.city, pincode: address.pincode, phone: address.phone };

  const order = await Order.create({
    user: req.user._id,
    restaurant: restaurant._id,
    items: orderItems,
    subtotal,
    deliveryFee: restaurant.deliveryFee,
    total: subtotal + restaurant.deliveryFee,
    address,
    paymentMethod: paymentMethod === 'card' ? 'card' : 'cod',
    note,
    statusHistory: [{ status: 'placed' }],
  });

  const full = await populateOrder(Order.findById(order._id));
  emitOrder('order:new', full);
  res.status(201).json(full);
});

// Customer: my orders
router.get('/my', async (req, res) => {
  const orders = await Order.find({ user: req.user._id })
    .sort({ createdAt: -1 })
    .populate('restaurant', 'name image');
  res.json(orders);
});

// Owner: orders for my restaurant
router.get('/restaurant', requireRole('owner'), async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) return res.json([]);
  const filter = { restaurant: restaurant._id };
  if (req.query.status === 'active') filter.status = { $nin: ['delivered', 'cancelled'] };
  else if (req.query.status) filter.status = req.query.status;
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).populate('user', 'name email phone');
  res.json(orders);
});

async function loadAccessibleOrder(req) {
  const order = await populateOrder(Order.findById(req.params.id));
  if (!order) return null;
  if (String(order.user._id) === String(req.user._id)) return order;
  if (req.user.role === 'owner') {
    const r = await Restaurant.findOne({ owner: req.user._id }).select('_id');
    if (r && String(r._id) === String(order.restaurant._id)) return order;
  }
  return null;
}

router.get('/:id', async (req, res) => {
  const order = await loadAccessibleOrder(req);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  res.json(order);
});

// Owner: advance status
router.patch('/:id/status', requireRole('owner'), async (req, res) => {
  const { status } = req.body;
  const order = await loadAccessibleOrder(req);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (!NEXT[order.status]?.includes(status)) {
    return res.status(400).json({ message: `Cannot change status from ${order.status} to ${status}` });
  }
  order.status = status;
  order.statusHistory.push({ status });
  await order.save();
  emitOrder('order:updated', order);
  res.json(order);
});

// Customer: cancel while still just placed
router.patch('/:id/cancel', async (req, res) => {
  const order = await loadAccessibleOrder(req);
  if (!order || String(order.user._id) !== String(req.user._id)) {
    return res.status(404).json({ message: 'Order not found' });
  }
  if (order.status !== 'placed') {
    return res.status(400).json({ message: 'Order can no longer be cancelled' });
  }
  order.status = 'cancelled';
  order.statusHistory.push({ status: 'cancelled' });
  await order.save();
  emitOrder('order:updated', order);
  res.json(order);
});

export default router;
