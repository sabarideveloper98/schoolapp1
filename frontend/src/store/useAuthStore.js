import { create } from 'zustand';
import axios from 'axios';

const getInitialUser = () => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed) return null;
    if (parsed.user && parsed.token) {
      return { ...parsed.user, token: parsed.token, refreshToken: parsed.refreshToken };
    }
    return parsed;
  } catch (e) {
    return null;
  }
};

const useAuthStore = create((set) => ({
  user: getInitialUser(),
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await axios.post('/api/auth/login', credentials);
      const userData = data.user 
        ? { ...data.user, token: data.token, refreshToken: data.refreshToken } 
        : data;
      localStorage.setItem('user', JSON.stringify(userData));
      set({ user: userData, isLoading: false });
      return userData;
    } catch (error) {
      set({ error: error.response?.data?.message || 'Login failed', isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('user');
    set({ user: null });
  },
}));

export default useAuthStore;
