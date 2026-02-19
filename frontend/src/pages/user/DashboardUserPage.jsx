// src/pages/user/DashboardUserPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, CircularProgress,
  Alert, Table, TableBody, TableCell, TableHead, TableRow, Chip, Button
} from '@mui/material';
import {
  Computer as ComputerIcon,
  Build as BuildIcon,
  RequestPage as RequestPageIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/userApi';

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
          <Box sx={{ bgcolor: `${color}15`, p: 1.5, borderRadius: 2, color }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardUserPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await userApi.getDashboard();
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

  const { compteurs, dernieres_affectations, derniers_besoins, dernieres_pannes } = data;

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        👋 Bienvenue dans votre espace
      </Typography>

      {/* Alertes */}
      {compteurs.pannes_declarees > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }} icon={<WarningIcon />}>
          Vous avez {compteurs.pannes_declarees} panne(s) en attente de prise en charge
        </Alert>
      )}

      {/* KPIs */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Matériel affecté"
            value={compteurs.materiel_affecte}
            icon={<ComputerIcon />}
            color="#2196f3"
            subtitle="Actuellement"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Pannes déclarées"
            value={compteurs.pannes_declarees}
            icon={<BuildIcon />}
            color="#ff9800"
            subtitle={`${compteurs.pannes_en_cours} en cours`}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            title="Besoins en attente"
            value={compteurs.besoins_en_attente}
            icon={<RequestPageIcon />}
            color="#9c27b0"
            subtitle={`${compteurs.besoins_valides} validés`}
          />
        </Grid>
      </Grid>

      {/* Actions rapides */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Actions rapides
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<BuildIcon />}
              onClick={() => navigate('/user/pannes/new')}
              color="error"
            >
              Déclarer une panne
            </Button>
            <Button
              variant="outlined"
              startIcon={<RequestPageIcon />}
              onClick={() => navigate('/user/besoins/new')}
            >
              Faire une demande
            </Button>
            <Button
              variant="outlined"
              startIcon={<ComputerIcon />}
              onClick={() => navigate('/user/materiels')}
            >
              Voir mon matériel
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Mon matériel */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Mon matériel</Typography>
                <Button size="small" onClick={() => navigate('/user/materiels')}>
                  Tout voir
                </Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Équipement</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Depuis</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dernieres_affectations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucun matériel affecté
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dernieres_affectations.map((aff) => (
                      <TableRow key={aff.id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {aff.materiel?.marque?.nom}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {aff.materiel?.model}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={aff.materiel?.sous_categorie?.nom}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(aff.date_affectation).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Mes pannes */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Mes pannes récentes</Typography>
                <Button size="small" onClick={() => navigate('/user/pannes')}>
                  Tout voir
                </Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>N° Ticket</TableCell>
                    <TableCell>Matériel</TableCell>
                    <TableCell>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {dernieres_pannes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune panne déclarée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    dernieres_pannes.map((panne) => (
                      <TableRow key={panne.id} hover>
                        <TableCell>
                          <Chip label={panne.numero_ticket} size="small" color="primary" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {panne.materiel?.marque?.nom}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={panne.statut}
                            size="small"
                            color={
                              panne.statut === 'resolue' ? 'success' :
                              panne.statut === 'en_cours' ? 'info' : 'warning'
                            }
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        {/* Mes besoins */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Mes demandes récentes</Typography>
                <Button size="small" onClick={() => navigate('/user/besoins')}>
                  Tout voir
                </Button>
              </Box>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {derniers_besoins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography variant="body2" color="text.secondary">
                          Aucune demande
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    derniers_besoins.map((besoin) => (
                      <TableRow key={besoin.id} hover>
                        <TableCell>
                          <Chip label={besoin.type_besoin} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {besoin.description}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={besoin.priorite}
                            size="small"
                            color={besoin.priorite === 'urgente' ? 'error' : 'default'}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={besoin.statut}
                            size="small"
                            color={
                              besoin.statut === 'valide' ? 'success' :
                              besoin.statut === 'en_cours' ? 'info' :
                              besoin.statut === 'rejete' ? 'error' : 'warning'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          {new Date(besoin.date_demande).toLocaleDateString('fr-FR')}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}