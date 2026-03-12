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

export function formatDateIST(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '-';
  let date: Date;
  if (typeof dateInput === 'string') {
    // SQLite's CURRENT_TIMESTAMP results in 'YYYY-MM-DD HH:MM:SS'.
    // JavaScript Date needs 'T' and 'Z' for reliable UTC parsing.
    let isoStr = dateInput;
    if (isoStr.includes(' ') && !isoStr.includes('T')) {
      isoStr = isoStr.replace(' ', 'T');
    }
    if (!isoStr.endsWith('Z') && !isoStr.includes('+')) {
      isoStr += 'Z';
    }
    date = new Date(isoStr);
  } else {
    date = dateInput;
  }
  
  if (isNaN(date.getTime())) return '-';
  
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(date);
}

/**
 * Formats a date for <input type="datetime-local"> in IST timezone.
 * Returns YYYY-MM-DDTHH:mm
 */
export function formatLocalDatetime(dateInput: string | Date | null | undefined): string {
  if (!dateInput) return '';
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) return '';

  const options = {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  } as const;
  
  const formatter = new Intl.DateTimeFormat('en-CA', options);
  const parts = formatter.formatToParts(date);
  const find = (type: string) => parts.find(p => p.type === type)?.value;
  
  return `${find('year')}-${find('month')}-${find('day')}T${find('hour')}:${find('minute')}`;
}

export function renderHeader() {
  const isAdmin = location.pathname.startsWith('/admin') && getToken();
  return `
    <nav class="header-nav">
      <div class="logo-container" onclick="navigate('/')">
        <img src="/assets/logo.png" alt="TEC Logo" class="logo-img" />
      </div>
      <div class="flex gap-4 items-center">
        ${isAdmin ? `<button class="secondary" onclick="navigate('/admin')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Admin Dashboard</button>` : ''}
        <button class="secondary" onclick="navigate('/verify')" style="padding: 0.4rem 0.8rem; font-size: 0.8rem;">Verify Vote</button>
      </div>
    </nav>
  `;
}
