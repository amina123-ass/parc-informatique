// src/pages/directeur/DashboardDirecteurPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Grid, Card, CardContent, Typography, CircularProgress,
  Alert, Chip, LinearProgress
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Assignment as AssignmentIcon,
  Build as BuildIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { directeurApi } from '../../services/directeurApi';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card sx={{ height: '100%', position: 'relative', overflow: 'visible' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <Box>
            <Typography color="text.secondary" variant="body2" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" sx={{ fontWeight: 700, color }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              bgcolor: `${color}15`,
              p: 1.5,
              borderRadius: 2,
              color,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardDirecteurPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await directeurApi.getDashboard();
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const { vue_ensemble, repartition, evolution, indicateurs, alertes } = data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        📊 Tableau de bord directeur
      </Typography>

      {/* Alertes */}
      {(alertes.besoins_urgents_attente > 0 || alertes.pannes_urgentes_declarees > 0) && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            Alertes en cours :
          </Typography>
          {alertes.besoins_urgents_attente > 0 && (
            <Chip 
              label={`${alertes.besoins_urgents_attente} besoin(s) urgent(s) en attente`}
              color="warning"
              size="small"
              sx={{ mr: 1 }}
            />
          )}
          {alertes.pannes_urgentes_declarees > 0 && (
            <Chip 
              label={`${alertes.pannes_urgentes_declarees} panne(s) urgente(s) déclarée(s)`}
              color="error"
              size="small"
            />
          )}
        </Alert>
      )}

      {/* Vue d'ensemble */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Matériels affectés"
            value={vue_ensemble.materiels_affectes}
            subtitle={`/ ${vue_ensemble.total_materiels} total`}
            icon={<ComputerIcon />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Besoins en attente"
            value={vue_ensemble.besoins_en_attente}
            subtitle={`/ ${vue_ensemble.total_besoins} total`}
            icon={<AssignmentIcon />}
            color="#f093fb"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Pannes en cours"
            value={vue_ensemble.pannes_en_cours}
            subtitle={`/ ${vue_ensemble.total_pannes} total`}
            icon={<BuildIcon />}
            color="#ff6b6b"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taux de satisfaction"
            value={`${indicateurs.taux_satisfaction_besoins}%`}
            subtitle="Besoins validés"
            icon={<TrendingUpIcon />}
            color="#51cf66"
          />
        </Grid>
      </Grid>

      {/* Indicateurs de performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Taux de résolution des pannes
              </Typography>
              <Typography variant="h3" color="primary" sx={{ mb: 2 }}>
                {indicateurs.taux_resolution_pannes}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={indicateurs.taux_resolution_pannes} 
                sx={{ height: 8, borderRadius: 4 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Délai moyen de résolution
              </Typography>
              <Typography variant="h3" color="primary">
                {indicateurs.delai_moyen_resolution} jours
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Stock disponible
              </Typography>
              <Typography variant="h3" color="primary">
                {vue_ensemble.materiels_stock}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Matériels en stock
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3}>
        {/* Évolution des besoins */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des besoins et pannes (6 derniers mois)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolution.besoins}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#667eea" name="Besoins" strokeWidth={2} />
                  <Line type="monotone" dataKey="valides" stroke="#51cf66" name="Validés" strokeWidth={2} />
                  <Line type="monotone" dataKey="rejetes" stroke="#ff6b6b" name="Rejetés" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par entité */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Matériels par entité
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={repartition.materiels_par_entite}
                    dataKey="total"
                    nameKey="entite"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {repartition.materiels_par_entite.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Besoins par entité */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Besoins par entité
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={repartition.besoins_par_entite}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="entite" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Pannes par entité */}
        <Grid item xs={12} lg={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Pannes par entité
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={repartition.pannes_par_entite}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="entite" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#ff6b6b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}