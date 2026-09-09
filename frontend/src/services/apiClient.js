const isBrowser = typeof window !== 'undefined';
const isLocalhost =
  isBrowser &&
  (window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname === '0.0.0.0');

// Centralized Production and Development API URLs
const PROD_API_URL = 'https://school-backend-h4he.onrender.com/api';
const DEV_API_URL =
  isBrowser && window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5000/api'
    : 'http://localhost:5000/api';

// Smart API URL resolution:
// 1. Explicit import.meta.env.VITE_API_URL if configured
// 2. Production mode / Remote environment -> https://school-backend-h4he.onrender.com/api
// 3. Local development environment -> http://localhost:5000/api
let rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();

if (!rawApiUrl) {
  if (isBrowser && !isLocalhost) {
    rawApiUrl = PROD_API_URL;
  } else if (import.meta.env.PROD || import.meta.env.MODE === 'production') {
    rawApiUrl = PROD_API_URL;
  } else {
    rawApiUrl = DEV_API_URL;
  }
}

// Normalize base URL: strip trailing slashes
rawApiUrl = rawApiUrl.replace(/\/+$/, '');

// Ensure /api suffix is present on base URL exactly once
if (!rawApiUrl.endsWith('/api')) {
  rawApiUrl = `${rawApiUrl}/api`;
}

export const API_BASE_URL = rawApiUrl;

const TOKEN_KEY = 'sms_token';

export const tokenStorage = {
  get: () => {
    try {
      if (typeof window === 'undefined') return null;

      // 1. Check tab-isolated sessionStorage first
      const sessionToken = window.sessionStorage?.getItem(TOKEN_KEY);
      if (sessionToken) {
        return sessionToken;
      }

      // 2. Migration fallback from localStorage if present
      const localToken = window.localStorage?.getItem(TOKEN_KEY);
      if (localToken) {
        window.sessionStorage?.setItem(TOKEN_KEY, localToken);
        window.localStorage?.removeItem(TOKEN_KEY);
        return localToken;
      }

      return null;
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (typeof window === 'undefined') return;

      if (token) {
        window.sessionStorage?.setItem(TOKEN_KEY, token);
      } else {
        window.sessionStorage?.removeItem(TOKEN_KEY);
      }
      // Always remove from localStorage so tabs don't overwrite each other
      window.localStorage?.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to access sessionStorage:', e);
    }
  },
  clear: () => {
    try {
      if (typeof window === 'undefined') return;
      window.sessionStorage?.removeItem(TOKEN_KEY);
      window.localStorage?.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear token from sessionStorage:', e);
    }
  },
};

/**
 * Build URL with query parameters (prevents duplicate /api paths)
 */
function buildUrl(endpoint, params) {
  const origin = isBrowser ? window.location.origin : 'http://localhost:5000';
  let cleanEndpoint = (endpoint || '').trim();
  let fullPath;

  if (cleanEndpoint.startsWith('http://') || cleanEndpoint.startsWith('https://')) {
    fullPath = cleanEndpoint;
  } else {
    // Strip leading slashes
    cleanEndpoint = cleanEndpoint.replace(/^\/+/, '');
    // If endpoint starts with 'api/', strip it to avoid duplicate /api/api
    if (cleanEndpoint.startsWith('api/')) {
      cleanEndpoint = cleanEndpoint.replace(/^api\//, '');
    } else if (cleanEndpoint === 'api') {
      cleanEndpoint = '';
    }

    fullPath = cleanEndpoint ? `${API_BASE_URL}/${cleanEndpoint}` : API_BASE_URL;
  }

  const url = fullPath.startsWith('http') ? new URL(fullPath) : new URL(fullPath, origin);
  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });
  }
  return url.toString();
}

/**
 * Centralized API request wrapper
 */
async function request(endpoint, options = {}) {
  const { method = 'GET', body, params, headers = {}, ...customConfig } = options;

  const token = tokenStorage.get();
  const reqHeaders = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...headers,
  };

  if (token) {
    reqHeaders.Authorization = `Bearer ${token}`;
  }

  const config = {
    method,
    headers: reqHeaders,
    ...customConfig,
  };

  if (body !== undefined) {
    config.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  const url = buildUrl(endpoint, params);

  try {
    const response = await fetch(url, config);
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || response.statusText || 'An unexpected error occurred';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.data = data;

      // Auto handle 401 Unauthorized
      if (response.status === 401 && !endpoint.includes('/auth/login')) {
        tokenStorage.clear();
      }
      throw error;
    }

    // Return the response data payload
    if (data && typeof data === 'object' && 'data' in data) {
      return data.data;
    }
    return data;
  } catch (error) {
    if (
      error.name === 'TypeError' &&
      (error.message.includes('fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('Failed to fetch'))
    ) {
      const connError = new Error(
        `Unable to connect to backend server (${url}). Please check that the server is online.`
      );
      connError.status = 0;
      console.warn(`[apiClient] ${method} ${endpoint} connection failed:`, connError.message);
      throw connError;
    }
    console.warn(`[apiClient] ${method} ${endpoint} failed:`, error.message);
    throw error;
  }
}

export const apiClient = {
  get: (endpoint, params, options) => request(endpoint, { method: 'GET', params, ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body, ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body, ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body, ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
  request,
  tokenStorage,
  API_BASE_URL,
  isConfigured: () => Boolean(import.meta.env.VITE_API_URL || isLocalhost || PROD_API_URL),
};

export default apiClient;
