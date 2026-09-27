import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Restaurant from './pages/Restaurant';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/owner/Dashboard';
import RestaurantProfile from './pages/owner/RestaurantProfile';
import MenuManager from './pages/owner/MenuManager';
import OwnerOrders from './pages/owner/OwnerOrders';

export default function App() {
  const { user, loading } = useAuth();
  if (loading) return <div className="center muted">Loading…</div>;

  return (
    <>
      <Navbar />
      <main className="container">
        <Routes>
          <Route path="/" element={user?.role === 'owner' ? <Navigate to="/owner" /> : <Home />} />
          <Route path="/restaurants/:id" element={<Restaurant />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route element={<ProtectedRoute role="customer" />}>
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/orders" element={<Orders />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path="/orders/:id" element={<OrderDetail />} />
            <Route path="/profile" element={<Profile />} />
          </Route>

          <Route element={<ProtectedRoute role="owner" />}>
            <Route path="/owner" element={<Dashboard />} />
            <Route path="/owner/restaurant" element={<RestaurantProfile />} />
            <Route path="/owner/menu" element={<MenuManager />} />
            <Route path="/owner/orders" element={<OwnerOrders />} />
          </Route>

          <Route path="*" element={<div className="center muted">Page not found</div>} />
        </Routes>
      </main>
    </>
  );
}
