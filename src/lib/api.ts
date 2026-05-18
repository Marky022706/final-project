// src/lib/api.ts
import axios from 'axios';

// Local development REST API base URL served via Apache/XAMPP
export const API_BASE_URL = 'http://localhost/final-project/backend/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach the current Access Token from localStorage
api.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('balingasag_access_token');
    if (accessToken && config.headers) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Intercept 401s and perform secure Refresh Token Rotation
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Guard against infinite refresh loops
    if (originalRequest && error.response && error.response.status === 401 && !originalRequest._retry) {
      
      // If we are already refreshing, push this request into the waiting queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers['Authorization'] = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('balingasag_refresh_token');

      if (!refreshToken) {
        // No refresh token. Log out immediately.
        handleSessionExpiration();
        return Promise.reject(error);
      }

      try {
        // Make rotation request directly using axios to prevent interceptor looping
        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken: refreshToken,
        });

        if (response.data && response.data.success) {
          const { accessToken: newAccess, refreshToken: newRefresh } = response.data.data;
          
          // Store rotated keys
          localStorage.setItem('balingasag_access_token', newAccess);
          localStorage.setItem('balingasag_refresh_token', newRefresh);
          
          // Apply to failed request
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          
          processQueue(null, newAccess);
          isRefreshing = false;
          
          // Retry original request
          return api(originalRequest);
        } else {
          throw new Error('Refresh failed');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        handleSessionExpiration();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Gracefully clear credentials and bounce the user on credentials expiration
function handleSessionExpiration() {
  localStorage.removeItem('balingasag_access_token');
  localStorage.removeItem('balingasag_refresh_token');
  localStorage.removeItem('balingasag_user');
  
  // Custom custom-event to inform AuthProvider to reset state
  window.dispatchEvent(new Event('balingasag_auth_expired'));
}

export default api;
