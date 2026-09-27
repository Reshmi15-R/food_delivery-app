import { createContext, useContext, useEffect, useState } from 'react';

const CartContext = createContext(null);
const EMPTY = { restaurant: null, items: [] };

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem('cart')) || EMPTY;
  } catch {
    return EMPTY;
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadCart);

  useEffect(() => localStorage.setItem('cart', JSON.stringify(cart)), [cart]);

  const slimRestaurant = (r) => ({ _id: r._id, name: r.name, deliveryFee: r.deliveryFee, minOrder: r.minOrder });

  // Returns false if the user declined to replace a cart from another restaurant
  const addItem = (restaurant, item) => {
    if (cart.restaurant && cart.restaurant._id !== restaurant._id) {
      if (!window.confirm(`Your cart has items from ${cart.restaurant.name}. Start a new cart from ${restaurant.name}?`)) {
        return false;
      }
      setCart({ restaurant: slimRestaurant(restaurant), items: [{ ...pickItem(item), quantity: 1 }] });
      return true;
    }
    setCart((c) => {
      const existing = c.items.find((i) => i._id === item._id);
      const items = existing
        ? c.items.map((i) => (i._id === item._id ? { ...i, quantity: i.quantity + 1 } : i))
        : [...c.items, { ...pickItem(item), quantity: 1 }];
      return { restaurant: slimRestaurant(restaurant), items };
    });
    return true;
  };

  const setQuantity = (id, quantity) =>
    setCart((c) => {
      const items = quantity <= 0 ? c.items.filter((i) => i._id !== id) : c.items.map((i) => (i._id === id ? { ...i, quantity } : i));
      return items.length ? { ...c, items } : EMPTY;
    });

  const replaceCart = (restaurant, items) => setCart({ restaurant: slimRestaurant(restaurant), items });
  const clearCart = () => setCart(EMPTY);

  const count = cart.items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = cart.items.reduce((s, i) => s + i.price * i.quantity, 0);
  const qtyOf = (id) => cart.items.find((i) => i._id === id)?.quantity || 0;

  return (
    <CartContext.Provider value={{ cart, addItem, setQuantity, replaceCart, clearCart, count, subtotal, qtyOf }}>
      {children}
    </CartContext.Provider>
  );
}

const pickItem = ({ _id, name, price, isVeg }) => ({ _id, name, price, isVeg });

export const useCart = () => useContext(CartContext);
