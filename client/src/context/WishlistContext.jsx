import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import api from '../services/api';

const WishlistContext = createContext(null);

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [ids, setIds] = useState([]);

  const fetchWishlist = useCallback(async () => {
    if (!user) {
      setIds([]);
      return;
    }
    try {
      const res = await api.get('/wishlist');
      setIds(res.data.data.ids);
    } catch {
      /* ignore */
    }
  }, [user]);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  const toggle = useCallback(async (productId) => {
    const res = await api.post('/wishlist', { productId });
    setIds((prev) => (res.data.data.inWishlist ? [...prev, String(productId)] : prev.filter((id) => id !== String(productId))));
    return res.data;
  }, []);

  const inWishlist = useCallback((productId) => ids.includes(String(productId)), [ids]);

  return (
    <WishlistContext.Provider value={{ ids, toggle, inWishlist, refreshWishlist: fetchWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error('useWishlist must be used within WishlistProvider');
  return ctx;
};
