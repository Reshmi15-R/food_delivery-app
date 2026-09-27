import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { STATUS_LABEL } from '../utils';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const toast = (text) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  useEffect(() => {
    if (!token) return;
    const s = io({ auth: { token } });
    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
    };
  }, [token]);

  // Global notifications
  useEffect(() => {
    if (!socket || !user) return;
    const onNew = (o) => user.role === 'owner' && toast(`New order from ${o.user?.name || 'a customer'} · #${o._id.slice(-6)}`);
    const onUpdate = (o) =>
      user.role === 'customer' && toast(`Order #${o._id.slice(-6)} from ${o.restaurant?.name}: ${STATUS_LABEL[o.status]}`);
    socket.on('order:new', onNew);
    socket.on('order:updated', onUpdate);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:updated', onUpdate);
    };
  }, [socket, user]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className="toast">
            {t.text}
          </div>
        ))}
      </div>
    </SocketContext.Provider>
  );
}

// Subscribe to a socket event for the lifetime of the component
export function useSocketEvent(event, handler) {
  const socket = useContext(SocketContext);
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    if (!socket) return;
    const fn = (...args) => ref.current(...args);
    socket.on(event, fn);
    return () => socket.off(event, fn);
  }, [socket, event]);
}
