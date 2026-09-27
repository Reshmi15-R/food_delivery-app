import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import Restaurant from './models/Restaurant.js';

let io;

export function initSocket(httpServer, clientUrl) {
  io = new Server(httpServer, { cors: { origin: clientUrl } });

  io.use((socket, next) => {
    try {
      const { id, role } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      socket.data.userId = id;
      socket.data.role = role;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', async (socket) => {
    socket.join(`user:${socket.data.userId}`);
    if (socket.data.role === 'owner') {
      const r = await Restaurant.findOne({ owner: socket.data.userId }).select('_id');
      if (r) socket.join(`restaurant:${r._id}`);
    }
  });

  return io;
}

// Notify both the customer and the restaurant about an order change.
export function emitOrder(event, order) {
  if (!io) return;
  const userId = order.user?._id ?? order.user;
  const restId = order.restaurant?._id ?? order.restaurant;
  io.to(`user:${userId}`).to(`restaurant:${restId}`).emit(event, order);
}

// Called after an owner creates their restaurant so live updates start without reconnecting.
export function joinRestaurantRoom(userId, restaurantId) {
  io?.in(`user:${userId}`).socketsJoin(`restaurant:${restaurantId}`);
}
