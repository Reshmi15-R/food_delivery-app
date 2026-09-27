// Seeds demo users, restaurants and menus. Run with: npm run seed
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from './models/User.js';
import Restaurant from './models/Restaurant.js';
import MenuItem from './models/MenuItem.js';
import Order from './models/Order.js';

dotenv.config({ quiet: true });

const img = (id) => `https://images.unsplash.com/${id}?w=800&q=70&auto=format&fit=crop`;

const data = [
  {
    owner: { name: 'Arjun Mehta', email: 'owner1@demo.com' },
    restaurant: {
      name: 'Spice Route', description: 'North Indian curries, tandoor and biryani.',
      cuisines: ['North Indian', 'Biryani'], city: 'Bengaluru', address: '12 MG Road',
      image: img('photo-1585937421612-70a008356fbe'), rating: 4.5, deliveryTime: 35, deliveryFee: 30, minOrder: 150,
    },
    menu: [
      ['Paneer Tikka', 'Starters', 240, true, 'Chargrilled cottage cheese with peppers'],
      ['Chicken 65', 'Starters', 260, false, 'Spicy fried chicken bites'],
      ['Butter Chicken', 'Main Course', 340, false, 'Creamy tomato gravy'],
      ['Dal Makhani', 'Main Course', 220, true, 'Slow-cooked black lentils'],
      ['Chicken Biryani', 'Biryani', 320, false, 'Hyderabadi dum biryani'],
      ['Veg Biryani', 'Biryani', 250, true, 'Fragrant basmati with vegetables'],
      ['Butter Naan', 'Breads', 50, true, 'Soft tandoor bread'],
      ['Gulab Jamun', 'Desserts', 90, true, 'Two pieces, warm'],
    ],
  },
  {
    owner: { name: 'Sofia Rossi', email: 'owner2@demo.com' },
    restaurant: {
      name: 'Napoli Slice', description: 'Wood-fired pizzas and fresh pasta.',
      cuisines: ['Italian', 'Pizza'], city: 'Bengaluru', address: '5 Indiranagar 100ft Rd',
      image: img('photo-1513104890138-7c749659a591'), rating: 4.3, deliveryTime: 30, deliveryFee: 40, minOrder: 200,
    },
    menu: [
      ['Margherita', 'Pizza', 299, true, 'Tomato, mozzarella, basil'],
      ['Pepperoni', 'Pizza', 399, false, 'Classic pepperoni'],
      ['Farmhouse', 'Pizza', 349, true, 'Peppers, onion, mushroom, olives'],
      ['Penne Arrabbiata', 'Pasta', 279, true, 'Spicy tomato sauce'],
      ['Chicken Alfredo', 'Pasta', 329, false, 'Creamy parmesan sauce'],
      ['Garlic Bread', 'Sides', 129, true, 'With cheese dip'],
      ['Tiramisu', 'Desserts', 199, true, 'Coffee-soaked classic'],
    ],
  },
  {
    owner: { name: 'Kenji Tanaka', email: 'owner3@demo.com' },
    restaurant: {
      name: 'Wok & Roll', description: 'Chinese, Thai and sushi bowls.',
      cuisines: ['Chinese', 'Asian'], city: 'Bengaluru', address: '44 Koramangala 5th Block',
      image: img('photo-1563245372-f21724e3856d'), rating: 4.1, deliveryTime: 25, deliveryFee: 25, minOrder: 100,
    },
    menu: [
      ['Veg Spring Rolls', 'Starters', 180, true, 'Crispy rolls with sweet chilli'],
      ['Chilli Chicken', 'Starters', 260, false, 'Indo-Chinese favourite'],
      ['Hakka Noodles', 'Noodles & Rice', 200, true, 'Wok-tossed noodles'],
      ['Chicken Fried Rice', 'Noodles & Rice', 230, false, 'With egg and scallions'],
      ['Thai Green Curry', 'Mains', 290, true, 'With jasmine rice'],
      ['Salmon Sushi Roll', 'Sushi', 420, false, '8 pieces'],
    ],
  },
  {
    owner: { name: 'Priya Nair', email: 'owner4@demo.com' },
    restaurant: {
      name: 'Green Bowl', description: 'Healthy salads, bowls and smoothies. 100% vegetarian.',
      cuisines: ['Healthy', 'Salads'], city: 'Bengaluru', address: '8 HSR Layout',
      image: img('photo-1512621776951-a57141f2eefd'), rating: 4.6, deliveryTime: 20, deliveryFee: 20, minOrder: 0,
    },
    menu: [
      ['Quinoa Power Bowl', 'Bowls', 280, true, 'Quinoa, chickpeas, avocado'],
      ['Greek Salad', 'Salads', 220, true, 'Feta, olives, cucumber'],
      ['Caesar Salad', 'Salads', 240, true, 'Parmesan and croutons'],
      ['Mango Smoothie', 'Drinks', 150, true, 'Fresh alphonso mango'],
      ['Berry Blast', 'Drinks', 170, true, 'Mixed berries and yogurt'],
    ],
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { dbName: 'food-app' });
  const emails = [...data.map((d) => d.owner.email), 'customer@demo.com'];
  const oldOwners = await User.find({ email: { $in: emails } }).select('_id');
  const oldRestaurants = await Restaurant.find({ owner: { $in: oldOwners } }).select('_id');
  await MenuItem.deleteMany({ restaurant: { $in: oldRestaurants } });
  await Order.deleteMany({ $or: [{ restaurant: { $in: oldRestaurants } }, { user: { $in: oldOwners } }] });
  await Restaurant.deleteMany({ _id: { $in: oldRestaurants } });
  await User.deleteMany({ email: { $in: emails } });

  for (const d of data) {
    const owner = await User.create({ ...d.owner, password: 'password123', role: 'owner' });
    const r = await Restaurant.create({ ...d.restaurant, owner: owner._id });
    await MenuItem.insertMany(
      d.menu.map(([name, category, price, isVeg, description]) => ({ restaurant: r._id, name, category, price, isVeg, description }))
    );
  }
  await User.create({
    name: 'Demo Customer', email: 'customer@demo.com', password: 'password123', role: 'customer',
    addresses: [{ label: 'Home', line1: '221 Residency Road', city: 'Bengaluru', pincode: '560025', phone: '9876543210' }],
  });

  console.log('Seeded. Logins (password: password123):');
  console.log('  customer@demo.com  (customer)');
  data.forEach((d) => console.log(`  ${d.owner.email}  (owner of ${d.restaurant.name})`));
  await mongoose.disconnect();
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
