import axios from 'axios';

const API_URL = process.env.API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export const telegramAPI = {
  // Простая авторизация через Telegram ID (для бота)
  async authSimple(telegramId: number, firstName: string, lastName?: string, username?: string) {
    const response = await api.post('/telegram/auth/simple', {
      telegramId,
      firstName,
      lastName,
      username,
    });
    return response.data;
  },

  // Авторизация через Telegram (Mini App)
  async auth(initData: string) {
    const response = await api.post('/auth/telegram', { initData });
    return response.data;
  },

  // Подписка на уведомления
  async subscribe(telegramId: number, subscriptionType: string = 'all') {
    const response = await api.post('/telegram/subscribe', {
      telegramId,
      subscriptionType,
    });
    return response.data;
  },

  // Отправка сообщения в поддержку
  async sendSupportMessage(telegramId: number, message: string) {
    const response = await api.post('/telegram/support', {
      telegramId,
      message,
    });
    return response.data;
  },

  // Оставить отзыв
  async createReview(telegramId: number, rating: number, text: string) {
    const response = await api.post('/telegram/review', {
      telegramId,
      rating,
      text,
    });
    return response.data;
  },

  // Получить уведомления
  async getNotifications(telegramId: number) {
    const response = await api.get(`/telegram/notifications/${telegramId}`);
    return response.data;
  },

  // Отметить уведомление как отправленное
  async markNotificationAsSent(notificationId: number) {
    const response = await api.post(`/telegram/notifications/${notificationId}/mark-sent`);
    return response.data;
  },

  // Получить подписчиков
  async getSubscribers() {
    const response = await api.get('/telegram/subscribers');
    return response.data;
  },

  // Получить статистику подписок
  async getSubscribersStats() {
    const response = await api.get('/telegram/subscribers?stats=true');
    return response.data;
  },
};

export default telegramAPI;

