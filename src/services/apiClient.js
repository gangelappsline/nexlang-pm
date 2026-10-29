import { apiFetch, apiUploadFile } from '../api/http';
import { getAuthToken } from '../utils/auth-storage';

/**
 * API Client with axios-like interface using our existing http utilities
 */
const apiClient = {
  /**
   * GET request
   */
  get: async (path, config = {}) => {
    const token = config.headers?.Authorization?.replace('Bearer ', '') || getAuthToken();
    return apiFetch(path, { method: 'GET', token });
  },

  /**
   * POST request
   */
  post: async (path, data, config = {}) => {
    const token = config.headers?.Authorization?.replace('Bearer ', '') || getAuthToken();
    
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(null);
            }
          } else {
            const error = new Error('Upload failed');
            error.status = xhr.status;
            try {
              error.response = { data: JSON.parse(xhr.responseText) };
            } catch (e) {
              error.response = { data: { message: xhr.responseText } };
            }
            reject(error);
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const normalizedBase = API_BASE_URL.replace(/\/$/, '');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${normalizedBase}${normalizedPath}`;
        
        xhr.open('POST', url);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(data);
      });
    }
    
    return apiFetch(path, { method: 'POST', body: data, token });
  },

  /**
   * PUT request
   */
  put: async (path, data, config = {}) => {
    const token = config.headers?.Authorization?.replace('Bearer ', '') || getAuthToken();
    
    // Check if data is FormData (file upload)
    if (data instanceof FormData) {
      // For FormData with PUT, we need to use XMLHttpRequest
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              resolve(response);
            } catch (e) {
              resolve(null);
            }
          } else {
            const error = new Error('Upload failed');
            error.status = xhr.status;
            try {
              error.response = { data: JSON.parse(xhr.responseText) };
            } catch (e) {
              error.response = { data: { message: xhr.responseText } };
            }
            reject(error);
          }
        });
        
        xhr.addEventListener('error', () => {
          reject(new Error('Network error'));
        });
        
        const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const normalizedBase = API_BASE_URL.replace(/\/$/, '');
        const normalizedPath = path.startsWith('/') ? path : `/${path}`;
        const url = `${normalizedBase}${normalizedPath}`;
        
        xhr.open('PUT', url);
        
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(data);
      });
    }
    
    return apiFetch(path, { method: 'PUT', body: data, token });
  },

  /**
   * DELETE request
   */
  delete: async (path, config = {}) => {
    const token = config.headers?.Authorization?.replace('Bearer ', '') || getAuthToken();
    return apiFetch(path, { method: 'DELETE', token });
  },

  /**
   * PATCH request
   */
  patch: async (path, data, config = {}) => {
    const token = config.headers?.Authorization?.replace('Bearer ', '') || getAuthToken();
    return apiFetch(path, { method: 'PATCH', body: data, token });
  },
};

export default apiClient;
