import axios from 'axios';

const API_BASE = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// User APIs
export const userAPI = {
  register: (data) => api.post('/users', data),
  login: (data) => api.post('/users/login', data),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.put('/users/profile', data),
  verifyEmail: (verificationId) => api.post(`/users/verifyemails/${verificationId}`),
  logout: () => api.post('/users/logout'),
  getDriver: (driverId) => api.get(`/users/drivers/${driverId}`),
};

// Bus APIs
export const busAPI = {
  getAllBuses: () => api.get('/buses/buses'),
  getBus: (scheduleId, journeyDate) =>
    api.get('/buses/bus', {
      params: { scheduleId, journeyDate },
    }),
};

// Booking APIs
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings/bookings', data),
  getBookings: () => api.get('/bookings/bookings'),
  getBooking: (bookingId) => api.get(`/bookings/bookings/${bookingId}`),
};

// Payment APIs
export const paymentAPI = {
  processPayment: (bookingId, data) => api.post(`/payments/${bookingId}`, data),
  getPayment: (paymentId) => api.get(`/payments/${paymentId}`),
};

// Ticket APIs
export const ticketAPI = {
  getTicket: (bookingId) => api.get(`/tickets/${bookingId}`),
  refundTicket: (ticketId, data) => api.post(`/tickets/refunds/${ticketId}`, data),
};

export default api;
