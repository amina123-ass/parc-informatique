// src/pages/user/BesoinsUserPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, Button,
  IconButton, Tooltip
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/userApi';
import toast from 'react-hot-toast';

const STATUT_COLORS = {
  en_attente: '#ffa726',
  en_cours: '#42a5f5',
  valide: '#66bb6a',
  rejete: '#f44336',
};

export default function BesoinsUserPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    statut: '',
    type_besoin: '',
    priorite: '',
    page: 1,
    per_page: 25,
  });

  useEffect(() => {
    loadBesoins();
  }, [filters]);

  const loadBesoins = async () => {
    try {
      setLoading(true);
      const res = await userApi.getMesBesoins(filters);
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
    if (!window.confirm('Confirmer l\'annulation de cette demande ?')) return;

    try {
      await userApi.cancelBesoin(id);
      toast.success('Demande annulée');
      loadBesoins();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📋 Mes demandes de matériel
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => navigate('/user/besoins/new')}
        >
          Nouvelle demande
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
                <MenuItem value="en_attente">En attente</MenuItem>
                <MenuItem value="en_cours">En cours</MenuItem>
                <MenuItem value="valide">Validé</MenuItem>
                <MenuItem value="rejete">Rejeté</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Type"
                value={filters.type_besoin}
                onChange={(e) => handleFilterChange('type_besoin', e.target.value)}
              >
                <MenuItem value="">Tous</MenuItem>
                <MenuItem value="acquisition">Acquisition</MenuItem>
                <MenuItem value="remplacement">Remplacement</MenuItem>
                <MenuItem value="maintenance">Maintenance</MenuItem>
                <MenuItem value="consommable">Consommable</MenuItem>
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
                    <TableCell>Type</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Quantité</TableCell>
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
                          Aucune demande trouvée
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((besoin) => (
                      <TableRow key={besoin.id} hover>
                        <TableCell>
                          <Chip 
                            label={besoin.type_besoin}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                            {besoin.description}
                          </Typography>
                        </TableCell>
                        <TableCell>{besoin.quantite}</TableCell>
                        <TableCell>
                          <Chip 
                            label={besoin.priorite.charAt(0).toUpperCase() + besoin.priorite.slice(1)}
                            size="small"
                            color={
                              besoin.priorite === 'urgente' ? 'error' :
                              besoin.priorite === 'moyenne' ? 'warning' : 'default'
                            }
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
                        <TableCell align="center">
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/user/besoins/${besoin.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {besoin.statut === 'en_attente' && (
                            <Tooltip title="Annuler">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleCancel(besoin.id)}
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