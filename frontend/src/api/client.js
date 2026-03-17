import axios from 'axios';
import toast from 'react-hot-toast';

// ── URL de base de l'API ───────────────────────────────────
// En développement  : http://localhost:8000/api
// En production Docker : http://192.168.1.45:8002/api  (injecté via VITE_API_URL)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true,
});

// ── File d'attente pour les requêtes pendant le refresh ───
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// ── Intercepteur requête : attacher le token ───────────────
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Intercepteur réponse : gérer les 401 ──────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Éviter la boucle infinie sur la route refresh
    if (error.config?.url === '/auth/refresh') {
      isRefreshing = false;
      processQueue(error, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // Tentative de refresh du token sur 401
    if (error.response?.status === 401 && !originalRequest._retry) {

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res      = await api.post('/auth/refresh');
        const newToken = res.data.access_token;

        localStorage.setItem('access_token', newToken);
        originalRequest.headers.Authorization          = `Bearer ${newToken}`;
        api.defaults.headers.common['Authorization']   = `Bearer ${newToken}`;

        processQueue(null, newToken);
        isRefreshing = false;

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem('access_token');
        localStorage.removeItem('user');

        if (!window.location.pathname.includes('/login')) {
          toast.error('Session expirée. Veuillez vous reconnecter.');
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // ── Gestion des autres erreurs HTTP ───────────────────
    switch (error.response?.status) {
      case 422: {
        const errors = error.response.data?.errors;
        if (errors) {
          const first = Object.values(errors)[0];
          toast.error(Array.isArray(first) ? first[0] : first);
        } else if (error.response.data?.message) {
          toast.error(error.response.data.message);
        }
        break;
      }
      case 403:
        toast.error(error.response.data?.message || 'Accès interdit.');
        break;
      case 404:
        toast.error(error.response.data?.message || 'Ressource introuvable.');
        break;
      case 429:
        toast.error('Trop de tentatives. Veuillez patienter.');
        break;
      default:
        if (error.response?.status >= 500) {
          toast.error('Erreur serveur. Réessayez plus tard.');
        }
    }

    return Promise.reject(error);
  }
);

export default api;