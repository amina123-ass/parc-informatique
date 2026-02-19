import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

// Variable pour éviter les boucles infinies
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// ── Request interceptor: attach token ──────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ───────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Éviter de rafraîchir le token sur la route refresh elle-même
    if (error.config.url === '/auth/refresh') {
      isRefreshing = false;
      processQueue(error, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Try refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Si un refresh est déjà en cours, mettre en file d'attente
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh');
        const newToken = res.data.access_token;
        
        localStorage.setItem('access_token', newToken);
        
        // Mettre à jour le header
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        
        processQueue(null, newToken);
        isRefreshing = false;
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        
        // Éviter les toasts multiples
        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      }
    }

    // Validation errors
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      if (errors) {
        const first = Object.values(errors)[0];
        toast.error(Array.isArray(first) ? first[0] : first);
      } else if (error.response.data.message) {
        toast.error(error.response.data.message);
      }
    } else if (error.response?.status === 403) {
      toast.error(error.response.data.message || 'Accès interdit.');
    } else if (error.response?.status === 404) {
      toast.error(error.response.data.message || 'Ressource introuvable.');
    } else if (error.response?.status === 429) {
      toast.error('Trop de tentatives. Veuillez patienter.');
    } else if (error.response?.status >= 500) {
      toast.error('Erreur serveur. Réessayez plus tard.');
    }

    return Promise.reject(error);
  }
);

export default api;