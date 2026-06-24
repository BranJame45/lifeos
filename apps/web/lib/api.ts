const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lifeos_token');
  }

  private getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('lifeos_refresh');
  }

  private async tryRefresh(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;
    try {
      const res = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });
      if (!res.ok) return false;
      const data = await res.json();
      if (data.token) {
        localStorage.setItem('lifeos_token', data.token);
        if (data.refreshToken) localStorage.setItem('lifeos_refresh', data.refreshToken);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}, retry = true): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${API_URL}${endpoint}`, { ...options, headers });

    if (response.status === 401) {
      // Intentar renovar el access token con el refresh token (una sola vez).
      if (retry && endpoint !== '/auth/refresh' && (await this.tryRefresh())) {
        return this.request<T>(endpoint, options, false);
      }
      localStorage.removeItem('lifeos_token');
      localStorage.removeItem('lifeos_refresh');
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
  async put<T>(endpoint: string, data: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'PUT', body: JSON.stringify(data) }); }
  async patch<T>(endpoint: string, data: unknown): Promise<T> { return this.request<T>(endpoint, { method: 'PATCH', body: JSON.stringify(data) }); }
  async delete<T>(endpoint: string): Promise<T> { return this.request<T>(endpoint, { method: 'DELETE' }); }
}

export const api = new ApiClient();
