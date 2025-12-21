import { getToken, storeToken, storeUser, getUser, clearToken, clearUser } from './token-storage';

// Используем относительный путь для продакшена, или переменную окружения
// В production всегда используем относительный путь /api (nginx проксирует)
// В development используем localhost:3001 или прокси из vite.config.ts
const API_URL = import.meta.env.PROD 
  ? '/api'  // В production всегда относительный путь
  : (import.meta.env.VITE_API_URL || 'http://localhost:3001/api');  // В development

export interface ApiError {
  error: string;
  details?: any;
}

class ApiClient {
  private getToken(): string | null {
    return getToken();
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      // Если 401 - токен истек или не передан, очищаем токен и перенаправляем на логин
      if (response.status === 401) {
        clearToken();
        clearUser();
        // Перенаправляем на страницу входа только если мы не на странице входа/регистрации
        if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
      
      const error: ApiError = await response.json().catch(() => ({
        error: 'Network error',
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async registerSendCode(phone: string, name: string) {
    return this.request<{ success: boolean; message: string; tempName?: string; code?: string; devMode?: boolean }>(
      '/auth/register/send-code',
      {
        method: 'POST',
        body: JSON.stringify({ phone, name }),
      }
    );
  }

  async registerVerify(phone: string, code: string, name: string) {
    const result = await this.request<{
      success: boolean;
      token: string;
      user: any;
    }>('/auth/register/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code, name }),
    });
    
    if (result.token) {
      storeToken(result.token);
      storeUser(result.user);
    }
    
    return result;
  }

  async loginSendCode(phone: string) {
    return this.request<{ success: boolean; message: string; code?: string; devMode?: boolean }>(
      '/auth/login/send-code',
      {
        method: 'POST',
        body: JSON.stringify({ phone }),
      }
    );
  }

  async loginVerify(phone: string, code: string) {
    const result = await this.request<{
      success: boolean;
      token: string;
      user: any;
    }>('/auth/login/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    });
    
    if (result.token) {
      storeToken(result.token);
      storeUser(result.user);
    }
    
    return result;
  }

  async getMe() {
    return this.request<{
      id: number;
      phone: string;
      name: string;
      rating: number;
      deliveriesCount: number;
    }>('/auth/me');
  }

  logout() {
    clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    return getUser();
  }

  // Tasks
  async getTasks(params?: {
    from?: string;
    to?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    const queryParams = new URLSearchParams();
    if (params?.from) queryParams.append('from', params.from);
    if (params?.to) queryParams.append('to', params.to);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const query = queryParams.toString();
    return this.request<{
      tasks: any[];
      page: number;
      limit: number;
    }>(`/tasks${query ? `?${query}` : ''}`);
  }

  async getTask(id: number) {
    return this.request<any>(`/tasks/${id}`);
  }

  async createTask(data: {
    title: string;
    description: string;
    size: 'S' | 'M' | 'L';
    estimatedValue?: number;
    photoUrl?: string;
    fromAirport: string;
    fromPoint?: string;
    toAirport: string;
    toPoint?: string;
    dateFrom: string;
    dateTo: string;
    reward: number;
  }) {
    return this.request<any>('/tasks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async assignTask(taskId: number) {
    return this.request<{ success: boolean; message: string }>(
      `/tasks/${taskId}/assign`,
      {
        method: 'POST',
      }
    );
  }

  async updateTaskStatus(taskId: number, status: 'in_transit' | 'delivered' | 'cancelled') {
    return this.request<{ success: boolean; status: string }>(
      `/tasks/${taskId}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }
    );
  }

  async getMyTasks(role?: 'sender' | 'courier', status?: string) {
    const params = new URLSearchParams();
    if (role) params.append('role', role);
    if (status) params.append('status', status);
    const query = params.toString();
    return this.request<{ tasks: any[] }>(`/tasks/my${query ? `?${query}` : ''}`);
  }

  // Upload
  async uploadPhoto(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('photo', file);

    const token = this.getToken();
    const headers: HeadersInit = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    const result = await response.json();
    // Return full URL
    // Если API_URL относительный (/api), используем текущий origin
    const baseUrl = API_URL.startsWith('/') 
      ? window.location.origin 
      : API_URL.replace('/api', '');
    return `${baseUrl}${result.url}`;
  }

  // Users
  async getUser(id: number) {
    return this.request<any>(`/users/${id}`);
  }

  async getMe() {
    return this.request<any>('/users/me');
  }

  async updateProfile(data: {
    name?: string;
    phoneSbp?: string;
    accountNumber?: string;
    bankName?: string;
  }) {
    return this.request<any>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async getPaymentDetails(taskId: number) {
    return this.request<{
      phoneSbp?: string;
      accountNumber?: string;
      bankName?: string;
    }>(`/users/tasks/${taskId}/payment-details`);
  }

  async confirmPayment(taskId: number) {
    return this.request<{ success: boolean; message: string }>(
      `/tasks/${taskId}/confirm-payment`,
      {
        method: 'POST',
      }
    );
  }

  // Chat/Messages
  async getMessages(taskId: number) {
    return this.request<{ messages: any[] }>(`/tasks/${taskId}/messages`);
  }

  async sendMessage(taskId: number, content: string) {
    return this.request<{ id: number; message: string; senderId: number; createdAt: string }>(
      `/tasks/${taskId}/messages`,
      {
        method: 'POST',
        body: JSON.stringify({ content }),
      }
    );
  }

  async markMessagesAsRead(taskId: number) {
    return this.request<{ success: boolean }>(
      `/tasks/${taskId}/messages/read`,
      {
        method: 'POST',
      }
    );
  }

  // Telegram
  async telegramAuth(initData: string) {
    return this.request<{
      success: boolean;
      token?: string;
      user?: any;
      telegramUser?: any;
      needsPhoneAuth?: boolean;
    }>('/telegram/auth', {
      method: 'POST',
      body: JSON.stringify({ initData }),
    });
  }

  async linkTelegram(initData: string) {
    return this.request<{ success: boolean; message: string }>(
      '/telegram/link',
      {
        method: 'POST',
        body: JSON.stringify({ initData }),
      }
    );
  }

  async subscribeTelegram(telegramId: number, subscriptionType?: string) {
    return this.request<{ success: boolean; message: string }>(
      '/telegram/subscribe',
      {
        method: 'POST',
        body: JSON.stringify({ telegramId, subscriptionType }),
      }
    );
  }

  async unsubscribeTelegram(telegramId: number) {
    return this.request<{ success: boolean; message: string }>(
      '/telegram/unsubscribe',
      {
        method: 'POST',
        body: JSON.stringify({ telegramId }),
      }
    );
  }

  async sendSupportMessage(telegramId: number | null, message: string) {
    return this.request<{ success: boolean; message: string }>(
      '/telegram/support',
      {
        method: 'POST',
        body: JSON.stringify({ telegramId, message }),
      }
    );
  }

  async createTelegramReview(telegramId: number, rating: number, text?: string) {
    return this.request<{ success: boolean; message: string }>(
      '/telegram/review',
      {
        method: 'POST',
        body: JSON.stringify({ telegramId, rating, text }),
      }
    );
  }
}

export const api = new ApiClient();

