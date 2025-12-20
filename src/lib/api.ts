const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface ApiError {
  error: string;
  details?: any;
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
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
      const error: ApiError = await response.json().catch(() => ({
        error: 'Network error',
      }));
      throw new Error(error.error || 'Request failed');
    }

    return response.json();
  }

  // Auth
  async registerSendCode(phone: string, name: string) {
    return this.request<{ success: boolean; message: string; tempName?: string }>(
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
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    
    return result;
  }

  async loginSendCode(phone: string) {
    return this.request<{ success: boolean; message: string }>(
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
      localStorage.setItem('token', result.token);
      localStorage.setItem('user', JSON.stringify(result.user));
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
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
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
    const baseUrl = API_URL.replace('/api', '');
    return `${baseUrl}${result.url}`;
  }

  // Users
  async getUser(id: number) {
    return this.request<any>(`/users/${id}`);
  }
}

export const api = new ApiClient();

