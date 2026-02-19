// src/services/directeurApi.js

import api from '../api/client';

export const directeurApi = {
  // ── Dashboard ─────────────────────────────────────
  getDashboard: () => api.get('/directeur/dashboard'),

  // ── Matériels affectés ────────────────────────────
  getAffectations: (params) => api.get('/directeur/materiels/affectations', { params }),
  getStatistiquesEntite: (entiteId) => 
    api.get('/directeur/materiels/statistiques-entite', { params: { entite_id: entiteId } }),
  exportMateriels: () => 
    api.get('/directeur/materiels/export', { responseType: 'blob' }),

  // ── Besoins ───────────────────────────────────────
  getBesoins: (params) => api.get('/directeur/besoins', { params }),
  getStatistiquesBesoins: (entiteId) => 
    api.get('/directeur/besoins/statistiques', { params: { entite_id: entiteId } }),

  // ── Pannes ────────────────────────────────────────
  getPannes: (params) => api.get('/directeur/pannes', { params }),
  getPanne: (id) => api.get(`/directeur/pannes/${id}`),
  getDashboardPannes: (entiteId) => 
    api.get('/directeur/pannes/dashboard', { params: { entite_id: entiteId } }),
  getStatistiquesPannes: (entiteId) => 
    api.get('/directeur/pannes/statistiques', { params: { entite_id: entiteId } }),

  // ── Référentiels ──────────────────────────────────
  getEntites: () => api.get('/directeur/entites'),
  getServices: () => api.get('/directeur/services'),
};