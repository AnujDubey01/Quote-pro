import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import axios from 'axios'
import './index.css'
import App from './App.jsx'

// Enable credentials for cross-origin / proxy cookie sharing
axios.defaults.withCredentials = true;

// Immediately pre-populate default Authorization header from localStorage on app boot
const initialToken = localStorage.getItem('token');
if (initialToken) {
  axios.defaults.headers.common['Authorization'] = `Bearer ${initialToken}`;
}

// Request interceptor: ensure Authorization header is always attached to every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
    if (config.headers.set) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor: automatically attempt silent refresh if token expired (401)
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      originalRequest.url &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;
      try {
        const savedRefreshToken = localStorage.getItem('refreshToken');
        const res = await axios.post('/api/v1/auth/refresh', { refreshToken: savedRefreshToken });
        if (res.data?.success && res.data.data?.accessToken) {
          const newToken = res.data.data.accessToken;
          localStorage.setItem('token', newToken);
          axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          if (originalRequest.headers.set) {
            originalRequest.headers.set('Authorization', `Bearer ${newToken}`);
          }
          return axios(originalRequest);
        }
      } catch (refreshErr) {
        // Refresh failed: session expired, clean up
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
