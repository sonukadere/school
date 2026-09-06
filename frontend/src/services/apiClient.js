const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const TOKEN_KEY = 'sms_token';

export const tokenStorage = {
  get: () => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token) => {
    try {
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      } else {
        localStorage.removeItem(TOKEN_KEY);
      }
    } catch (e) {
      console.error('Failed to access localStorage:', e);
    }
  },
  clear: () => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Failed to clear token from localStorage:', e);
    }
  },
};

/**
 * Build URL with query parameters
 */
function buildUrl(endpoint, params) {
  const url = new URL(
    endpoint.startsWith('http') ? endpoint : `${API_BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`
  );
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
    if (error.name === 'TypeError' && (error.message.includes('fetch') || error.message.includes('NetworkError'))) {
      const connError = new Error(
        `Unable to connect to backend API server at ${API_BASE_URL}. Please ensure the backend is running.`
      );
      connError.status = 0;
      console.error(`[apiClient] ${method} ${endpoint} failed: Backend connection error`);
      throw connError;
    }
    console.error(`[apiClient] ${method} ${endpoint} failed:`, error.message);
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
};

export default apiClient;
