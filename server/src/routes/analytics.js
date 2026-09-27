import { Router } from 'express';
import Order from '../models/Order.js';
import Restaurant from '../models/Restaurant.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('owner'));

router.get('/', async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!restaurant) return res.status(400).json({ message: 'Create your restaurant profile first' });

  const days = Math.min(Math.max(parseInt(req.query.days) || 7, 1), 365);
  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (days - 1));

  const match = { restaurant: restaurant._id, createdAt: { $gte: since } };
  const completed = { ...match, status: { $ne: 'cancelled' } };
  const tz = req.query.tz || 'UTC';

  const [summary, byStatus, daily, topItems] = await Promise.all([
    Order.aggregate([
      { $match: completed },
      { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 }, avg: { $avg: '$total' } } },
    ]),
    Order.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: completed },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: tz } },
          revenue: { $sum: '$total' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Order.aggregate([
      { $match: completed },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.name',
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        },
      },
      { $sort: { quantity: -1 } },
      { $limit: 5 },
    ]),
  ]);

  // Fill in days with no orders so the chart has a continuous axis
  const dailyMap = new Map(daily.map((d) => [d._id, d]));
  const series = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toLocaleDateString('en-CA', { timeZone: tz });
    series.push({ date: key, revenue: dailyMap.get(key)?.revenue || 0, orders: dailyMap.get(key)?.orders || 0 });
  }

  res.json({
    revenue: summary[0]?.revenue || 0,
    orders: summary[0]?.orders || 0,
    avgOrderValue: Math.round(summary[0]?.avg || 0),
    byStatus: Object.fromEntries(byStatus.map((s) => [s._id, s.count])),
    daily: series,
    topItems: topItems.map((t) => ({ name: t._id, quantity: t.quantity, revenue: t.revenue })),
  });
});

export default router;
