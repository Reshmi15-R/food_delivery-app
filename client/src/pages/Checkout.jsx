import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import AddressForm from '../components/AddressForm';
import { money } from '../utils';

export default function Checkout() {
  const { user, setUser } = useAuth();
  const { cart, subtotal, clearCart } = useCart();
  const navigate = useNavigate();
  const [addressId, setAddressId] = useState(user.addresses[0]?._id || '');
  const [adding, setAdding] = useState(user.addresses.length === 0);
  const [payment, setPayment] = useState('cod');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [placing, setPlacing] = useState(false);

  if (!cart.items.length) return <Navigate to="/cart" replace />;

  const saveAddress = async (form) => {
    try {
      const { data } = await api.post('/users/addresses', form);
      setUser({ ...user, addresses: data });
      setAddressId(data[data.length - 1]._id);
      setAdding(false);
    } catch (e) {
      setError(errMsg(e));
    }
  };

  const placeOrder = async () => {
    setError('');
    setPlacing(true);
    try {
      const { data } = await api.post('/orders', {
        restaurantId: cart.restaurant._id,
        items: cart.items.map((i) => ({ menuItem: i._id, quantity: i.quantity })),
        addressId,
        paymentMethod: payment,
        note,
      });
      clearCart();
      navigate(`/orders/${data._id}`, { replace: true });
    } catch (e) {
      setError(errMsg(e));
      setPlacing(false);
    }
  };

  return (
    <div className="checkout">
      <div>
        <h1>Checkout</h1>

        <section className="card card-body">
          <h3>Delivery address</h3>
          {user.addresses.map((a) => (
            <label key={a._id} className={`option ${addressId === a._id ? 'selected' : ''}`}>
              <input type="radio" name="address" checked={addressId === a._id} onChange={() => setAddressId(a._id)} />
              <div>
                <strong>{a.label}</strong>
                <div className="muted small">{a.line1}, {a.city} - {a.pincode}{a.phone && ` · ${a.phone}`}</div>
              </div>
            </label>
          ))}
          {adding ? (
            <AddressForm onSubmit={saveAddress} onCancel={user.addresses.length ? () => setAdding(false) : null} />
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setAdding(true)}>+ Add new address</button>
          )}
        </section>

        <section className="card card-body">
          <h3>Payment</h3>
          <label className={`option ${payment === 'cod' ? 'selected' : ''}`}>
            <input type="radio" name="pay" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
            Cash on delivery
          </label>
          <label className={`option ${payment === 'card' ? 'selected' : ''}`}>
            <input type="radio" name="pay" checked={payment === 'card'} onChange={() => setPayment('card')} />
            Card on delivery
          </label>
          <label className="form">
            Note for the restaurant (optional)
            <textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Less spicy, no onions…" />
          </label>
        </section>
      </div>

      <aside className="card card-body summary">
        <h3>{cart.restaurant.name}</h3>
        {cart.items.map((i) => (
          <div key={i._id} className="row-between small">
            <span>{i.quantity} × {i.name}</span>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <hr />
        <div className="row-between"><span>Subtotal</span><span>{money(subtotal)}</span></div>
        <div className="row-between muted"><span>Delivery</span><span>{money(cart.restaurant.deliveryFee)}</span></div>
        <div className="row-between total"><span>Total</span><span>{money(subtotal + cart.restaurant.deliveryFee)}</span></div>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" disabled={!addressId || placing} onClick={placeOrder}>
          {placing ? 'Placing order…' : 'Place order'}
        </button>
      </aside>
    </div>
  );
}
