// src/pages/admin-parc/PannesDashboardPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Alert, Chip, Table, TableBody, TableCell, TableHead, TableRow,
  LinearProgress, Paper
} from '@mui/material';
import {
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { panneApi } from '../../services/panneApi';

const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe'];
const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card sx={{ height: '100%' }}>
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

export default function PannesDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await panneApi.getDashboard();
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

  const { compteurs, par_type, par_priorite, evolution, urgentes, top_materiels, dernieres_resolues } = data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        📊 Dashboard des Pannes
      </Typography>

      {/* Alertes urgentes */}
      {urgentes.length > 0 && (
        <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
          <Typography variant="subtitle2" gutterBottom>
            {urgentes.length} panne(s) urgente(s) en attente de prise en charge
          </Typography>
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total des pannes"
            value={compteurs.total}
            icon={<BuildIcon />}
            color="#667eea"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="En attente"
            value={compteurs.declarees}
            subtitle="À prendre en charge"
            icon={<WarningIcon />}
            color="#ffa726"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Taux de résolution"
            value={`${compteurs.taux_resolution}%`}
            subtitle={`${compteurs.resolues} résolues`}
            icon={<CheckCircleIcon />}
            color="#66bb6a"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Délai moyen"
            value={`${compteurs.delai_moyen} j`}
            subtitle="Temps de résolution"
            icon={<TrendingUpIcon />}
            color="#42a5f5"
          />
        </Grid>
      </Grid>

      {/* Indicateur de performance */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Répartition par statut
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Déclarées</Typography>
                      <Typography variant="body2" fontWeight={600}>{compteurs.declarees}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(compteurs.declarees / compteurs.total) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0' }}
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">En cours</Typography>
                      <Typography variant="body2" fontWeight={600}>{compteurs.en_cours}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(compteurs.en_cours / compteurs.total) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0' }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={6}>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Résolues</Typography>
                      <Typography variant="body2" fontWeight={600}>{compteurs.resolues}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(compteurs.resolues / compteurs.total) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0' }}
                      color="success"
                    />
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Annulées</Typography>
                      <Typography variant="body2" fontWeight={600}>{compteurs.annulees}</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={(compteurs.annulees / compteurs.total) * 100} 
                      sx={{ height: 8, borderRadius: 4, bgcolor: '#f0f0f0' }}
                    />
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Répartition par priorité
              </Typography>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={par_priorite}
                    dataKey="total"
                    nameKey="priorite"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label
                  >
                    {par_priorite.map((entry, index) => (
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
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Évolution */}
        <Grid item xs={12} lg={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Évolution des pannes (6 derniers mois)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#667eea" name="Total" strokeWidth={2} />
                  <Line type="monotone" dataKey="resolues" stroke="#66bb6a" name="Résolues" strokeWidth={2} />
                  <Line type="monotone" dataKey="en_cours" stroke="#42a5f5" name="En cours" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Par type */}
        <Grid item xs={12} lg={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Par type de panne
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={par_type}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type_panne" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="total" fill="#667eea" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Tableaux */}
      <Grid container spacing={3}>
        {/* Pannes urgentes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Pannes urgentes en attente
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Ticket</TableCell>
                    <TableCell>Matériel</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Depuis</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {urgentes.slice(0, 5).map((panne) => (
                    <TableRow key={panne.id} hover>
                      <TableCell>
                        <Chip label={panne.numero_ticket} size="small" color="error" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">
                          {panne.materiel?.marque?.nom}
                        </Typography>
                      </TableCell>
                      <TableCell>{panne.service?.nom}</TableCell>
                      <TableCell>
                        {Math.ceil(
                          (new Date() - new Date(panne.date_declaration)) / (1000 * 60 * 60 * 24)
                        )} j
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {urgentes.length === 0 && (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Aucune panne urgente en attente
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Top matériels */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Matériels à pannes récurrentes
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Matériel</TableCell>
                    <TableCell>Marque</TableCell>
                    <TableCell align="right">Nb pannes</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {top_materiels.slice(0, 5).map((item) => (
                    <TableRow key={item.materiel_id} hover>
                      <TableCell>
                        <Typography variant="body2">
                          {item.materiel?.model}
                        </Typography>
                      </TableCell>
                      <TableCell>{item.materiel?.marque?.nom}</TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={item.nb_pannes} 
                          size="small" 
                          color="error"
                          variant="outlined"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Dernières résolutions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Dernières pannes résolues
              </Typography>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Ticket</TableCell>
                    <TableCell>Matériel</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Technicien</TableCell>
                    <TableCell>Date résolution</TableCell>
                    <TableCell>Délai</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dernieres_resolues.map((panne) => (
                    <TableRow key={panne.id} hover>
                      <TableCell>
                        <Chip label={panne.numero_ticket} size="small" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {panne.materiel?.marque?.nom} {panne.materiel?.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label={panne.type_panne} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        {panne.technicien 
                          ? `${panne.technicien.nom} ${panne.technicien.prenom}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        {new Date(panne.date_resolution).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={`${Math.ceil(
                            (new Date(panne.date_resolution) - new Date(panne.date_declaration)) 
                            / (1000 * 60 * 60 * 24)
                          )} j`}
                          size="small"
                          color="success"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}