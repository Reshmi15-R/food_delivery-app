import { Router } from 'express';
import { protect } from '../middleware/auth.js';
import User from '../models/User.js';

const router = Router();
router.use(protect);

router.put('/profile', async (req, res) => {
  const { name, phone, currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id).select('+password');
  if (name) user.name = name;
  if (phone !== undefined) user.phone = phone;
  if (newPassword) {
    if (!(await user.matchPassword(currentPassword || ''))) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }
    if (newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
    user.password = newPassword;
  }
  await user.save();
  user.password = undefined;
  res.json(user);
});

router.post('/addresses', async (req, res) => {
  const { label, line1, city, pincode, phone } = req.body;
  if (!line1 || !city || !pincode) return res.status(400).json({ message: 'Address, city and pincode are required' });
  req.user.addresses.push({ label, line1, city, pincode, phone });
  await req.user.save();
  res.status(201).json(req.user.addresses);
});

router.put('/addresses/:id', async (req, res) => {
  const addr = req.user.addresses.id(req.params.id);
  if (!addr) return res.status(404).json({ message: 'Address not found' });
  const { label, line1, city, pincode, phone } = req.body;
  Object.assign(addr, { label, line1, city, pincode, phone });
  await req.user.save();
  res.json(req.user.addresses);
});

router.delete('/addresses/:id', async (req, res) => {
  req.user.addresses.pull(req.params.id);
  await req.user.save();
  res.json(req.user.addresses);
});

export default router;
