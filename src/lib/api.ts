import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Создаем экземпляр axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Re-export useAuth for convenience
export { useAuth } from "@/contexts/AuthContext";

// Auth API
export const authAPI = {
  sendCode: (phone: string) => api.post('/auth/send-code', { phone }),
  verifyCode: (phone: string, code: string) => api.post('/auth/verify-code', { phone, code }),
  socialAuth: (data: { socialId: string; provider: string; name: string; avatar?: string; phone: string }) =>
    api.post('/auth/social', data),
  getMe: () => api.get('/auth/me'),
};

// Tasks API
export const tasksAPI = {
  create: (data: any) => api.post('/tasks', data),
  getAll: (params?: { fromAirport?: string; toAirport?: string; dateFrom?: string; skip?: number; take?: number }) =>
    api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  getResponses: (id: string) => api.get(`/tasks/${id}/responses`),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  cancel: (id: string) => api.delete(`/tasks/${id}`),
};

// Orders API
export const ordersAPI = {
  create: (data: { taskId: string; carrierMessage?: string }) => api.post('/orders', data),
  getAll: (role?: 'sender' | 'carrier') => api.get('/orders', { params: { role } }),
  getById: (id: string) => api.get(`/orders/${id}`),
  selectCarrier: (taskId: string, orderId: string) => api.put(`/orders/${taskId}/select-carrier/${orderId}`),
  markPackageReceived: (id: string) => api.put(`/orders/${id}/package-received`),
  markDelivered: (id: string) => api.put(`/orders/${id}/delivered`),
  updateStatus: (id: string, status: string) => api.put(`/orders/${id}/status`, { status }),
};

// Payments API
export const paymentsAPI = {
  create: (data: { orderId: string; provider: string }) => api.post('/payments', data),
  capture: (paymentId: string) => api.put(`/payments/${paymentId}/capture`),
  refund: (paymentId: string, amount?: number) => api.put(`/payments/${paymentId}/refund`, { amount }),
};

// Chat API
export const chatAPI = {
  sendMessage: (data: { orderId: string; message: string }) => api.post('/chat/messages', data),
  getMessages: (orderId: string) => api.get(`/chat/orders/${orderId}/messages`),
  markAsRead: (orderId: string) => api.put(`/chat/orders/${orderId}/read`),
  getUnreadCount: () => api.get('/chat/unread-count'),
};

// Reviews API
export const reviewsAPI = {
  create: (data: { orderId: string; rating: number; comment?: string }) => api.post('/reviews', data),
  getByUser: (userId: string) => api.get(`/reviews/user/${userId}`),
  getById: (id: string) => api.get(`/reviews/${id}`),
};

// Users API
export const usersAPI = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
  getById: (id: string) => api.get(`/users/${id}`),
};

// Files API
export const filesAPI = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    return api.post('/files/upload-multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (url: string) => api.delete(`/files/${encodeURIComponent(url)}`),
};

export default api;

