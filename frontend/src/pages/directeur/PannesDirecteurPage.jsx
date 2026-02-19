// src/pages/directeur/PannesDirecteurPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions, Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Build as BuildIcon
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { directeurApi } from '../../services/directeurApi';

const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

const TYPE_PANNE_LABELS = {
  materielle: 'Matérielle',
  logicielle: 'Logicielle',
  reseau: 'Réseau',
  autre: 'Autre',
};

export default function PannesDirecteurPage() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [dashboard, setDashboard] = useState(null);
  const [selectedPanne, setSelectedPanne] = useState(null);
  const [loading, setLoading] = useState(false);
  const [detailDialog, setDetailDialog] = useState(false);
  const [dashboardDialog, setDashboardDialog] = useState(false);

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
      const res = await directeurApi.getDashboardPannes(filters.entite_id);
      setDashboard(res.data);
      setDashboardDialog(true);
    } catch (err) {
      console.error(err);
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🔧 Pannes informatiques
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          onClick={loadDashboard}
        >
          Dashboard
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                label="Rechercher"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="N° ticket, matériel..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Entité"
                value={filters.entite_id}
                onChange={(e) => handleFilterChange('entite_id', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                {entites.map(e => (
                  <MenuItem key={e.id} value={e.id}>{e.nom}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Service"
                value={filters.service_id}
                onChange={(e) => handleFilterChange('service_id', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                {services
                  .filter(s => !filters.entite_id || s.entite_id === parseInt(filters.entite_id))
                  .map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>
                  ))
                }
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Statut"
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
              <TextField
                fullWidth
                select
                label="Type"
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
              <TextField
                fullWidth
                select
                label="Priorité"
                value={filters.priorite}
                onChange={(e) => handleFilterChange('priorite', e.target.value)}
              >
                <MenuItem value="">Toutes</MenuItem>
                <MenuItem value="faible">Faible</MenuItem>
                <MenuItem value="moyenne">Moyenne</MenuItem>
                <MenuItem value="urgente">Urgente</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>N° Ticket</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Matériel</TableCell>
                    <TableCell>Entité</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Déclarant</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((panne) => (
                    <TableRow key={panne.id} hover>
                      <TableCell>
                        <Chip 
                          label={panne.numero_ticket} 
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={TYPE_PANNE_LABELS[panne.type_panne]}
                          size="small"
                          variant="outlined"
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
                      <TableCell>{panne.entite?.nom || 'N/A'}</TableCell>
                      <TableCell>{panne.service?.nom || 'N/A'}</TableCell>
                      <TableCell>
                        {panne.declarant 
                          ? `${panne.declarant.nom} ${panne.declarant.prenom}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={panne.priorite.charAt(0).toUpperCase() + panne.priorite.slice(1)}
                          size="small"
                          color={
                            panne.priorite === 'urgente' ? 'error' :
                            panne.priorite === 'moyenne' ? 'warning' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatutLabel(panne.statut)}
                          size="small"
                          sx={{ 
                            bgcolor: STATUT_COLORS[panne.statut],
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell align="center">
                        <Button
                          size="small"
                          startIcon={<VisibilityIcon />}
                          onClick={() => loadPanneDetail(panne.id)}
                        >
                          Détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
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

      {/* Dialog Détail Panne */}
      <Dialog 
        open={detailDialog} 
        onClose={() => setDetailDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <BuildIcon />
            Détail de la panne {selectedPanne?.numero_ticket}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedPanne && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                {/* Informations générales */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Informations générales
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Type de panne
                  </Typography>
                  <Chip 
                    label={TYPE_PANNE_LABELS[selectedPanne.type_panne]}
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Priorité
                  </Typography>
                  <Chip 
                    label={selectedPanne.priorite.charAt(0).toUpperCase() + selectedPanne.priorite.slice(1)}
                    color={
                      selectedPanne.priorite === 'urgente' ? 'error' :
                      selectedPanne.priorite === 'moyenne' ? 'warning' : 'default'
                    }
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                {/* Matériel concerné */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Matériel concerné
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Marque / Modèle
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {selectedPanne.materiel?.marque?.nom} - {selectedPanne.materiel?.model}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Catégorie
                  </Typography>
                  <Typography variant="body1">
                    {selectedPanne.materiel?.categorie?.nom}
                  </Typography>
                </Grid>

                {/* Localisation */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Localisation
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Entité
                  </Typography>
                  <Typography variant="body1">
                    {selectedPanne.entite?.nom || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1">
                    {selectedPanne.service?.nom || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Déclarant
                  </Typography>
                  <Typography variant="body1">
                    {selectedPanne.declarant 
                      ? `${selectedPanne.declarant.nom} ${selectedPanne.declarant.prenom}`
                      : 'N/A'
                    }
                  </Typography>
                </Grid>

                {/* Description */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Description du problème
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="body2">
                        {selectedPanne.description}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Diagnostic et solution */}
                {selectedPanne.diagnostic && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Diagnostic
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Card variant="outlined" sx={{ bgcolor: 'info.lighter' }}>
                      <CardContent>
                        <Typography variant="body2">
                          {selectedPanne.diagnostic}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {selectedPanne.solution && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Solution apportée
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                    <Card variant="outlined" sx={{ bgcolor: 'success.lighter' }}>
                      <CardContent>
                        <Typography variant="body2">
                          {selectedPanne.solution}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                )}

                {/* Technicien */}
                {selectedPanne.technicien && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Prise en charge
                    </Typography>
                    <Divider sx={{ mb: 2 }} />
                  </Grid>
                )}
                {selectedPanne.technicien && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Technicien
                      </Typography>
                      <Typography variant="body1">
                        {selectedPanne.technicien.nom} {selectedPanne.technicien.prenom}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <Typography variant="body2" color="text.secondary">
                        Date de prise en charge
                      </Typography>
                      <Typography variant="body1">
                        {selectedPanne.date_prise_en_charge 
                          ? new Date(selectedPanne.date_prise_en_charge).toLocaleDateString('fr-FR')
                          : 'N/A'
                        }
                      </Typography>
                    </Grid>
                  </>
                )}

                {/* Dates */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Chronologie
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Typography variant="body2" color="text.secondary">
                    Date de déclaration
                  </Typography>
                  <Typography variant="body1">
                    {new Date(selectedPanne.date_declaration).toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
                {selectedPanne.date_resolution && (
                  <>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Date de résolution
                      </Typography>
                      <Typography variant="body1">
                        {new Date(selectedPanne.date_resolution).toLocaleDateString('fr-FR')}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Typography variant="body2" color="text.secondary">
                        Délai de résolution
                      </Typography>
                      <Typography variant="body1" fontWeight={600} color="success.main">
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
          <Button onClick={() => setDetailDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Dashboard Pannes */}
      <Dialog 
        open={dashboardDialog} 
        onClose={() => setDashboardDialog(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>📊 Dashboard des pannes</DialogTitle>
        <DialogContent>
          {dashboard && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Stats globales */}
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Taux de résolution
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {dashboard.statistiques.indicateurs.taux_resolution}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Délai moyen
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {dashboard.statistiques.indicateurs.delai_moyen_resolution} j
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      En cours
                    </Typography>
                    <Typography variant="h4" color="info.main">
                      {dashboard.statistiques.global.en_cours}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Déclarées
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {dashboard.statistiques.global.declarees}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Évolution */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Évolution mensuelle
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboard.evolution}>
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
              </Grid>

              {/* Top matériels à problèmes */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Matériels à pannes récurrentes
                </Typography>
                <Card variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Matériel</TableCell>
                        <TableCell align="right">Nb pannes</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.top_materiels.slice(0, 5).map((item) => (
                        <TableRow key={item.materiel_id}>
                          <TableCell>
                            {item.materiel?.marque?.nom} - {item.materiel?.model}
                          </TableCell>
                          <TableCell align="right">
                            <Chip label={item.nb_pannes} size="small" color="error" />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Grid>

              {/* Pannes urgentes */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Pannes urgentes en attente
                </Typography>
                <Card variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Ticket</TableCell>
                        <TableCell>Service</TableCell>
                        <TableCell>Date</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {dashboard.urgentes.slice(0, 5).map((panne) => (
                        <TableRow key={panne.id}>
                          <TableCell>
                            <Chip label={panne.numero_ticket} size="small" />
                          </TableCell>
                          <TableCell>{panne.service?.nom}</TableCell>
                          <TableCell>
                            {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDashboardDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}