// src/pages/directeur/PannesDirecteurPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider,
  Avatar, Stack, LinearProgress, Tabs, Tab, Badge, IconButton,
  Tooltip, Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  TrendingUp as TrendingUpIcon,
  FilterList as FilterListIcon,
  Refresh as RefreshIcon,
  Dashboard as DashboardIcon,
  ListAlt as ListAltIcon,
  Error as ErrorIcon,
  Speed as SpeedIcon,
  Hardware as HardwareIcon,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  Legend, ResponsiveContainer, AreaChart, Area, RadialBarChart,
  RadialBar
} from 'recharts';
import { directeurApi } from '../../services/directeurApi';

const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

const TYPE_PANNE_COLORS = {
  materielle: '#ef5350',
  logicielle: '#7e57c2',
  reseau: '#26c6da',
  autre: '#8d6e63',
};

const TYPE_PANNE_LABELS = {
  materielle: 'Matérielle',
  logicielle: 'Logicielle',
  reseau: 'Réseau',
  autre: 'Autre',
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, color, subtitle, trend }) {
  return (
    <Card
      sx={{
        height: '100%',
        background: `linear-gradient(135deg, ${color}18 0%, ${color}08 100%)`,
        border: `1px solid ${color}30`,
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: `0 8px 24px ${color}20` },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box display="flex" alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
              {label}
            </Typography>
            <Typography variant="h3" fontWeight={700} sx={{ color, lineHeight: 1.2, mt: 0.5 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar sx={{ bgcolor: `${color}20`, color, width: 48, height: 48 }}>
            {icon}
          </Avatar>
        </Box>
        {trend !== undefined && (
          <Box mt={1.5}>
            <LinearProgress
              variant="determinate"
              value={Math.min(trend, 100)}
              sx={{
                height: 4,
                borderRadius: 2,
                bgcolor: `${color}15`,
                '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 },
              }}
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Custom Tooltip pour Recharts ─────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <Paper sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
        <Typography variant="caption" fontWeight={700} display="block" mb={0.5}>{label}</Typography>
        {payload.map((entry, i) => (
          <Typography key={i} variant="caption" display="block" sx={{ color: entry.color }}>
            {entry.name}: <strong>{entry.value}</strong>
          </Typography>
        ))}
      </Paper>
    );
  }
  return null;
};

// ─── Composant Dashboard intégré ──────────────────────────────────────────────
function DashboardSection({ dashboard }) {
  if (!dashboard) return null;

  const { statistiques, evolution, urgentes, top_materiels } = dashboard;
  const { global: glob, indicateurs } = statistiques;

  const pieData = [
    { name: 'Déclarées', value: glob.declarees, color: STATUT_COLORS.declaree },
    { name: 'En cours', value: glob.en_cours, color: STATUT_COLORS.en_cours },
    { name: 'Résolues', value: glob.resolues, color: STATUT_COLORS.resolue },
  ].filter(d => d.value > 0);

  const parTypeData = (statistiques.par_type || []).map(pt => ({
    name: TYPE_PANNE_LABELS[pt.type_panne] || pt.type_panne,
    value: pt.total,
    fill: TYPE_PANNE_COLORS[pt.type_panne] || '#9e9e9e',
  }));

  return (
    <Box>
      {/* KPI Row */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<AssessmentIcon />}
            label="Total pannes"
            value={glob.total}
            color="#667eea"
            subtitle="Toutes périodes"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<CheckCircleIcon />}
            label="Taux résolution"
            value={`${indicateurs?.taux_resolution ?? 0}%`}
            color="#66bb6a"
            subtitle="Pannes résolues"
            trend={indicateurs?.taux_resolution ?? 0}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<SpeedIcon />}
            label="Délai moyen"
            value={`${indicateurs?.delai_moyen_resolution ?? 0}j`}
            color="#42a5f5"
            subtitle="Résolution moyenne"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            icon={<WarningIcon />}
            label="Urgentes"
            value={urgentes?.length ?? 0}
            color="#ef5350"
            subtitle="En attente"
          />
        </Grid>
      </Grid>

      {/* Charts Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Évolution mensuelle */}
        <Grid item xs={12} lg={8}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                📈 Évolution mensuelle (6 derniers mois)
              </Typography>
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={evolution} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gradResolues" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#66bb6a" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#66bb6a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="mois" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RechartsTooltip content={<CustomTooltip />} />
                  <Legend />
                  <Area type="monotone" dataKey="total" stroke="#667eea" fill="url(#gradTotal)" name="Total" strokeWidth={2} dot={{ r: 3 }} />
                  <Area type="monotone" dataKey="resolues" stroke="#66bb6a" fill="url(#gradResolues)" name="Résolues" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="en_cours" stroke="#42a5f5" name="En cours" strokeWidth={2} strokeDasharray="4 4" dot={{ r: 3 }} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par statut */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🍩 Répartition par statut
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
              <Stack spacing={0.5} sx={{ mt: 1 }}>
                {pieData.map((d) => (
                  <Box key={d.name} display="flex" alignItems="center" justifyContent="space-between">
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.color }} />
                      <Typography variant="caption">{d.name}</Typography>
                    </Box>
                    <Typography variant="caption" fontWeight={700}>{d.value}</Typography>
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Par type */}
        {parTypeData.length > 0 && (
          <Grid item xs={12} sm={6} lg={4}>
            <Card sx={{ borderRadius: 3, height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  🔩 Par type de panne
                </Typography>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={parTypeData} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} width={75} />
                    <RechartsTooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Nb" radius={[0, 4, 4, 0]}>
                      {parTypeData.map((entry, i) => (
                        <Cell key={i} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Top matériels */}
        <Grid item xs={12} sm={6} lg={4}>
          <Card sx={{ borderRadius: 3, height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                🖥️ Matériels à pannes récurrentes
              </Typography>
              <Stack spacing={1} sx={{ mt: 1 }}>
                {(top_materiels || []).slice(0, 6).map((item, i) => (
                  <Box key={item.materiel_id}>
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={0.3}>
                      <Typography variant="caption" noWrap sx={{ maxWidth: 160 }}>
                        {item.materiel?.marque?.nom} {item.materiel?.model}
                      </Typography>
                      <Chip label={item.nb_pannes} size="small" color="error" sx={{ height: 18, fontSize: 11 }} />
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={(item.nb_pannes / (top_materiels[0]?.nb_pannes || 1)) * 100}
                      sx={{
                        height: 5,
                        borderRadius: 2,
                        bgcolor: '#fee',
                        '& .MuiLinearProgress-bar': {
                          bgcolor: i === 0 ? '#ef5350' : i === 1 ? '#ff7043' : '#ffa726',
                          borderRadius: 2,
                        },
                      }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        {/* Pannes urgentes */}
        <Grid item xs={12} lg={4}>
          <Card sx={{ borderRadius: 3, border: '1px solid #ef535030', height: '100%' }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                <ErrorIcon color="error" fontSize="small" />
                <Typography variant="h6" fontWeight={700} color="error.main">
                  Urgentes en attente
                </Typography>
                <Chip label={urgentes?.length ?? 0} size="small" color="error" />
              </Box>
              <Stack spacing={1}>
                {(urgentes || []).slice(0, 5).map((panne) => (
                  <Box
                    key={panne.id}
                    sx={{
                      p: 1,
                      borderRadius: 1.5,
                      bgcolor: '#fff8f8',
                      border: '1px solid #ffcdd2',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Box>
                      <Chip label={panne.numero_ticket} size="small" sx={{ fontSize: 11, height: 18, mr: 1 }} />
                      <Typography variant="caption" color="text.secondary">
                        {panne.service?.nom}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                    </Typography>
                  </Box>
                ))}
                {(!urgentes || urgentes.length === 0) && (
                  <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                    ✅ Aucune panne urgente en attente
                  </Typography>
                )}
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────────
export default function PannesDirecteurPage() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [dashboard, setDashboard] = useState(null);
  const [dashboardLoading, setDashboardLoading] = useState(false);
  const [selectedPanne, setSelectedPanne] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0=Dashboard, 1=Liste

  const [entites, setEntites] = useState([]);
  const [services, setServices] = useState([]);

  const [filters, setFilters] = useState({
    entite_id: '',
    service_id: '',
    statut: '',
    priorite: '',
    type_panne: '',
    date_from: '',
    date_to: '',
    search: '',
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    loadReferentials();
  }, []);

  useEffect(() => {
    loadPannes();
  }, [filters]);

  useEffect(() => {
    loadDashboard();
  }, [filters.entite_id]);

  const loadReferentials = async () => {
    try {
      const [entitesRes, servicesRes] = await Promise.all([
        directeurApi.getEntites(),
        directeurApi.getServices(),
      ]);
      setEntites(entitesRes.data);
      setServices(servicesRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPannes = async () => {
    try {
      setLoading(true);
      const res = await directeurApi.getPannes(filters);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      setDashboardLoading(true);
      const res = await directeurApi.getDashboardPannes(filters.entite_id);
      setDashboard(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDashboardLoading(false);
    }
  };

  const loadPanneDetail = async (id) => {
    try {
      const res = await directeurApi.getPanne(id);
      setSelectedPanne(res.data);
      setDetailDialog(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const getStatutLabel = (statut) => {
    const labels = {
      declaree: 'Déclarée',
      en_cours: 'En cours',
      resolue: 'Résolue',
      annulee: 'Annulée',
    };
    return labels[statut] || statut;
  };

  const urgentesCount = dashboard?.urgentes?.length ?? 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            🔧 Pannes informatiques
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Supervision et suivi des incidents techniques
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Tooltip title="Rafraîchir les données">
            <IconButton onClick={() => { loadPannes(); loadDashboard(); }} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Filtres globaux (entité) toujours visibles */}
      <Card sx={{ mb: 2, borderRadius: 3 }}>
        <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <FilterListIcon color="action" fontSize="small" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                select
                size="small"
                label="Entité"
                value={filters.entite_id}
                onChange={(e) => handleFilterChange('entite_id', e.target.value)}
              >
                <MenuItem value="">Toutes les entités</MenuItem>
                {entites.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tabs Dashboard / Liste */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            label="Dashboard"
            icon={<DashboardIcon fontSize="small" />}
            iconPosition="start"
          />
          <Tab
            label={
              <Box display="flex" alignItems="center" gap={1}>
                Liste des pannes
                {urgentesCount > 0 && (
                  <Badge badgeContent={urgentesCount} color="error" sx={{ ml: 1 }} />
                )}
              </Box>
            }
            icon={<ListAltIcon fontSize="small" />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* ── TAB 0 : DASHBOARD ── */}
      {activeTab === 0 && (
        dashboardLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={8}>
            <CircularProgress />
          </Box>
        ) : (
          <DashboardSection dashboard={dashboard} />
        )
      )}

      {/* ── TAB 1 : LISTE ── */}
      {activeTab === 1 && (
        <>
          {/* Filtres avancés */}
          <Card sx={{ mb: 3, borderRadius: 3 }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Rechercher"
                    value={filters.search}
                    onChange={(e) => handleFilterChange('search', e.target.value)}
                    placeholder="N° ticket, matériel..."
                    size="small"
                    InputProps={{
                      startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active', fontSize: 18 }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth select size="small" label="Service"
                    value={filters.service_id}
                    onChange={(e) => handleFilterChange('service_id', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    {services
                      .filter(s => !filters.entite_id || s.entite_id === parseInt(filters.entite_id))
                      .map(s => <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>)
                    }
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth select size="small" label="Statut"
                    value={filters.statut}
                    onChange={(e) => handleFilterChange('statut', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="declaree">Déclarée</MenuItem>
                    <MenuItem value="en_cours">En cours</MenuItem>
                    <MenuItem value="resolue">Résolue</MenuItem>
                    <MenuItem value="annulee">Annulée</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth select size="small" label="Type"
                    value={filters.type_panne}
                    onChange={(e) => handleFilterChange('type_panne', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="materielle">Matérielle</MenuItem>
                    <MenuItem value="logicielle">Logicielle</MenuItem>
                    <MenuItem value="reseau">Réseau</MenuItem>
                    <MenuItem value="autre">Autre</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth select size="small" label="Priorité"
                    value={filters.priorite}
                    onChange={(e) => handleFilterChange('priorite', e.target.value)}
                  >
                    <MenuItem value="">Toutes</MenuItem>
                    <MenuItem value="faible">Faible</MenuItem>
                    <MenuItem value="moyenne">Moyenne</MenuItem>
                    <MenuItem value="urgente">Urgente</MenuItem>
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth size="small" type="date" label="Du"
                    InputLabelProps={{ shrink: true }}
                    value={filters.date_from}
                    onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={2}>
                  <TextField fullWidth size="small" type="date" label="Au"
                    InputLabelProps={{ shrink: true }}
                    value={filters.date_to}
                    onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Tableau */}
          <Card sx={{ borderRadius: 3 }}>
            {loading ? (
              <Box display="flex" justifyContent="center" p={4}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 700 }}>N° Ticket</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Matériel</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Entité</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Déclarant</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Priorité</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.data.map((panne) => (
                        <TableRow key={panne.id} hover>
                          <TableCell>
                            <Chip label={panne.numero_ticket} size="small" color="primary" sx={{ fontSize: 11 }} />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={TYPE_PANNE_LABELS[panne.type_panne]}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: 11, borderColor: TYPE_PANNE_COLORS[panne.type_panne], color: TYPE_PANNE_COLORS[panne.type_panne] }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {panne.materiel?.marque?.nom}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {panne.materiel?.model}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{panne.entite?.nom || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">{panne.service?.nom || 'N/A'}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {panne.declarant ? `${panne.declarant.nom} ${panne.declarant.prenom}` : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={panne.priorite.charAt(0).toUpperCase() + panne.priorite.slice(1)}
                              size="small"
                              color={
                                panne.priorite === 'urgente' ? 'error' :
                                panne.priorite === 'moyenne' ? 'warning' : 'default'
                              }
                              sx={{ fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={getStatutLabel(panne.statut)}
                              size="small"
                              sx={{ bgcolor: STATUT_COLORS[panne.statut], color: 'white', fontSize: 11 }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <Tooltip title="Voir les détails">
                              <IconButton size="small" onClick={() => loadPanneDetail(panne.id)} color="primary">
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                      {data.data.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">Aucune panne trouvée</Typography>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <TablePagination
                  component="div"
                  count={data.total || 0}
                  page={filters.page - 1}
                  onPageChange={(e, newPage) => handleFilterChange('page', newPage + 1)}
                  rowsPerPage={filters.per_page}
                  onRowsPerPageChange={(e) => handleFilterChange('per_page', parseInt(e.target.value))}
                  labelRowsPerPage="Lignes par page:"
                  labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
                />
              </>
            )}
          </Card>
        </>
      )}

      {/* ── Dialog Détail Panne ── */}
      <Dialog
        open={detailDialog}
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon color="primary" />
            <Typography fontWeight={700}>
              Détail — {selectedPanne?.numero_ticket}
            </Typography>
            {selectedPanne && (
              <Chip
                label={getStatutLabel(selectedPanne.statut)}
                size="small"
                sx={{ bgcolor: STATUT_COLORS[selectedPanne?.statut], color: 'white', ml: 1 }}
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPanne && (
            <Box sx={{ mt: 1 }}>
              <Grid container spacing={2.5}>
                {/* Infos générales */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Informations générales
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Type de panne</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={TYPE_PANNE_LABELS[selectedPanne.type_panne]}
                      size="small"
                      sx={{ bgcolor: TYPE_PANNE_COLORS[selectedPanne.type_panne], color: 'white' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6} sm={3}>
                  <Typography variant="caption" color="text.secondary">Priorité</Typography>
                  <Box mt={0.5}>
                    <Chip
                      label={selectedPanne.priorite.charAt(0).toUpperCase() + selectedPanne.priorite.slice(1)}
                      size="small"
                      color={selectedPanne.priorite === 'urgente' ? 'error' : selectedPanne.priorite === 'moyenne' ? 'warning' : 'default'}
                    />
                  </Box>
                </Grid>

                {/* Matériel */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Matériel concerné
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Marque / Modèle</Typography>
                  <Typography variant="body2" fontWeight={600}>
                    {selectedPanne.materiel?.marque?.nom} — {selectedPanne.materiel?.model}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="caption" color="text.secondary">Catégorie</Typography>
                  <Typography variant="body2">{selectedPanne.materiel?.categorie?.nom}</Typography>
                </Grid>

                {/* Localisation */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Localisation
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Entité</Typography>
                  <Typography variant="body2">{selectedPanne.entite?.nom || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Service</Typography>
                  <Typography variant="body2">{selectedPanne.service?.nom || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Déclarant</Typography>
                  <Typography variant="body2">
                    {selectedPanne.declarant
                      ? `${selectedPanne.declarant.nom} ${selectedPanne.declarant.prenom}`
                      : 'N/A'}
                  </Typography>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Description du problème
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">{selectedPanne.description}</Typography>
                  </Paper>
                </Grid>

                {/* Diagnostic */}
                {selectedPanne.diagnostic && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={700} color="info.main" gutterBottom>
                      Diagnostic
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'info.lighter', borderColor: 'info.light' }}>
                      <Typography variant="body2">{selectedPanne.diagnostic}</Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Solution */}
                {selectedPanne.solution && (
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" fontWeight={700} color="success.main" gutterBottom>
                      Solution apportée
                    </Typography>
                    <Divider sx={{ mb: 1.5 }} />
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'success.lighter', borderColor: 'success.light' }}>
                      <Typography variant="body2">{selectedPanne.solution}</Typography>
                    </Paper>
                  </Grid>
                )}

                {/* Technicien */}
                {selectedPanne.technicien && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                        Prise en charge
                      </Typography>
                      <Divider sx={{ mb: 1.5 }} />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Technicien</Typography>
                      <Typography variant="body2">
                        {selectedPanne.technicien.nom} {selectedPanne.technicien.prenom}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="caption" color="text.secondary">Date de prise en charge</Typography>
                      <Typography variant="body2">
                        {selectedPanne.date_prise_en_charge
                          ? new Date(selectedPanne.date_prise_en_charge).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </Typography>
                    </Grid>
                  </>
                )}

                {/* Chronologie */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" fontWeight={700} color="primary" gutterBottom>
                    Chronologie
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="caption" color="text.secondary">Déclaration</Typography>
                  <Typography variant="body2">
                    {new Date(selectedPanne.date_declaration).toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
                {selectedPanne.date_resolution && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Résolution</Typography>
                      <Typography variant="body2">
                        {new Date(selectedPanne.date_resolution).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="caption" color="text.secondary">Délai</Typography>
                      <Typography variant="body2" fontWeight={700} color="success.main">
                        {Math.ceil(
                          (new Date(selectedPanne.date_resolution) - new Date(selectedPanne.date_declaration))
                          / (1000 * 60 * 60 * 24)
                        )} jours
                      </Typography>
                    </Grid>
                  </>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialog(false)} variant="contained">Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}