import { Router } from 'express';
import MenuItem from '../models/MenuItem.js';
import Restaurant from '../models/Restaurant.js';
import { protect, requireRole } from '../middleware/auth.js';

const router = Router();
router.use(protect, requireRole('owner'));

const FIELDS = ['name', 'description', 'price', 'category', 'image', 'isVeg', 'isAvailable'];
const pick = (body) => Object.fromEntries(FIELDS.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

// Loads the owner's restaurant into req.restaurant or rejects.
router.use(async (req, res, next) => {
  req.restaurant = await Restaurant.findOne({ owner: req.user._id });
  if (!req.restaurant) return res.status(400).json({ message: 'Create your restaurant profile first' });
  next();
});

router.get('/', async (req, res) => {
  res.json(await MenuItem.find({ restaurant: req.restaurant._id }).sort({ category: 1, name: 1 }));
});

router.post('/', async (req, res) => {
  const { name, price, category } = req.body;
  if (!name || price === undefined || price === '' || !category) {
    return res.status(400).json({ message: 'Name, price and category are required' });
  }
  res.status(201).json(await MenuItem.create({ ...pick(req.body), restaurant: req.restaurant._id }));
});

router.put('/:id', async (req, res) => {
  const item = await MenuItem.findOneAndUpdate({ _id: req.params.id, restaurant: req.restaurant._id }, pick(req.body), {
    new: true,
    runValidators: true,
  });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json(item);
});

router.delete('/:id', async (req, res) => {
  const item = await MenuItem.findOneAndDelete({ _id: req.params.id, restaurant: req.restaurant._id });
  if (!item) return res.status(404).json({ message: 'Item not found' });
  res.json({ message: 'Deleted' });
});

export default router;
