import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create an Axios instance supporting cookie credentials
const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor to add Bearer access token
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor to auto-refresh access token on expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_URL}/auth/refresh-token`, {}, { withCredentials: true });
        const { token } = res.data;
        sessionStorage.setItem('token', token);
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, sign out
        sessionStorage.removeItem('token');
        window.dispatchEvent(new Event('auth-expired'));
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const register = async (userData) => {
  const res = await api.post('/auth/register', userData);
  return res.data;
};

export const login = async (credentials) => {
  const res = await api.post('/auth/login', credentials);
  return res.data;
};

export const logout = async () => {
  const res = await api.post('/auth/logout');
  sessionStorage.removeItem('token');
  return res.data;
};

export const verifyEmail = async (token) => {
  const res = await api.get(`/auth/verify-email?token=${token}`);
  return res.data;
};

export const forgotPassword = async (email) => {
  const res = await api.post('/auth/forgot-password', { email });
  return res.data;
};

export const resetPassword = async (token, password) => {
  const res = await api.post('/auth/reset-password', { token, password });
  return res.data;
};

export const getMe = async () => {
  const res = await api.get('/users/me');
  return res.data;
};

export const updateMe = async (profileData) => {
  const res = await api.patch('/users/me', profileData);
  return res.data;
};

export const uploadPortfolioItem = async (formData) => {
  const res = await api.post('/users/me/portfolio', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const uploadResume = async (formData) => {
  const res = await api.post('/users/me/resume', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data;
};

export default api;
