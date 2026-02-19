// src/services/userApi.js

import api from '../api/client';

export const userApi = {
  // Dashboard
  getDashboard: () => api.get('/user/dashboard'),
  
  // Matériels
  getMesMateriels: (params) => api.get('/user/materiels', { params }),
  getMateriel: (id) => api.get(`/user/materiels/${id}`),
  
  // Besoins
  getMesBesoins: (params) => api.get('/user/besoins', { params }),
  getBesoin: (id) => api.get(`/user/besoins/${id}`),
  createBesoin: (data) => api.post('/user/besoins', data),
  cancelBesoin: (id) => api.patch(`/user/besoins/${id}/cancel`),
  getStatistiquesBesoins: () => api.get('/user/besoins/statistiques'),
  
  // Pannes
  getMesPannes: (params) => api.get('/user/pannes', { params }),
  getPanne: (id) => api.get(`/user/pannes/${id}`),
  createPanne: (data) => api.post('/user/pannes', data),
  cancelPanne: (id) => api.patch(`/user/pannes/${id}/cancel`),
  getMaterielsDisponibles: () => api.get('/user/pannes/mes-materiels'),
  getStatistiquesPannes: () => api.get('/user/pannes/statistiques'),
};