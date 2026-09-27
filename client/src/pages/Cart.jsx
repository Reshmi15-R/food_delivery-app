import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import QtyControl from '../components/QtyControl';
import { money } from '../utils';

export default function Cart() {
  const { cart, setQuantity, clearCart, subtotal } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!cart.items.length) {
    return (
      <div className="center">
        <h2>Your cart is empty</h2>
        <Link to="/" className="btn">Browse restaurants</Link>
      </div>
    );
  }

  const { restaurant } = cart;
  const belowMin = subtotal < (restaurant.minOrder || 0);
  const checkout = () => (user ? navigate('/checkout') : navigate('/login', { state: { from: '/checkout' } }));

  return (
    <div className="narrow">
      <div className="row-between">
        <h1>Cart</h1>
        <button className="btn btn-ghost btn-sm" onClick={clearCart}>Clear cart</button>
      </div>
      <p className="muted">
        From <Link to={`/restaurants/${restaurant._id}`}>{restaurant.name}</Link>
      </p>
      <div className="card card-body">
        {cart.items.map((i) => (
          <div key={i._id} className="cart-row">
            <span>
              <span className={`veg-mark ${i.isVeg ? 'veg' : 'nonveg'}`} /> {i.name}
            </span>
            <QtyControl qty={i.quantity} onChange={(q) => setQuantity(i._id, q)} />
            <span className="amount">{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <hr />
        <div className="row-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="row-between muted"><span>Delivery fee</span><span>{money(restaurant.deliveryFee)}</span></div>
        <div className="row-between total"><span>Total</span><span>{money(subtotal + restaurant.deliveryFee)}</span></div>
      </div>
      {belowMin && <p className="error">Add {money(restaurant.minOrder - subtotal)} more to reach the minimum order.</p>}
      <button className="btn btn-block" disabled={belowMin} onClick={checkout}>
        {user ? 'Proceed to checkout' : 'Log in to checkout'}
      </button>
    </div>
  );
}
