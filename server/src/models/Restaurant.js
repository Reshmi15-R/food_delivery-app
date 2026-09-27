import mongoose from 'mongoose';

const restaurantSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    name: { type: String, required: true, trim: true },
    description: String,
    cuisines: [String],
    address: String,
    city: String,
    phone: String,
    image: String,
    rating: { type: Number, default: 4, min: 0, max: 5 },
    deliveryTime: { type: Number, default: 30 }, // minutes
    deliveryFee: { type: Number, default: 30 },
    minOrder: { type: Number, default: 0 },
    isOpen: { type: Boolean, default: true },
  },
  { timestamps: true }
);

restaurantSchema.index({ name: 'text', cuisines: 'text', description: 'text' });

export default mongoose.model('Restaurant', restaurantSchema);
