const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';

// Ensure we're using the correct port
console.log('Using API URL:', API_BASE_URL);

export const api = {
  auth: {
    login: `${API_BASE_URL}/api/auth/login`,
    register: `${API_BASE_URL}/api/auth/register`,
  },
  donations: {
    create: `${API_BASE_URL}/api/donations`,
    list: `${API_BASE_URL}/api/donations`,
    myDonations: `${API_BASE_URL}/api/donations/my-donations`,
  },
  requests: {
    create: `${API_BASE_URL}/api/requests`,
    list: `${API_BASE_URL}/api/requests`,
    myRequests: `${API_BASE_URL}/api/requests/my-requests`,
  },
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the token to requests
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
