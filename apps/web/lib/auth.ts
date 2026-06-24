import { api } from './api';

interface AuthResponse {
  token: string;
  refreshToken?: string;
  user: { id: string; email: string; name: string };
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const data = await api.post<AuthResponse>('/auth/login', { email, password });
  localStorage.setItem('lifeos_token', data.token);
  if (data.refreshToken) localStorage.setItem('lifeos_refresh', data.refreshToken);
  return data;
}

export function logout(): void {
  localStorage.removeItem('lifeos_token');
  localStorage.removeItem('lifeos_refresh');
  window.location.href = '/login';
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('lifeos_token');
}

export function isAuthenticated(): boolean { return !!getToken(); }
