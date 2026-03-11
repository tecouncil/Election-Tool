const API_BASE = '/api';

export function getToken(): string | null {
  return localStorage.getItem('tec_token');
}

export function setToken(token: string) {
  localStorage.setItem('tec_token', token);
}

export function clearToken() {
  localStorage.removeItem('tec_token');
}

export async function apiFetch(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || 'API request failed');
  }

  return data;
}
