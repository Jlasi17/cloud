import axios from 'axios';
import { API_BASE_URL, endpoints } from '../config/api';

// Create a separate instance for refresh token requests
const refreshApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create main API instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Export the refresh token function using the separate instance
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return null;
    }

    const response = await refreshApi.post(endpoints.auth.refresh, {
      refreshToken,
    });

    if (response.data?.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      return response.data.token;
    }
    return null;
  } catch (error) {
    console.error('Token refresh failed:', error);
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    return null;
  }
};

// Add a request interceptor to add the token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      originalRequest._retry = true;
      isRefreshing = true;
      
      try {
        const token = await refreshToken();
        isRefreshing = false;
        
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          processQueue(null, token);
          return api(originalRequest);
        } else {
          processQueue(new Error('Failed to refresh token'));
          // If refresh fails, clear localStorage and show error
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login'; // Redirect to login
          return Promise.reject({
            ...error,
            isTokenExpired: true
          });
        }
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError);
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login'; // Redirect to login
        return Promise.reject({
          ...error,
          isTokenExpired: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export const axiosInstance = api;
