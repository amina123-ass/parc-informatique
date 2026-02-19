// src/pages/admin-parc/DashboardAdminParcPage.jsx

import { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Divider,
  LinearProgress,
} from '@mui/material';
import {
  Inventory as InventoryIcon,
  Assignment as AssignmentIcon,
  RequestPage as RequestIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  Storage as StorageIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';
import toast from 'react-hot-toast';

const COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  purple: '#9c27b0',
  teal: '#00897b',
};

const PIE_COLORS = [
  '#1976d2',
  '#2e7d32',
  '#ed6c02',
  '#d32f2f',
  '#9c27b0',
  '#00897b',
  '#f57c00',
  '#5e35b1',
];

// ─────────────────────────────────────────────────
// Composant: Carte de statistique
// ─────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon: Icon, color, trend, loading }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box flex={1}>
            <Typography color="text.secondary" variant="overline" gutterBottom>
              {title}
            </Typography>
            {loading ? (
              <CircularProgress size={24} sx={{ my: 1 }} />
            ) : (
              <>
                <Typography variant="h3" component="div" fontWeight="bold" color={color}>
                  {value?.toLocaleString('fr-FR') ?? 0}
                </Typography>
                {subtitle && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {subtitle}
                  </Typography>
                )}
                {trend !== undefined && trend !== null && (
                  <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                    <TrendingUpIcon fontSize="small" color={trend > 0 ? 'success' : 'error'} />
                    <Typography variant="caption" color={trend > 0 ? 'success.main' : 'error.main'}>
                      {trend > 0 ? '+' : ''}{trend}% ce mois
                    </Typography>
                  </Box>
                )}
              </>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: color === 'primary.main' ? 'primary.lighter' : 
                       color === 'success.main' ? 'success.lighter' :
                       color === 'warning.main' ? 'warning.lighter' :
                       color === 'info.main' ? 'info.lighter' : 'grey.100',
              borderRadius: 2,
              p: 1.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Icon sx={{ fontSize: 40, color }} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// Composant: Carte d'alerte
// ─────────────────────────────────────────────────
function AlertCard({ title, value, icon: Icon, severity = 'info' }) {
  return (
    <Alert
      severity={severity}
      icon={<Icon />}
      sx={{
        '& .MuiAlert-icon': { fontSize: 28 },
        '& .MuiAlert-message': { width: '100%' },
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center">
        <Typography variant="body2">{title}</Typography>
        <Chip label={value} color={severity} size="small" />
      </Box>
    </Alert>
  );
}

// ─────────────────────────────────────────────────
// Composant: Affectations récentes
// ─────────────────────────────────────────────────
function RecentAffectations({ affectations }) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          <AssignmentIcon color="primary" />
          Affectations Récentes
        </Typography>
        <Divider sx={{ my: 2 }} />

        {!affectations || affectations.length === 0 ? (
          <Typography color="text.secondary" variant="body2">
            Aucune affectation récente
          </Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {affectations.map((aff) => (
              <Paper key={aff.id} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="subtitle2" fontWeight="bold">
                      {aff.materiel} - {aff.marque}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {aff.user} • {aff.service}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(aff.date).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                  <Chip
                    label={aff.status === 'ACTIVE' ? 'Active' : 'Retournée'}
                    color={aff.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
              </Paper>
            ))}
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─────────────────────────────────────────────────
// PAGE PRINCIPALE
// ─────────────────────────────────────────────────
export default function DashboardAdminParcPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin-parc/dashboard');
      setData(res.data);
    } catch (error) {
      console.error('Erreur dashboard:', error);
      toast.error('Erreur lors du chargement du dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading && !data) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* ── En-tête ───────────────────────────── */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            Tableau de Bord - Gestion du Parc
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Vue d'ensemble des matériels, affectations et besoins
          </Typography>
        </Box>
        <Tooltip title="Actualiser">
          <IconButton onClick={fetchDashboard} disabled={loading} color="primary">
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && <LinearProgress sx={{ mb: 2 }} />}

      <Grid container spacing={3}>
        {/* ── Cartes de statistiques principales ──────────── */}
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Matériels"
            value={data?.materiels?.total}
            subtitle={`${data?.materiels?.recents || 0} ce mois`}
            icon={InventoryIcon}
            color="primary.main"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Affectations Actives"
            value={data?.affectations?.actives}
            subtitle={`${data?.affectations?.total || 0} au total`}
            icon={AssignmentIcon}
            color="success.main"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Besoins en Attente"
            value={data?.besoins?.en_attente}
            subtitle={`${data?.besoins?.urgents || 0} urgents`}
            icon={RequestIcon}
            color="warning.main"
            loading={loading}
          />
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taux de Satisfaction"
            value={`${data?.besoins?.taux_satisfaction || 0}%`}
            subtitle={`${data?.besoins?.valides || 0} validés`}
            icon={CheckCircleIcon}
            color="info.main"
            loading={loading}
          />
        </Grid>

        {/* ── Alertes ──────────────────────────────────────── */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <AlertCard
                title="Matériels en stock"
                value={data?.alertes?.materiels_en_stock || 0}
                icon={StorageIcon}
                severity="info"
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AlertCard
                title="Besoins urgents"
                value={data?.alertes?.besoins_urgents || 0}
                icon={WarningIcon}
                severity={data?.alertes?.besoins_urgents > 0 ? 'warning' : 'success'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AlertCard
                title="Besoins en attente"
                value={data?.alertes?.besoins_en_attente || 0}
                icon={RequestIcon}
                severity={data?.alertes?.besoins_en_attente > 5 ? 'warning' : 'info'}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <AlertCard
                title="Nouveaux matériels"
                value={data?.alertes?.materiels_recents || 0}
                icon={PersonAddIcon}
                severity="success"
              />
            </Grid>
          </Grid>
        </Grid>

        {/* ── État des matériels (Pie Chart) ─────────────── */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                État des Matériels
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'En Stock', value: data?.materiels?.en_stock || 0 },
                      { name: 'Affecté', value: data?.materiels?.affecte || 0 },
                      { name: 'Réformé', value: data?.materiels?.reforme || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[COLORS.info, COLORS.success, COLORS.error].map((color, index) => (
                      <Cell key={`cell-${index}`} fill={color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Statut des besoins (Pie Chart) ─────────────── */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Statut des Besoins
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'En attente', value: data?.besoins?.en_attente || 0 },
                      { name: 'En cours', value: data?.besoins?.en_cours || 0 },
                      { name: 'Validés', value: data?.besoins?.valides || 0 },
                      { name: 'Rejetés', value: data?.besoins?.rejetes || 0 },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) =>
                      percent > 0 ? `${name}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[COLORS.warning, COLORS.info, COLORS.success, COLORS.error].map(
                      (color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      )
                    )}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Types de besoins (Pie Chart) ──────────────── */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Besoins par Type
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data?.besoins?.par_type || []}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, percent }) =>
                      percent > 0.05 ? `${type}: ${(percent * 100).toFixed(0)}%` : ''
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="total"
                    nameKey="type"
                  >
                    {(data?.besoins?.par_type || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Évolution matériels (Line Chart) ──────────── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des Matériels (6 mois)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.evolution?.materiels || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.primary}
                    strokeWidth={2}
                    name="Matériels"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Évolution affectations (Line Chart) ────────── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des Affectations (6 mois)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.evolution?.affectations || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Affectations"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Matériels par catégorie (Bar Chart) ────────── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Matériels par Catégorie
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.materiels?.par_categorie || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="categorie" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" fill={COLORS.primary} name="Quantité" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Affectations par service (Bar Chart) ──────── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top 10 Services (Affectations Actives)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data?.affectations?.par_service || []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="service" type="category" width={150} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total" fill={COLORS.success} name="Affectations" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Évolution besoins (Line Chart) ───────────────*/}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des Besoins (6 mois)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data?.evolution?.besoins || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="total"
                    stroke={COLORS.info}
                    strokeWidth={2}
                    name="Total Besoins"
                  />
                  <Line
                    type="monotone"
                    dataKey="valides"
                    stroke={COLORS.success}
                    strokeWidth={2}
                    name="Validés"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* ── Affectations récentes ────────────────────────*/}
        <Grid item xs={12}>
          <RecentAffectations affectations={data?.affectations?.recentes} />
        </Grid>
      </Grid>
    </Box>
  );
}