import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('glowher_user')); } catch { return null; }
  });
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    const { accessToken, refreshToken, user: u } = data.data;
    localStorage.setItem('glowher_access_token', accessToken);
    localStorage.setItem('glowher_refresh_token', refreshToken);
    localStorage.setItem('glowher_user', JSON.stringify(u));
    setUser(u);
    return u;
  };

  const register = async (fields) => {
    const { data } = await api.post('/auth/register', fields);
    if (!data?.success) {
      const err = new Error(data?.message || 'Registration failed');
      err.response = { data };
      throw err;
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('glowher_access_token');
    localStorage.removeItem('glowher_refresh_token');
    localStorage.removeItem('glowher_user');
    setUser(null);
  };

  const updateUser = (u) => {
    setUser(u);
    localStorage.setItem('glowher_user', JSON.stringify(u));
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
