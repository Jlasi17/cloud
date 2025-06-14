// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002';
export const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5002';

export const endpoints = {
  auth: {
    signup: `${API_BASE_URL}/api/auth/signup`,
    login: `${API_BASE_URL}/api/auth/login`,
    refresh: `${API_BASE_URL}/api/auth/refresh`,
    profile: `${API_BASE_URL}/api/auth/profile`,
    updateProfile: `${API_BASE_URL}/api/auth/profile/update`,
  },
  donations: {
    create: `${API_BASE_URL}/api/donations`,
    list: `${API_BASE_URL}/api/donations`,
    myDonations: `${API_BASE_URL}/api/donations/my-donations`,
    delete: (id) => `${API_BASE_URL}/api/donations/${id}`,
    update: (id) => `${API_BASE_URL}/api/donations/${id}`,
    get: (id) => `${API_BASE_URL}/api/donations/${id}`,
    calculatePrice: `${API_BASE_URL}/api/donations/calculate-price`,
  },
  requests: {
    create: `${API_BASE_URL}/api/requests`,
    list: `${API_BASE_URL}/api/requests/my-requests`,
    delete: (id) => `${API_BASE_URL}/api/requests/${id}`,
    update: (id) => `${API_BASE_URL}/api/requests/${id}`,
    matches: (requestId) => `${API_BASE_URL}/api/matches/request/${requestId}`,
  },
  transactions: {
    create: `${API_BASE_URL}/api/transactions`,
    list: `${API_BASE_URL}/api/transactions`,
    get: (id) => `${API_BASE_URL}/api/transactions/${id}`,
    update: (id) => `${API_BASE_URL}/api/transactions/${id}`,
  },
  matches: {
    getRequestMatches: `${API_BASE_URL}/api/matches/request`,
    createMatch: `${API_BASE_URL}/api/matches/create`,
    getDeliveryMatches: `${API_BASE_URL}/api/matches/delivery`,
    acceptMatch: `${API_BASE_URL}/api/matches/accept`,
    updateStatus: `${API_BASE_URL}/api/matches/status`,
  },
  delivery: {
    profile: `${API_BASE_URL}/api/delivery/profile`,
    updateProfile: `${API_BASE_URL}/api/delivery/profile`,
    location: `${API_BASE_URL}/api/delivery/location`,
    requestResponse: `${API_BASE_URL}/api/delivery/request-response`,
    pendingRequests: `${API_BASE_URL}/api/delivery/pending-requests`,
    updateStatus: `${API_BASE_URL}/api/delivery/update-status`,
    matches: `${API_BASE_URL}/api/matches/delivery`,
  },
};
