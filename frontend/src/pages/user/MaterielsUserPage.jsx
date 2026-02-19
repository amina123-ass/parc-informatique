// src/pages/user/MaterielsUserPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, IconButton, Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/userApi';

export default function MaterielsUserPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [filters, setFilters] = useState({
    statut: 'active',
    search: '',
    page: 1,
    per_page: 25,
  });

  useEffect(() => {
    loadMateriels();
  }, [filters]);

  const loadMateriels = async () => {
    try {
      setLoading(true);
      const res = await userApi.getMesMateriels(filters);
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

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        💻 Mon matériel
      </Typography>

      {/* Filtres */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={4}>
              <TextField
                fullWidth
                label="Rechercher"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                placeholder="Marque, modèle..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Statut"
                value={filters.statut}
                onChange={(e) => handleFilterChange('statut', e.target.value)}
              >
                <MenuItem value="active">Actif</MenuItem>
                <MenuItem value="returned">Retourné</MenuItem>
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
                    <TableCell>Équipement</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>N° Inventaire</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Date affectation</TableCell>
                    <TableCell>Statut</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          Aucun matériel trouvé
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.data.map((aff) => (
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
                        <TableCell>{aff.materiel?.numero_inventaire}</TableCell>
                        <TableCell>{aff.service?.nom}</TableCell>
                        <TableCell>
                          {new Date(aff.date_affectation).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={aff.statut === 'active' ? 'Actif' : 'Retourné'}
                            size="small"
                            color={aff.statut === 'active' ? 'success' : 'default'}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Voir détails">
                            <IconButton
                              size="small"
                              onClick={() => navigate(`/user/materiels/${aff.id}`)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {aff.statut === 'active' && (
                            <Tooltip title="Déclarer une panne">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => navigate('/user/pannes/new', { 
                                  state: { materiel_id: aff.materiel_id } 
                                })}
                              >
                                <BuildIcon />
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