import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    const token = api.getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const userData = await api.get('/auth/me');
      setUser(userData);
    } catch {
      api.clearToken();
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    const data = await api.post('/auth/login', { email, password });
    api.setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(name, email, password) {
    const data = await api.post('/auth/register', { name, email, password });
    api.setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function loginWithGoogle(credential) {
    const data = await api.post('/auth/google', { credential });
    api.setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    api.clearToken();
    setUser(null);
  }


  function updateUser(updates) {
    setUser(prev => ({ ...prev, ...updates }));
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      loginWithGoogle,
      logout,
      updateUser,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
