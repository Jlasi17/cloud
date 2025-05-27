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
  headers: {
    'Content-Type': 'application/json',
  },
});

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

    localStorage.setItem('token', response.data.token);
    localStorage.setItem('refreshToken', response.data.refreshToken);
    return response.data.token;
  } catch (error) {
    console.error('Token refresh failed:', error);
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
      originalRequest._retry = true;
      
      try {
        const token = await refreshToken();
        if (token) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } else {
          // If refresh fails, clear localStorage and show error
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          return Promise.reject({
            ...error,
            isTokenExpired: true
          });
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        return Promise.reject({
          ...error,
          isTokenExpired: true
        });
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
export const axiosInstance = api;
