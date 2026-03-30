import axios from 'axios';
import toast from 'react-hot-toast';

// ── URL de base de l'API ───────────────────────────────────
// En développement  : http://localhost:8003/api
// En production Docker : injecté via VITE_API_URL dans .env
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8003/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  // ⚠️ withCredentials seulement si tu utilises des cookies de session.
  // Avec JWT Bearer token, ce n'est pas nécessaire et peut causer des erreurs CORS.
  withCredentials: false,
});

// ── File d'attente pour les requêtes pendant le refresh ───
let isRefreshing = false;
let failedQueue  = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    error ? prom.reject(error) : prom.resolve(token);
  });
  failedQueue = [];
};

// ── Intercepteur requête : attacher le token Bearer ───────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Intercepteur réponse : gérer les 401 + erreurs HTTP ───
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // ── Éviter la boucle infinie sur /auth/refresh ────────
    if (originalRequest?.url?.includes('/auth/refresh')) {
      isRefreshing = false;
      processQueue(error, null);
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    // ── Refresh automatique sur 401 ───────────────────────
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res      = await api.post('/auth/refresh');
        const newToken = res.data.access_token;

        localStorage.setItem('access_token', newToken);
        api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        originalRequest.headers.Authorization        = `Bearer ${newToken}`;

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

    // ── Gestion des erreurs HTTP ───────────────────────────
    const status  = error.response?.status;
    const data    = error.response?.data;

    switch (status) {
      case 422: {
        // Affiche la première erreur de validation
        const errors = data?.errors;
        if (errors) {
          const firstField = Object.values(errors)[0];
          toast.error(Array.isArray(firstField) ? firstField[0] : firstField);
        } else if (data?.message) {
          toast.error(data.message);
        }
        break;
      }

      case 403:
        toast.error(data?.message || 'Accès interdit.');
        break;

      case 404:
        toast.error(data?.message || 'Ressource introuvable.');
        break;

      case 429:
        toast.error(data?.message || 'Trop de tentatives. Veuillez patienter.');
        break;

      default:
        if (status >= 500) {
          toast.error('Erreur serveur. Réessayez plus tard.');
        }
        break;
    }

    return Promise.reject(error);
  }
);

export default api;
