/**
 * ─── ROUTES REACT À AJOUTER ──────────────────────
 * Ajouter ces imports et routes dans votre fichier router
 * (ex: AppRoutes.jsx ou router.jsx)
 * ──────────────────────────────────────────────────
 */

// === Imports ===
import BesoinsListPage from './pages/admin-parc/BesoinsListPage';
import BesoinsDashboardPage from './pages/admin-parc/BesoinsDashboardPage';

// === Routes (dans le layout admin-parc) ===
// <Route path="admin-parc/besoins" element={<BesoinsListPage />} />
// <Route path="admin-parc/besoins/dashboard" element={<BesoinsDashboardPage />} />

/**
 * ─── COMPOSANTS À PLACER ─────────────────────────
 *
 * Pages :
 *   src/pages/admin-parc/BesoinsListPage.jsx
 *   src/pages/admin-parc/BesoinsDashboardPage.jsx
 *
 * Composants :
 *   src/components/admin-parc/BesoinDetailDialog.jsx
 *   src/components/admin-parc/BesoinCreateDialog.jsx
 *
 * ─── LIEN NAVIGATION (sidebar) ──────────────────
 * Ajouter dans le menu admin-parc :
 *   { label: 'Besoins', path: '/admin-parc/besoins', icon: <Assignment /> }
 *   { label: 'Dashboard Besoins', path: '/admin-parc/besoins/dashboard', icon: <Dashboard /> }
 */