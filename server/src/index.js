import dotenv from 'dotenv';
import http from 'http';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import restaurantRoutes from './routes/restaurants.js';
import menuRoutes from './routes/menu.js';
import orderRoutes from './routes/orders.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config({ quiet: true });

const { MONGO_URI, PORT = 5000, CLIENT_URL = 'http://localhost:5173' } = process.env;
if (!MONGO_URI || !process.env.JWT_SECRET) {
  console.error('MONGO_URI and JWT_SECRET must be set in server/.env');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((_req, res) => res.status(404).json({ message: 'Not found' }));

// Express 5 forwards async errors here automatically
app.use((err, _req, res, _next) => {
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  console.error(err);
  res.status(500).json({ message: 'Server error' });
});

const server = http.createServer(app);
initSocket(server, CLIENT_URL);

mongoose
  .connect(MONGO_URI, { dbName: 'food-app' })
  .then(() => {
    console.log('MongoDB connected');
    server.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
