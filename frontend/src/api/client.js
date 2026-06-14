/**
 * API client with JWT auth interceptor and HttpOnly silent refresh.
 * All backend calls go through this module.
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE;
    this.isRefreshing = false;
    this.refreshSubscribers = [];
  }

  getToken() {
    return localStorage.getItem('auth_token');
  }

  setToken(token) {
    localStorage.setItem('auth_token', token);
  }

  clearToken() {
    localStorage.removeItem('auth_token');
  }

  onRefreshed(token) {
    this.refreshSubscribers.forEach(cb => cb(token));
    this.refreshSubscribers = [];
  }

  addRefreshSubscriber(cb) {
    this.refreshSubscribers.push(cb);
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();

    const headers = { ...options.headers };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // Important: Include credentials to send/receive the HttpOnly cookie
    const fetchOptions = {
      ...options,
      headers,
      credentials: 'include',
    };

    let response = await fetch(url, fetchOptions);

    // If 401, attempt to refresh the token using the HttpOnly cookie
    if (response.status === 401 && endpoint !== '/auth/refresh' && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      if (!this.isRefreshing) {
        this.isRefreshing = true;
        try {
          const refreshRes = await fetch(`${this.baseUrl}/auth/refresh`, {
            method: 'POST',
            credentials: 'include'
          });
          
          if (!refreshRes.ok) throw new Error('Refresh failed');
          
          const { token: newToken } = await refreshRes.json();
          this.setToken(newToken);
          this.isRefreshing = false;
          this.onRefreshed(newToken);
          
          // Retry the original request
          headers['Authorization'] = `Bearer ${newToken}`;
          response = await fetch(url, { ...fetchOptions, headers });
        } catch (err) {
          this.isRefreshing = false;
          this.clearToken();
          // Avoid redirecting if the failing request is /auth/me during initial app load
          if (endpoint !== '/auth/me') {
            window.location.href = '/login';
          }
          throw new Error('Session expired');
        }
      } else {
        // Queue this request until refresh finishes
        return new Promise(resolve => {
          this.addRefreshSubscriber(newToken => {
            headers['Authorization'] = `Bearer ${newToken}`;
            resolve(fetch(url, { ...fetchOptions, headers }).then(res => this.handleResponse(res)));
          });
        });
      }
    }

    return this.handleResponse(response);
  }

  async handleResponse(response) {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || `HTTP ${response.status}`);
    }
    return response.json();
  }

  get(endpoint) {
    return this.request(endpoint);
  }

  post(endpoint, data) {
    const isFormData = data instanceof FormData;
    return this.request(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
    });
  }

  put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  patch(endpoint, data) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
export default api;
