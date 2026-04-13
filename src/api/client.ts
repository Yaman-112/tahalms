import type { ApiResponse } from '../types';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

let accessToken: string | null = localStorage.getItem('accessToken');
let refreshToken: string | null = localStorage.getItem('refreshToken');

export function setTokens(access: string, refresh: string) {
  accessToken = access;
  refreshToken = refresh;
  localStorage.setItem('accessToken', access);
  localStorage.setItem('refreshToken', refresh);
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
}

export function getAccessToken() {
  return accessToken;
}

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearTokens();
      return false;
    }

    const data = await res.json();
    if (data.success && data.data.accessToken) {
      accessToken = data.data.accessToken;
      localStorage.setItem('accessToken', data.data.accessToken);
      return true;
    }

    clearTokens();
    return false;
  } catch {
    clearTokens();
    return false;
  }
}

export async function api<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  let res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  // If 401, try refresh
  if (res.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${accessToken}`;
      res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
    }
  }

  const data = await res.json();
  return data;
}

// Convenience methods
export const get = <T>(endpoint: string) => api<T>(endpoint);

export const post = <T>(endpoint: string, body: any) =>
  api<T>(endpoint, { method: 'POST', body: JSON.stringify(body) });

export const patch = <T>(endpoint: string, body: any) =>
  api<T>(endpoint, { method: 'PATCH', body: JSON.stringify(body) });

export const del = <T>(endpoint: string) =>
  api<T>(endpoint, { method: 'DELETE' });
