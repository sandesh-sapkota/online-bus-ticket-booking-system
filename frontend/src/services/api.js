import axios from 'axios';

// Base URL of the NestJS backend. CORS on the server allows http://localhost:5173.
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

// ---- Token / user persistence helpers ----
export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  clearToken: () => localStorage.removeItem(TOKEN_KEY),
  getUser: () => {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },
  setUser: (user) => localStorage.setItem(USER_KEY, JSON.stringify(user)),
  clearUser: () => localStorage.removeItem(USER_KEY),
  clearAll: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  // Backend also sets an httpOnly auth cookie; keep credentials so it can ride along.
  withCredentials: true,
});

// Attach the bearer token (the backend AuthGuard reads "Authorization: Bearer <token>").
api.interceptors.request.use((config) => {
  const token = authStorage.getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On an expired/invalid session, clear local auth and let the app react.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const url = error?.config?.url || '';
    // Don't nuke auth for the login call itself (a 401 there is just bad credentials
    // or a pending email verification).
    const isAuthEndpoint = url.includes('/users/login');
    if (status === 401 && !isAuthEndpoint) {
      authStorage.clearAll();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  },
);

// Normalises an Axios error into a human-readable message.
export const getApiError = (err, fallback = 'Something went wrong. Please try again.') =>
  err?.response?.data?.message || err?.message || fallback;

// ---- User APIs ----
export const userAPI = {
  register: (data) => api.post('/users', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  verifyEmail: (verificationId, data) =>
    api.post(`/users/verifyemails/${verificationId}`, data),
  logout: () => api.post('/users/logout'),
  getDriver: (driverId) => api.get(`/users/drivers/${driverId}`),
};

// ---- Bus APIs ----
export const busAPI = {
  // Public list. Optional filters: { origin, destination, busType, class, journeyDate }
  getAllBuses: (params = {}) => api.get('/buses/buses', { params }),
  // Authenticated detail for a schedule on a specific date.
  getBus: (scheduleId, journeyDate) =>
    api.get('/buses/bus', { params: { scheduleId, journeyDate } }),
};

// ---- Booking APIs ----
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings/bookings', data),
  getBookings: () => api.get('/bookings/bookings'),
  getBooking: (bookingId) => api.get(`/bookings/bookings/${bookingId}`),
};

// ---- Payment APIs ----
export const paymentAPI = {
  processPayment: (bookingId, data) => api.post(`/payments/${bookingId}`, data),
  getPayment: (paymentId) => api.get(`/payments/${paymentId}`),
};

// ---- Ticket APIs ----
export const ticketAPI = {
  getTicket: (bookingId) => api.get(`/tickets/${bookingId}`),
  refundTicket: (ticketId, data) => api.post(`/tickets/refunds/${ticketId}`, data),
};

export default api;
