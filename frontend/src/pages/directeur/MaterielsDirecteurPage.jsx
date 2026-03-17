// src/pages/directeur/MaterielsDirecteurPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, IconButton, Grid,
  Button
} from '@mui/material';
import {
  Search as SearchIcon,
  FileDownload as DownloadIcon,
  FilterList as FilterIcon
} from '@mui/icons-material';
import { directeurApi } from '../../services/directeurApi';

export default function MaterielsDirecteurPage() {
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [entites, setEntites] = useState([]);
  const [services, setServices] = useState([]);

  const [filters, setFilters] = useState({
    entite_id: '',
    service_id: '',
    category_id: '',
    search: '',
    page: 1,
    per_page: 20,
  });

  useEffect(() => {
    loadReferentials();
  }, []);

  useEffect(() => {
    loadAffectations();
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

  const loadAffectations = async () => {
    try {
      setLoading(true);
      const res = await directeurApi.getAffectations(filters);
      setData(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value, page: 1 }));
  };

  const handleExport = async () => {
    try {
      const res = await directeurApi.exportMateriels();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `materiels_affectes_${new Date().toISOString()}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          💼 Matériels affectés
        </Typography>
        
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
                placeholder="Modèle, utilisateur..."
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1, color: 'action.active' }} />,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
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
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                select
                label="Service"
                value={filters.service_id}
                onChange={(e) => handleFilterChange('service_id', e.target.value)}
              >
                <MenuItem value="">Tous les services</MenuItem>
                {services
                  .filter(s => !filters.entite_id || s.entite_id === parseInt(filters.entite_id))
                  .map(s => (
                    <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>
                  ))
                }
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
                    <TableCell>Matériel</TableCell>
                    <TableCell>Catégorie</TableCell>
                    <TableCell>Entité</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Utilisateur</TableCell>
                    <TableCell>Date d'affectation</TableCell>
                    <TableCell>N° Inventaire</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {data.data.map((aff) => (
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
                          label={aff.materiel?.categorie?.nom || 'N/A'} 
                          size="small" 
                          color="primary"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{aff.service?.entite?.nom || 'N/A'}</TableCell>
                      <TableCell>{aff.service?.nom || 'N/A'}</TableCell>
                      <TableCell>
                        {aff.user ? `${aff.user.nom} ${aff.user.prenom}` : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {new Date(aff.date_affectation).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={aff.numero_inventaire || 'N/A'} 
                          size="small"
                          color="default"
                        />
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
    </Box>
  );
}