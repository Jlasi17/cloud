export const API_BASE_URL = 'http://localhost:5002';

export const endpoints = {
  auth: {
    signup: `${API_BASE_URL}/api/auth/signup`,
    login: `${API_BASE_URL}/api/auth/login`,
    refresh: `${API_BASE_URL}/api/auth/refresh`,
  },
  donations: {
    create: `${API_BASE_URL}/api/donations`,
    list: `${API_BASE_URL}/api/donations`,
    myDonations: `${API_BASE_URL}/api/donations/my-donations`,
    delete: (id) => `${API_BASE_URL}/api/donations/${id}`,
  },
  requests: {
    create: `${API_BASE_URL}/api/requests`,
    list: `${API_BASE_URL}/api/requests/my-requests`,
    delete: (id) => `${API_BASE_URL}/api/requests/${id}`,
  },
  matches: {
    getRequestMatches: `${API_BASE_URL}/api/matches/request/`,
    createMatch: `${API_BASE_URL}/api/matches/create`,
    getDeliveryMatches: `${API_BASE_URL}/api/matches/delivery`,
    acceptMatch: `${API_BASE_URL}/api/matches/accept`,
    updateStatus: `${API_BASE_URL}/api/matches/status`,
  },
};
