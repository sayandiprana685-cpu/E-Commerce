import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    try {
      const res = await api.get('/cart');
      setItems(res.data.data.cart.items);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const addToCart = useCallback(async (productId, quantity = 1, variantSelection = {}) => {
    setLoading(true);
    try {
      const res = await api.post('/cart', { productId, quantity, variantSelection });
      setItems(res.data.data.cart.items);
      return res.data;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQuantity = useCallback(async (itemId, quantity) => {
    const res = await api.put(`/cart/${itemId}`, { quantity });
    setItems(res.data.data.cart.items);
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const res = await api.delete(`/cart/${itemId}`);
    setItems(res.data.data.cart.items);
  }, []);

  const clear = useCallback(async () => {
    await api.delete('/cart');
    setItems([]);
  }, []);

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const itemsTotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, totalItems, itemsTotal, loading, addToCart, updateQuantity, removeItem, clear, refreshCart: fetchCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
