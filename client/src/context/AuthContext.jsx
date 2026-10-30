import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('rescueroute_token') || null);
  const [role, setRole] = useState(localStorage.getItem('rescueroute_demo_role') || 'ambulance');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('rescueroute_token');
      const storedUser = localStorage.getItem('rescueroute_user');
      const storedRole = localStorage.getItem('rescueroute_demo_role');

      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {}
      }

      if (storedRole) {
        setRole(storedRole);
      }

      if (storedToken) {
        setToken(storedToken);
        try {
          const res = await api.getMe();
          if (res.success && res.user) {
            setUser(res.user);
            setRole(res.user.role);
            localStorage.setItem('rescueroute_user', JSON.stringify(res.user));
            localStorage.setItem('rescueroute_demo_role', res.user.role);
          }
        } catch (err) {
          console.warn('Token validation skipped or offline mode');
        }
      } else {
        // Set default demo user for seamless hackathon testing
        handleDemoLogin('ambulance', false);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    if (res.success) {
      setToken(res.token);
      setUser(res.user);
      setRole(res.user.role);
      localStorage.setItem('rescueroute_token', res.token);
      localStorage.setItem('rescueroute_user', JSON.stringify(res.user));
      localStorage.setItem('rescueroute_demo_role', res.user.role);
    }
    return res;
  };

  const handleDemoLogin = async (targetRole = 'ambulance', persist = true) => {
    try {
      const res = await api.demoLogin(targetRole);
      if (res.success) {
        setToken(res.token);
        setUser(res.user);
        setRole(res.user.role);
        if (persist) {
          localStorage.setItem('rescueroute_token', res.token);
          localStorage.setItem('rescueroute_user', JSON.stringify(res.user));
          localStorage.setItem('rescueroute_demo_role', res.user.role);
        }
        return res;
      }
    } catch (err) {
      // Offline fallback state
      const mockUser = {
        name: `Demo ${targetRole.replace('_', ' ').toUpperCase()} Responder`,
        email: `${targetRole}@rescueroute.ai`,
        role: targetRole,
        organization: 'Emergency Operations Command'
      };
      setUser(mockUser);
      setRole(targetRole);
      if (persist) {
        localStorage.setItem('rescueroute_demo_role', targetRole);
        localStorage.setItem('rescueroute_user', JSON.stringify(mockUser));
      }
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('rescueroute_token');
    localStorage.removeItem('rescueroute_user');
    localStorage.removeItem('rescueroute_demo_role');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isAuthenticated: !!user,
        loading,
        login,
        demoLogin: handleDemoLogin,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
