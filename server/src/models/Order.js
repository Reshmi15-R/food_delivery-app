import mongoose from 'mongoose';

export const ORDER_STATUSES = ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    items: [
      {
        menuItem: { type: mongoose.Schema.Types.ObjectId, ref: 'MenuItem' },
        name: String,
        price: Number,
        quantity: { type: Number, min: 1 },
      },
    ],
    subtotal: Number,
    deliveryFee: Number,
    total: Number,
    address: {
      label: String,
      line1: String,
      city: String,
      pincode: String,
      phone: String,
    },
    paymentMethod: { type: String, enum: ['cod', 'card'], default: 'cod' },
    status: { type: String, enum: ORDER_STATUSES, default: 'placed' },
    statusHistory: [{ status: String, at: { type: Date, default: Date.now } }],
    note: String,
  },
  { timestamps: true }
);

export default mongoose.model('Order', orderSchema);
