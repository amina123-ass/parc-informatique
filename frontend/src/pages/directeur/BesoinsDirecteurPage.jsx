// src/pages/directeur/BesoinsDirecteurPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, Button,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import {
  PieChart, Pie, Cell, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { directeurApi } from '../../services/directeurApi';

const STATUT_COLORS = {
  en_attente: '#ffa726',
  en_cours: '#42a5f5',
  valide: '#66bb6a',
  rejete: '#ef5350',
};

const PRIORITE_COLORS = {
  faible: '#90caf9',
  moyenne: '#ffa726',
  urgente: '#ef5350',
};

export default function BesoinsDirecteurPage() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [statsDialog, setStatsDialog] = useState(false);

  const [entites, setEntites] = useState([]);
  const [services, setServices] = useState([]);

  const [filters, setFilters] = useState({
    entite_id: '',
    service_id: '',
    statut: '',
    priorite: '',
    type_besoin: '',
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
    loadBesoins();
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

  const loadBesoins = async () => {
    try {
      setLoading(true);
      const res = await directeurApi.getBesoins(filters);
      setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistiques = async () => {
    try {
      const res = await directeurApi.getStatistiquesBesoins(filters.entite_id);
      setStats(res.data);
      setStatsDialog(true);
    } catch (err) {
      console.error(err);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const getStatutLabel = (statut) => {
    const labels = {
      en_attente: 'En attente',
      en_cours: 'En cours',
      valide: 'Validé',
      rejete: 'Rejeté',
    };
    return labels[statut] || statut;
  };

  const getPrioriteLabel = (priorite) => {
    const labels = {
      faible: 'Faible',
      moyenne: 'Moyenne',
      urgente: 'Urgente',
    };
    return labels[priorite] || priorite;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📋 Besoins
        </Typography>
        <Button
          variant="contained"
          startIcon={<AssessmentIcon />}
          onClick={loadStatistiques}
        >
          Statistiques
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
                placeholder="Désignation, ID..."
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
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="en_cours">En cours</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="rejete">Rejeté</MenuItem>
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
            <Grid item xs={12} sm={6} md={2}>
              <TextField
                fullWidth
                select
                label="Type"
                value={filters.type_besoin}
                onChange={(e) => handleFilterChange('type_besoin', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="PC">PC</MenuItem>
                <MenuItem value="imprimante">Imprimante</MenuItem>
                <MenuItem value="cartouche">Cartouche</MenuItem>
                <MenuItem value="autre">Autre</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date de début"
                value={filters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                type="date"
                label="Date de fin"
                value={filters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
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
                    <TableCell>ID</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Désignation</TableCell>
                    <TableCell>Entité</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Demandeur</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((besoin) => (
                    <TableRow key={besoin.id} hover>
                      <TableCell>
                        <Chip label={`#${besoin.id}`} size="small" />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={besoin.type_besoin} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {besoin.designation}
                        </Typography>
                      </TableCell>
                      <TableCell>{besoin.entite?.nom || 'N/A'}</TableCell>
                      <TableCell>{besoin.service?.nom || 'N/A'}</TableCell>
                      <TableCell>
                        {besoin.utilisateur 
                          ? `${besoin.utilisateur.nom} ${besoin.utilisateur.prenom}`
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getPrioriteLabel(besoin.priorite)}
                          size="small"
                          sx={{ 
                            bgcolor: PRIORITE_COLORS[besoin.priorite],
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatutLabel(besoin.statut)}
                          size="small"
                          sx={{ 
                            bgcolor: STATUT_COLORS[besoin.statut],
                            color: 'white'
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {new Date(besoin.date_demande).toLocaleDateString('fr-FR')}
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

      {/* Dialog Statistiques */}
      <Dialog 
        open={statsDialog} 
        onClose={() => setStatsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>📊 Statistiques des besoins</DialogTitle>
        <DialogContent>
          {stats && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Compteurs globaux */}
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Total
                    </Typography>
                    <Typography variant="h4" color="primary">
                      {stats.global.total}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      En attente
                    </Typography>
                    <Typography variant="h4" color="warning.main">
                      {stats.global.en_attente}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Validés
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.global.valides}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={6} sm={3}>
                <Card variant="outlined">
                  <CardContent>
                    <Typography color="text.secondary" variant="body2">
                      Satisfaction
                    </Typography>
                    <Typography variant="h4" color="success.main">
                      {stats.taux_satisfaction}%
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Par type */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Par type de besoin
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={stats.par_type}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type_besoin" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="total" fill="#667eea" />
                  </BarChart>
                </ResponsiveContainer>
              </Grid>

              {/* Par priorité */}
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Par priorité
                </Typography>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={stats.par_priorite}
                      dataKey="total"
                      nameKey="priorite"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {stats.par_priorite.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={PRIORITE_COLORS[entry.priorite]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatsDialog(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}