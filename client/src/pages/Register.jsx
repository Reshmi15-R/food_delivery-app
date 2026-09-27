import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { errMsg } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', role: 'customer' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  if (user) return <Navigate to={user.role === 'owner' ? '/owner' : '/'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await register(form);
      navigate(u.role === 'owner' ? '/owner/restaurant' : location.state?.from || '/', { replace: true });
    } catch (err) {
      setError(errMsg(err));
      setBusy(false);
    }
  };

  return (
    <div className="auth card card-body">
      <h1>Create account</h1>
      <div className="segmented">
        <button type="button" className={form.role === 'customer' ? 'active' : ''} onClick={() => setForm({ ...form, role: 'customer' })}>
          I want to order food
        </button>
        <button type="button" className={form.role === 'owner' ? 'active' : ''} onClick={() => setForm({ ...form, role: 'owner' })}>
          I own a restaurant
        </button>
      </div>
      <form className="form" onSubmit={submit}>
        <label>Full name<input required value={form.name} onChange={set('name')} /></label>
        <label>Email<input type="email" required value={form.email} onChange={set('email')} /></label>
        <label>Phone<input value={form.phone} onChange={set('phone')} /></label>
        <label>Password<input type="password" required minLength={6} value={form.password} onChange={set('password')} /></label>
        {error && <p className="error">{error}</p>}
        <button className="btn btn-block" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p className="muted small">
        Already have an account? <Link to="/login" state={location.state}>Log in</Link>
      </p>
    </div>
  );
}
