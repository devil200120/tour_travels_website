import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  }
};

// Bookings API
export const bookingsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/bookings', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/bookings', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },
  
  assign: async (id, driverId, vehicleId) => {
    const response = await api.post(`/bookings/${id}/assign`, { driverId, vehicleId });
    return response.data;
  },
  
  cancel: async (id, reason, refundAmount) => {
    const response = await api.post(`/bookings/${id}/cancel`, { reason, refundAmount });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/bookings/stats/dashboard');
    return response.data;
  }
};

// Drivers API
export const driversService = {
  getAll: async (params = {}) => {
    const response = await api.get('/drivers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/drivers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/drivers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/drivers/${id}`, data);
    return response.data;
  },
  
  updateKyc: async (id, kycStatus, notes) => {
    const response = await api.put(`/drivers/${id}/kyc`, { kycStatus, notes });
    return response.data;
  },
  
  getPerformance: async (id, params = {}) => {
    const response = await api.get(`/drivers/${id}/performance`, { params });
    return response.data;
  }
};

// Vehicles API
export const vehiclesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/vehicles', { params });
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/vehicles', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  }
};

// Customers API
export const customersService = {
  getAll: async (params = {}) => {
    const response = await api.get('/users/customers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/users/customers/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/users/customers/${id}`, data);
    return response.data;
  },
  
  getStats: async (id) => {
    const response = await api.get(`/users/customers/${id}/stats`);
    return response.data;
  }
};

// Packages API
export const packagesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/packages', { params });
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/packages', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/packages/${id}`, data);
    return response.data;
  },
  
  calculatePricing: async (id, data) => {
    const response = await api.post(`/packages/${id}/pricing`, data);
    return response.data;
  }
};

// Payments API
export const paymentsService = {
  getDashboard: async () => {
    const response = await api.get('/payments/dashboard');
    return response.data;
  },
  
  processPayment: async (data) => {
    const response = await api.post('/payments/process', data);
    return response.data;
  },
  
  getTransactions: async (params = {}) => {
    const response = await api.get('/payments/transactions', { params });
    return response.data;
  },
  
  settleDriver: async (data) => {
    const response = await api.post('/payments/settle-driver', data);
    return response.data;
  }
};

// Reports API
export const reportsService = {
  getTripReports: async (params = {}) => {
    const response = await api.get('/reports/trips', { params });
    return response.data;
  },
  
  getRevenueReports: async (params = {}) => {
    const response = await api.get('/reports/revenue', { params });
    return response.data;
  },
  
  getCustomerAnalytics: async () => {
    const response = await api.get('/reports/customers');
    return response.data;
  },
  
  getDriverReports: async (params = {}) => {
    const response = await api.get('/reports/drivers', { params });
    return response.data;
  },
  
  getVehicleReports: async (params = {}) => {
    const response = await api.get('/reports/vehicles', { params });
    return response.data;
  }
};

// Settings API
export const settingsService = {
  getAll: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  updateGeneral: async (data) => {
    const response = await api.put('/settings/general', data);
    return response.data;
  },
  
  getCities: async () => {
    const response = await api.get('/settings/cities');
    return response.data;
  },
  
  addCity: async (data) => {
    const response = await api.post('/settings/cities', data);
    return response.data;
  },
  
  updatePricing: async (data) => {
    const response = await api.put('/settings/pricing', data);
    return response.data;
  }
};

export default api;