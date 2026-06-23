const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lifeos_token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      localStorage.removeItem('lifeos_token');
      if (typeof window !== 'undefined') window.location.href = '/login';
      throw new Error('Unauthorized');
    }
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }
    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint); }
  async post<T>(endpoint: string, data: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'POST', body: JSON.stringify(data) }); }
  async patch<T>(endpoint: string, data: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  async delete<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();
