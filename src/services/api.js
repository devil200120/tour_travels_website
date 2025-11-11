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
    const response = await api.post('/admin/auth/login', { email, password });
    return response.data;
  },
  
  getProfile: async () => {
    const response = await api.get('/admin/auth/profile');
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/admin/auth/logout');
    return response.data;
  }
};

// Bookings API
export const bookingsService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/bookings', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/admin/bookings/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/admin/bookings', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/bookings/${id}`, data);
    return response.data;
  },
  
  assign: async (id, driverId, vehicleId) => {
    const response = await api.post(`/admin/bookings/${id}/assign`, { driverId, vehicleId });
    return response.data;
  },
  
  cancel: async (id, reason, refundAmount) => {
    const response = await api.post(`/admin/bookings/${id}/cancel`, { reason, refundAmount });
    return response.data;
  },
  
  getStats: async () => {
    const response = await api.get('/admin/bookings/stats/dashboard');
    return response.data;
  }
};

// Drivers API
export const driversService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/drivers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/admin/drivers/${id}`);
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/admin/drivers', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/drivers/${id}`, data);
    return response.data;
  },
  
  updateKyc: async (id, kycStatus, notes) => {
    const response = await api.put(`/admin/drivers/${id}/kyc`, { kycStatus, notes });
    return response.data;
  },
  
  getPerformance: async (id, params = {}) => {
    const response = await api.get(`/admin/drivers/${id}/performance`, { params });
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/admin/drivers/stats/overview');
    return response.data;
  },

  toggleAvailability: async (id, isAvailable, reason) => {
    const response = await api.put(`/admin/drivers/${id}/availability`, { isAvailable, reason });
    return response.data;
  },

  updateLocation: async (id, latitude, longitude, address) => {
    const response = await api.put(`/admin/drivers/${id}/location`, { latitude, longitude, address });
    return response.data;
  },

  getNearby: async (latitude, longitude, radius = 10) => {
    const response = await api.get('/admin/drivers/available/nearby', { 
      params: { latitude, longitude, radius } 
    });
    return response.data;
  },

  autoAssign: async (bookingId, preferredDriverId, maxRadius = 10) => {
    const response = await api.post('/admin/drivers/auto-assign', { 
      bookingId, preferredDriverId, maxRadius 
    });
    return response.data;
  },

  updateEarnings: async (id, amount, type, description, bookingId) => {
    const response = await api.put(`/admin/drivers/${id}/earnings`, { 
      amount, type, description, bookingId 
    });
    return response.data;
  },

  getOrders: async (id, params = {}) => {
    const response = await api.get(`/admin/drivers/${id}/orders`, { params });
    return response.data;
  },

  getEarningsHistory: async (id, params = {}) => {
    const response = await api.get(`/admin/drivers/${id}/earnings/history`, { params });
    return response.data;
  },

  getDashboard: async (id) => {
    const response = await api.get(`/admin/drivers/${id}/dashboard`);
    return response.data;
  }
};

// Vehicles API
export const vehiclesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/vehicles', { params });
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/admin/vehicles', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/vehicles/${id}`, data);
    return response.data;
  }
};

// Customers API
export const customersService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/users/customers', { params });
    return response.data;
  },
  
  getById: async (id) => {
    const response = await api.get(`/admin/users/customers/${id}`);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/users/customers/${id}`, data);
    return response.data;
  },
  
  getStats: async (id) => {
    const response = await api.get(`/admin/users/customers/${id}/stats`);
    return response.data;
  }
};

// Packages API
export const packagesService = {
  getAll: async (params = {}) => {
    const response = await api.get('/admin/packages', { params });
    return response.data;
  },
  
  create: async (data) => {
    const response = await api.post('/admin/packages', data);
    return response.data;
  },
  
  update: async (id, data) => {
    const response = await api.put(`/admin/packages/${id}`, data);
    return response.data;
  },
  
  calculatePricing: async (id, data) => {
    const response = await api.post(`/admin/packages/${id}/pricing`, data);
    return response.data;
  }
};

// Payments API
export const paymentsService = {
  getDashboard: async () => {
    const response = await api.get('/admin/payments/dashboard');
    return response.data;
  },
  
  processPayment: async (data) => {
    const response = await api.post('/admin/payments/process', data);
    return response.data;
  },
  
  getTransactions: async (params = {}) => {
    const response = await api.get('/admin/payments/transactions', { params });
    return response.data;
  },
  
  settleDriver: async (data) => {
    const response = await api.post('/admin/payments/settle-driver', data);
    return response.data;
  }
};

// Reports API
export const reportsService = {
  getTripReports: async (params = {}) => {
    const response = await api.get('/admin/reports/trips', { params });
    return response.data;
  },
  
  getRevenueReports: async (params = {}) => {
    const response = await api.get('/admin/reports/revenue', { params });
    return response.data;
  },
  
  getCustomerAnalytics: async () => {
    const response = await api.get('/admin/reports/customers');
    return response.data;
  },
  
  getDriverReports: async (params = {}) => {
    const response = await api.get('/admin/reports/drivers', { params });
    return response.data;
  },
  
  getVehicleReports: async (params = {}) => {
    const response = await api.get('/admin/reports/vehicles', { params });
    return response.data;
  }
};

// Settings API
export const settingsService = {
  getAll: async () => {
    const response = await api.get('/admin/settings');
    return response.data;
  },
  
  updateGeneral: async (data) => {
    const response = await api.put('/admin/settings/general', data);
    return response.data;
  },
  
  getCities: async () => {
    const response = await api.get('/admin/settings/cities');
    return response.data;
  },
  
  addCity: async (data) => {
    const response = await api.post('/admin/settings/cities', data);
    return response.data;
  },
  
  updatePricing: async (data) => {
    const response = await api.put('/admin/settings/pricing', data);
    return response.data;
  }
};

export default api;