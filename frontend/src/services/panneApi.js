// src/services/panneApi.js

import api from '../api/client';

export const panneApi = {
  // Liste des pannes
  getPannes: (params) => api.get('/admin-parc/pannes', { params }),
  
  // Détail d'une panne
  getPanne: (id) => api.get(`/admin-parc/pannes/${id}`),
  
  // Créer une panne
  createPanne: (data) => api.post('/admin-parc/pannes', data),
  
  // Mettre à jour une panne
  updatePanne: (id, data) => api.patch(`/admin-parc/pannes/${id}`, data),
  
  // Supprimer une panne
  deletePanne: (id) => api.delete(`/admin-parc/pannes/${id}`),
  
  // Prise en charge
  priseEnCharge: (id, data) => api.patch(`/admin-parc/pannes/${id}/prise-en-charge`, data),
  
  // Résoudre
  resoudre: (id, data) => api.patch(`/admin-parc/pannes/${id}/resoudre`, data),
  
  // Annuler
  annuler: (id, data) => api.patch(`/admin-parc/pannes/${id}/annuler`, data),
  
  // Dashboard
  getDashboard: () => api.get('/admin-parc/pannes/dashboard'),
  
  // Techniciens
  getTechniciens: () => api.get('/admin-parc/pannes/techniciens'),
};