// src/pages/user/PannesUserPage.jsx

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
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/userApi';
import toast from 'react-hot-toast';

const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

export default function PannesUserPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    statut: '',
    priorite: '',
    type_panne: '',
    page: 1,
    per_page: 25,
  });

  useEffect(() => {
    loadPannes();
  }, [filters]);

  const loadPannes = async () => {
    try {
      setLoading(true);
      const res = await userApi.getMesPannes(filters);
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

  const handleCancel = async (id) => {
    if (!window.confirm('Confirmer l\'annulation de cette panne ?')) return;

    try {
      await userApi.cancelPanne(id);
      toast.success('Panne annulée');
      loadPannes();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
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
          🔧 Mes pannes
        </Typography>
        <Button
          variant="contained"
          color="error"
          startIcon={<AddIcon />}
          onClick={() => navigate('/user/pannes/new')}
        >
          Déclarer une panne
        </Button>
      </Box>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
            <Grid item xs={12} sm={6} md={3}>
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
                    <TableCell>Priorité</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucune panne déclarée
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
                            label={panne.type_panne}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {panne.materiel?.marque?.nom} {panne.materiel?.model}
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
                              onClick={() => navigate(`/user/pannes/${panne.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {panne.statut === 'declaree' && (
                            <Tooltip title="Annuler">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancel(panne.id)}
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