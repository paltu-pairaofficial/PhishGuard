import { User, ScanHistoryItem, ThreatReport, SuspiciousKeyword, AdminAnalytics } from '../types';

const TOKEN_KEY = 'phishguard_auth_token';

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY)
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  auth: {
    register: (name: string, email: string, password: string, role: string = 'user') =>
      request<{ token: string; user: User }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify({ name, email, password, role })
      }),
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password })
      }),
    me: () => request<{ user: User }>('/api/auth/me')
  },

  scan: {
    url: (url: string) =>
      request<{ scan: ScanHistoryItem }>('/api/scan/url', {
        method: 'POST',
        body: JSON.stringify({ url })
      }),
    message: (message: string) =>
      request<{ scan: ScanHistoryItem }>('/api/scan/message', {
        method: 'POST',
        body: JSON.stringify({ message })
      })
  },

  history: {
    getAll: (params?: { search?: string; type?: string; risk_level?: string }) => {
      const query = new URLSearchParams();
      if (params?.search) query.set('search', params.search);
      if (params?.type && params.type !== 'all') query.set('type', params.type);
      if (params?.risk_level && params.risk_level !== 'all') query.set('risk_level', params.risk_level);
      const qs = query.toString();
      return request<{ history: ScanHistoryItem[] }>(`/api/history${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<{ scan: ScanHistoryItem }>(`/api/history/${id}`),
    delete: (id: string) => request<{ message: string }>(`/api/history/${id}`, { method: 'DELETE' }),
    clearAll: () => request<{ message: string }>('/api/history', { method: 'DELETE' })
  },

  reports: {
    getAll: () => request<{ reports: ThreatReport[] }>('/api/reports'),
    create: (data: { report_type: string; content: string; risk_level: string; details: string }) =>
      request<{ report: ThreatReport }>('/api/reports', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    updateStatus: (id: string, status: 'pending' | 'reviewed' | 'resolved') =>
      request<{ report: ThreatReport }>(`/api/reports/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      })
  },

  admin: {
    getUsers: () => request<{ users: User[] }>('/api/admin/users'),
    getLogs: () => request<{ logs: ScanHistoryItem[] }>('/api/admin/logs'),
    getAnalytics: () => request<AdminAnalytics>('/api/admin/analytics'),
    getKeywords: () => request<{ keywords: SuspiciousKeyword[] }>('/api/admin/keywords'),
    addKeyword: (data: { keyword: string; category: string; weight: number }) =>
      request<{ keyword: SuspiciousKeyword }>('/api/admin/keywords', {
        method: 'POST',
        body: JSON.stringify(data)
      }),
    deleteKeyword: (id: string) =>
      request<{ message: string }>(`/api/admin/keywords/${id}`, {
        method: 'DELETE'
      })
  }
};
