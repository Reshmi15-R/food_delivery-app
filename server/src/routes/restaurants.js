import { Router } from 'express';
import Restaurant from '../models/Restaurant.js';
import MenuItem from '../models/MenuItem.js';
import { protect, requireRole } from '../middleware/auth.js';
import { joinRestaurantRoom } from '../socket.js';

const router = Router();
const EDITABLE = ['name', 'description', 'cuisines', 'address', 'city', 'phone', 'image', 'deliveryTime', 'deliveryFee', 'minOrder', 'isOpen'];
const pick = (body) => Object.fromEntries(EDITABLE.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));
const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Public: list with search / filter / sort
router.get('/', async (req, res) => {
  const { search, cuisine, city, veg, openNow, sort } = req.query;
  const filter = {};
  if (search) {
    const rx = new RegExp(escapeRegex(search), 'i');
    // Also match restaurants that serve a dish with this name
    const dishRestaurantIds = await MenuItem.distinct('restaurant', { name: rx });
    filter.$or = [{ name: rx }, { cuisines: rx }, { _id: { $in: dishRestaurantIds } }];
  }
  if (cuisine) filter.cuisines = new RegExp(`^${escapeRegex(cuisine)}$`, 'i');
  if (city) filter.city = new RegExp(`^${escapeRegex(city)}$`, 'i');
  if (openNow === 'true') filter.isOpen = true;
  if (veg === 'true') {
    const nonVeg = await MenuItem.distinct('restaurant', { isVeg: false });
    filter._id = { $nin: nonVeg };
  }

  const sorts = {
    rating: { rating: -1 },
    deliveryTime: { deliveryTime: 1 },
    deliveryFee: { deliveryFee: 1 },
    newest: { createdAt: -1 },
  };
  const restaurants = await Restaurant.find(filter).sort(sorts[sort] || { rating: -1 });
  res.json(restaurants);
});

router.get('/cuisines', async (_req, res) => {
  res.json((await Restaurant.distinct('cuisines')).sort());
});

// Owner: own restaurant
router.get('/mine', protect, requireRole('owner'), async (req, res) => {
  const restaurant = await Restaurant.findOne({ owner: req.user._id });
  res.json(restaurant);
});

router.post('/', protect, requireRole('owner'), async (req, res) => {
  if (await Restaurant.exists({ owner: req.user._id })) {
    return res.status(409).json({ message: 'You already have a restaurant' });
  }
  if (!req.body.name) return res.status(400).json({ message: 'Name is required' });
  const restaurant = await Restaurant.create({ ...pick(req.body), owner: req.user._id });
  joinRestaurantRoom(req.user._id, restaurant._id);
  res.status(201).json(restaurant);
});

router.put('/mine', protect, requireRole('owner'), async (req, res) => {
  const restaurant = await Restaurant.findOneAndUpdate({ owner: req.user._id }, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  res.json(restaurant);
});

// Public: single restaurant with its menu
router.get('/:id', async (req, res) => {
  const restaurant = await Restaurant.findById(req.params.id);
  if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
  const menu = await MenuItem.find({ restaurant: restaurant._id }).sort({ category: 1, name: 1 });
  res.json({ restaurant, menu });
});

export default router;
