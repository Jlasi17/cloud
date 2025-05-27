import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { axiosInstance } from '../utils/axios';
import { endpoints } from '../config/api';

const AuthContext = createContext(null);

export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    // Create a new axios instance for refresh to avoid circular dependency
    const refreshApi = axios.create({
      baseURL: endpoints.auth.refresh,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const response = await refreshApi.post(endpoints.auth.refresh, {
      refreshToken,
    });

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data.token;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      setUser(JSON.parse(localStorage.getItem('user')));
    }
    setLoading(false);
  }, []);

  const signup = async (userData) => {
    try {
      const response = await axiosInstance.post(endpoints.auth.signup, userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      setUser(response.data.user);
      return response.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error.response?.data?.message || 'Signup failed';
    }
  };

  const login = async (credentials) => {
    try {
      const response = await axiosInstance.post(endpoints.auth.login, credentials);
      const userData = { ...response.data.user, role: credentials.role || 'user' };
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error.response?.data?.message || 'Login failed';
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const value = {
    user,
    loading,
    signup,
    login,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
