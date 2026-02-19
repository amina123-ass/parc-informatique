// src/App.jsx - VERSION COMPLÈTE avec routes Utilisateur

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { CircularProgress, Box } from '@mui/material';

// ── Auth pages ──────────────────────
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifySetupPage from './pages/auth/VerifySetupPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// ── Admin SI pages ──────────────────
import AdminLayout from './components/layout/AdminLayout';
import DashboardPage from './pages/admin/DashboardPage';
import UsersPage from './pages/admin/UsersPage';
import RolesPage from './pages/admin/RolesPage';
import ServicesPage from './pages/admin/ServicesPage';
import DictionnairePage from './pages/admin/DictionnairePage';

// ── Admin Parc pages (lazy loading) ─────────────────
const AdminParcLayout = lazy(() => import('./components/layout/AdminParcLayout'));
const DashboardAdminParcPage = lazy(() => import('./pages/admin-parc/DashboardAdminParcPage'));
const CategoriesPage = lazy(() => import('./pages/admin-parc/CategoriesPage'));
const SubCategoriesPage = lazy(() => import('./pages/admin-parc/SubCategoriesPage'));
const SousCategoriesManagePage = lazy(() => import('./pages/admin-parc/SousCategoriesManagePage'));
const MaterielsTablePage = lazy(() => import('./pages/admin-parc/MaterielsTablePage'));
const MaterielCreatePage = lazy(() => import('./pages/admin-parc/MaterielCreatePage'));
const MaterielDetailPage = lazy(() => import('./pages/admin-parc/MaterielDetailPage'));
const AffectationsPage = lazy(() => import('./pages/admin-parc/AffectationsPage'));
const ReformePage = lazy(() => import('./pages/admin-parc/ReformePage'));
const CorbeillePage = lazy(() => import('./pages/admin-parc/CorbeillePage'));
const BesoinsListPage = lazy(() => import('./pages/admin-parc/BesoinsListPage'));
const BesoinsDashboardPage = lazy(() => import('./pages/admin-parc/BesoinsDashboardPage'));
const PannesPage = lazy(() => import('./pages/admin-parc/PannesPage'));
const PanneDetailPageAdminParc = lazy(() => import('./pages/admin-parc/PanneDetailPage'));
const PanneCreatePageAdminParc = lazy(() => import('./pages/admin-parc/PanneCreatePage'));
const PannesDashboardPage = lazy(() => import('./pages/admin-parc/PannesDashboardPage'));

// ── Directeur pages (lazy loading) ──────────────────
const DirecteurLayout = lazy(() => import('./components/layout/DirecteurLayout'));
const DashboardDirecteurPage = lazy(() => import('./pages/directeur/DashboardDirecteurPage'));
const MaterielsDirecteurPage = lazy(() => import('./pages/directeur/MaterielsDirecteurPage'));
const BesoinsDirecteurPage = lazy(() => import('./pages/directeur/BesoinsDirecteurPage'));
const PannesDirecteurPage = lazy(() => import('./pages/directeur/PannesDirecteurPage'));

// ── User pages (lazy loading) ───────────────────────
const UserLayout = lazy(() => import('./components/layout/UserLayout'));
const DashboardUserPage = lazy(() => import('./pages/user/DashboardUserPage'));
const MaterielsUserPage = lazy(() => import('./pages/user/MaterielsUserPage'));
const PannesUserPage = lazy(() => import('./pages/user/PannesUserPage'));
const PanneDetailPageUser = lazy(() => import('./pages/user/PanneDetailPage'));
const PanneCreatePageUser = lazy(() => import('./pages/user/PanneCreatePage'));
const BesoinsUserPage = lazy(() => import('./pages/user/BesoinsUserPage'));
const BesoinCreatePageUser = lazy(() => import('./pages/user/BesoinCreatePage'));

// ── Loader ──────────────────────────────────────────
function Loader() {
  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
      <CircularProgress />
    </Box>
  );
}

function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;
  if (!user) return <Navigate to="/login" replace />;
  
  // Si requiredRole est un tableau, vérifier si le rôle de l'utilisateur est dans le tableau
  if (requiredRole) {
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    if (!roles.includes(user.role)) {
      return <Navigate to="/login" replace />;
    }
  }

  return children;
}

function GuestRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) return <Loader />;

  if (user) {
    if (user.role === 'ADMIN_SI') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'ADMIN_PARC') return <Navigate to="/admin-parc/dashboard" replace />;
    if (user.role === 'DIRECTEUR' || user.role === 'ADJOINT_DIRECTEUR') {
      return <Navigate to="/directeur/dashboard" replace />;
    }
    if (user.role === 'USER' || user.role === 'UTILISATEUR') {
      return <Navigate to="/user/dashboard" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        {/* ══════════════════════════════════════════════════
            GUEST ROUTES (PUBLIC)
        ══════════════════════════════════════════════════ */}
        <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
        <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
        <Route path="/verify-setup" element={<VerifySetupPage />} />
        <Route path="/forgot" element={<GuestRoute><ForgotPasswordPage /></GuestRoute>} />
        <Route path="/reset" element={<ResetPasswordPage />} />

        {/* ══════════════════════════════════════════════════
            ADMIN SI ROUTES
        ══════════════════════════════════════════════════ */}
        <Route
          path="/admin"
          element={<ProtectedRoute requiredRole="ADMIN_SI"><AdminLayout /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="roles" element={<RolesPage />} />
          <Route path="services" element={<ServicesPage />} />
          <Route path="dictionnaire/:type" element={<DictionnairePage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ══════════════════════════════════════════════════
            ADMIN PARC ROUTES
        ══════════════════════════════════════════════════ */}
        <Route
          path="/admin-parc"
          element={<ProtectedRoute requiredRole="ADMIN_PARC"><AdminParcLayout /></ProtectedRoute>}
        >
          <Route path="dashboard" element={<DashboardAdminParcPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="categories/:categoryId" element={<SubCategoriesPage />} />
          <Route path="sous-categories/manage" element={<SousCategoriesManagePage />} />
          <Route path="sub-categories/:subCategoryId/materiels" element={<MaterielsTablePage />} />
          <Route path="sub-categories/:subCategoryId/materiels/new" element={<MaterielCreatePage />} />
          <Route path="materiels/:id" element={<MaterielDetailPage />} />
          <Route path="materiels/:id/edit" element={<MaterielCreatePage />} />
          <Route path="affectations" element={<AffectationsPage />} />
          <Route path="besoins" element={<BesoinsListPage />} />
          <Route path="besoins/dashboard" element={<BesoinsDashboardPage />} />
          <Route path="pannes" element={<PannesPage />} />
          <Route path="pannes/dashboard" element={<PannesDashboardPage />} />
          <Route path="pannes/new" element={<PanneCreatePageAdminParc />} />
          <Route path="pannes/:id" element={<PanneDetailPageAdminParc />} />
          <Route path="reforme" element={<ReformePage />} />
          <Route path="corbeille" element={<CorbeillePage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ══════════════════════════════════════════════════
            DIRECTEUR / ADJOINT DIRECTEUR ROUTES
        ══════════════════════════════════════════════════ */}
        <Route
          path="/directeur"
          element={
            <ProtectedRoute requiredRole={['DIRECTEUR', 'ADJOINT_DIRECTEUR']}>
              <DirecteurLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardDirecteurPage />} />
          <Route path="materiels" element={<MaterielsDirecteurPage />} />
          <Route path="besoins" element={<BesoinsDirecteurPage />} />
          <Route path="pannes" element={<PannesDirecteurPage />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ══════════════════════════════════════════════════
            UTILISATEUR FINAL ROUTES
        ══════════════════════════════════════════════════ */}
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole={['USER', 'UTILISATEUR']}>
              <UserLayout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<DashboardUserPage />} />
          <Route path="materiels" element={<MaterielsUserPage />} />
          <Route path="materiels/:id" element={<MaterielDetailPage />} />
          <Route path="pannes" element={<PannesUserPage />} />
          <Route path="pannes/new" element={<PanneCreatePageUser />} />
          <Route path="pannes/:id" element={<PanneDetailPageUser />} />
          <Route path="besoins" element={<BesoinsUserPage />} />
          <Route path="besoins/new" element={<BesoinCreatePageUser />} />
          <Route index element={<Navigate to="dashboard" replace />} />
        </Route>

        {/* ══════════════════════════════════════════════════
            DEFAULT REDIRECT
        ══════════════════════════════════════════════════ */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Suspense>
  );
}