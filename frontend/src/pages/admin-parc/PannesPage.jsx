// src/pages/admin-parc/PannesPage.jsx - VERSION CORRIGÉE

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, Button,
  IconButton, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Assessment as AssessmentIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { panneApi } from '../../services/panneApi';
import api from '../../api/client'; // ✅ CORRECTION ICI
import toast from 'react-hot-toast';

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

export default function PannesPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
    per_page: 25,
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
        api.get('/admin-parc/entites'),
        api.get('/admin-parc/services'),
      ]);
      setEntites(entitesRes.data || []);
      setServices(servicesRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadPannes = async () => {
    try {
      setLoading(true);
      const res = await panneApi.getPannes(filters);
      setData(res.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
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

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression de cette panne ?')) return;

    try {
      await panneApi.deletePanne(id);
      toast.success('Panne supprimée');
      loadPannes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur de suppression');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🔧 Gestion des Pannes
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<AssessmentIcon />}
            onClick={() => navigate('/admin-parc/pannes/dashboard')}
          >
            Dashboard
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin-parc/pannes/new')}
          >
            Déclarer une panne
          </Button>
        </Box>
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
            <Grid item xs={12} sm={6} md={1}>
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
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

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
                    <TableCell>Service</TableCell>
                    <TableCell>Déclarant</TableCell>
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucune panne trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((panne) => (
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
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/admin-parc/pannes/${panne.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {panne.statut === 'declaree' && (
                            <Tooltip title="Supprimer">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDelete(panne.id)}
                              >
                                <CancelIcon />
                              </IconButton>
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
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
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Card>
    </Box>
  );
}