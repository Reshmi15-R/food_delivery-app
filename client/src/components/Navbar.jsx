import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { count } = useCart();
  const navigate = useNavigate();
  const isOwner = user?.role === 'owner';

  const onLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="navbar">
      <div className="container nav-inner">
        <Link to={isOwner ? '/owner' : '/'} className="brand">
          🍔 FoodDash{isOwner && <span className="badge">Partner</span>}
        </Link>
        <nav className="nav-links">
          {isOwner ? (
            <>
              <NavLink to="/owner" end>Dashboard</NavLink>
              <NavLink to="/owner/orders">Orders</NavLink>
              <NavLink to="/owner/menu">Menu</NavLink>
              <NavLink to="/owner/restaurant">Restaurant</NavLink>
            </>
          ) : (
            <>
              <NavLink to="/" end>Restaurants</NavLink>
              {user && <NavLink to="/orders">Orders</NavLink>}
              <NavLink to="/cart" className="cart-link">
                Cart{count > 0 && <span className="pill">{count}</span>}
              </NavLink>
            </>
          )}
          {user ? (
            <>
              <NavLink to="/profile">{user.name.split(' ')[0]}</NavLink>
              <button className="btn btn-ghost btn-sm" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <NavLink to="/login">Log in</NavLink>
              <Link to="/register" className="btn btn-sm">Sign up</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
