// src/pages/admin-parc/AffectationsPage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Chip, IconButton, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent,
  Button, Badge, Autocomplete, Paper,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Undo, Visibility, FilterList, Clear, TuneOutlined } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

export default function AffectationsPage() {
  const navigate = useNavigate();

  // ── Données ──
  const [affectations, setAffectations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowCount, setRowCount] = useState(0);

  // ── Référentiels pour les filtres ──
  const [services, setServices] = useState([]);
  const [entites, setEntites] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // ── Filtres ──
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    service_id: '',
    entite_id: '',
    user_id: '',
  });

  // ── États pour Autocomplete ──
  const [selectedEntite, setSelectedEntite] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const [confirm, setConfirm] = useState({ open: false, id: null });

  // ── Chargement données référentielles ──
  useEffect(() => {
    const loadRefs = async () => {
      try {
        const [sRes, eRes] = await Promise.all([
          api.get('/admin-parc/services'),
          api.get('/admin-parc/entites'),
        ]);
        setServices(sRes.data || []);
        setEntites(eRes.data || []);
      } catch (err) {
        console.error('Erreur chargement référentiels:', err);
      }
    };
    loadRefs();
  }, []);

  // ── Chargement des utilisateurs à partir des affectations ──
  useEffect(() => {
    const loadAllUsers = async () => {
      try {
        const res = await api.get('/admin-parc/affectations', { 
          params: { per_page: 1000 } 
        });
        
        const usersMap = new Map();
        res.data.data.forEach(affectation => {
          if (affectation.user && affectation.user.id) {
            usersMap.set(affectation.user.id, {
              id: affectation.user.id,
              nom: affectation.user.nom,
              prenom: affectation.user.prenom,
              matricule: affectation.user.matricule,
              service: affectation.service,
              entite: affectation.user.entite || affectation.service?.entite,
            });
          }
        });
        
        setAllUsers(Array.from(usersMap.values()));
      } catch (err) {
        console.error('Erreur chargement utilisateurs:', err);
      }
    };
    
    loadAllUsers();
  }, []);

  // ── Fetch affectations ──
  const fetchAffectations = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
      };

      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });

      const res = await api.get('/admin-parc/affectations', { params });
      setAffectations(res.data.data);
      setRowCount(res.data.total);
    } catch (err) {
      console.error('Fetch affectations error:', err);
      toast.error('Erreur lors du chargement des affectations');
    }
    setLoading(false);
  }, [paginationModel, filters]);

  useEffect(() => { fetchAffectations(); }, [fetchAffectations]);

  // ── Handlers filtres ──
  const handleFilterChange = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  // ── Handler Autocomplete Entité ──
  const handleEntiteChange = (event, newValue) => {
    setSelectedEntite(newValue);
    handleFilterChange('entite_id', newValue ? newValue.id : '');
    
    if (!newValue || (newValue && filters.service_id)) {
      const serviceAppartientEntite = newValue && services.find(
        s => s.id === filters.service_id && s.entite_id === newValue.id
      );
      if (!serviceAppartientEntite) {
        setSelectedService(null);
        setSelectedUser(null);
        setFilters(f => ({ ...f, service_id: '', user_id: '' }));
      }
    }
  };

  // ── Handler Autocomplete Service ──
  const handleServiceChange = (event, newValue) => {
    setSelectedService(newValue);
    handleFilterChange('service_id', newValue ? newValue.id : '');
    
    setSelectedUser(null);
    setFilters(f => ({ ...f, user_id: '' }));
  };

  // ── Handler Autocomplete Utilisateur ──
  const handleUserChange = (event, newValue) => {
    setSelectedUser(newValue);
    handleFilterChange('user_id', newValue ? newValue.id : '');
  };

  // ── Réinitialisation filtres ──
  const clearFilters = () => {
    setFilters({ search: '', status: '', service_id: '', entite_id: '', user_id: '' });
    setSelectedEntite(null);
    setSelectedService(null);
    setSelectedUser(null);
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Retour matériel ──
  const handleReturn = async () => {
    try {
      await api.patch(`/admin-parc/affectations/${confirm.id}/return`);
      toast.success('Matériel retourné avec succès');
      fetchAffectations();
    } catch (err) {
      toast.error('Erreur lors du retour du matériel');
    }
    setConfirm({ open: false, id: null });
  };

  // ── Services filtrés par entité ──
  const servicesFiltered = selectedEntite
    ? services.filter(s => s.entite_id === selectedEntite.id)
    : services;

  // ── Utilisateurs filtrés par service ou entité ──
  const usersFiltered = filters.service_id 
    ? allUsers.filter(u => u.service?.id === parseInt(filters.service_id))
    : filters.entite_id
    ? allUsers.filter(u => u.entite?.id === parseInt(filters.entite_id))
    : allUsers;

  // ── Colonnes DataGrid ──
  const columns = [
    {
      field: 'materiel', headerName: 'Matériel', flex: 1, minWidth: 180,
      renderCell: (p) => p.row.materiel?.model || '—',
    },
    {
      field: 'marque', headerName: 'Marque', width: 100,
      renderCell: (p) => p.row.materiel?.marque?.nom || '—',
    },
    {
      field: 'numero_inventaire', headerName: 'N° Inv.', width: 130,
      renderCell: (p) => p.value || '—',
    },
    {
      field: 'service', headerName: 'Service', width: 160,
      renderCell: (p) => p.row.service?.nom || '—',
    },
    {
      field: 'entite', headerName: 'Entité', width: 140,
      renderCell: (p) => p.row.service?.entite?.nom || p.row.user?.entite?.nom || '—',
    },
    {
      field: 'user', headerName: 'Utilisateur', width: 180,
      renderCell: (p) => {
        const u = p.row.user;
        return u ? `${u.nom} ${u.prenom}` : '—';
      },
    },
    { 
      field: 'date_affectation', 
      headerName: 'Date affect.', 
      width: 120,
      valueFormatter: (params) => {
        if (!params.value) return '—';
        return new Date(params.value).toLocaleDateString('fr-FR');
      }
    },
    { 
      field: 'date_retour', 
      headerName: 'Date retour', 
      width: 120, 
      renderCell: (p) => p.value ? new Date(p.value).toLocaleDateString('fr-FR') : '—'
    },
    {
      field: 'status', headerName: 'Statut', width: 110,
      renderCell: (p) => (
        <Chip 
          label={p.value === 'ACTIVE' ? 'Active' : 'Retournée'} 
          size="small" 
          color={p.value === 'ACTIVE' ? 'success' : 'default'} 
        />
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton 
            size="small" 
            color="info" 
            onClick={() => navigate(`/admin-parc/materiels/${p.row.materiel_id}`)} 
            title="Voir matériel"
          >
            <Visibility fontSize="small" />
          </IconButton>
          {p.row.status === 'ACTIVE' && (
            <IconButton 
              size="small" 
              color="warning" 
              onClick={() => setConfirm({ open: true, id: p.row.id })} 
              title="Retourner le matériel"
            >
              <Undo fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 3, 
        flexWrap: 'wrap', 
        gap: 2 
      }}>
        <Typography variant="h4">Consultation du matériel</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {activeFilterCount > 0 && (
            <Button
              size="small"
              variant="outlined"
              color="error"
              startIcon={<Clear />}
              onClick={clearFilters}
            >
              Réinitialiser ({activeFilterCount})
            </Button>
          )}
          <Badge badgeContent={filters.search || filters.status ? '!' : 0} color="primary">
            <Button
              variant="outlined"
              startIcon={<TuneOutlined />}
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            >
              Filtres avancés {showAdvancedFilters ? '▲' : '▼'}
            </Button>
          </Badge>
        </Box>
      </Box>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FILTRES PRINCIPAUX (TOUJOURS VISIBLES) */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Paper sx={{ p: 3, mb: 3, bgcolor: 'primary.50', borderLeft: 4, borderColor: 'primary.main' }}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterList color="primary" />
          Recherche rapide
        </Typography>

        <Grid container spacing={2}>
          {/* Entité / Structure */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              value={selectedEntite}
              onChange={handleEntiteChange}
              options={entites}
              getOptionLabel={(option) => option.nom || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="🏢 Entité / Structure"
                  placeholder="Toutes les entités"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.nom}</Typography>
                    {option.code && (
                      <Typography variant="caption" color="text.secondary">
                        Code: {option.code}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              noOptionsText="Aucune entité trouvée"
            />
          </Grid>

          {/* Service */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              value={selectedService}
              onChange={handleServiceChange}
              options={servicesFiltered}
              getOptionLabel={(option) => option.nom || ''}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="🏛️ Service"
                  placeholder="Tous les services"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">{option.nom}</Typography>
                    {option.entite?.nom && (
                      <Typography variant="caption" color="text.secondary">
                        {option.entite.nom}
                      </Typography>
                    )}
                  </Box>
                </li>
              )}
              noOptionsText={selectedEntite ? "Aucun service dans cette entité" : "Aucun service trouvé"}
            />
          </Grid>

          {/* Utilisateur */}
          <Grid item xs={12} md={4}>
            <Autocomplete
              size="small"
              value={selectedUser}
              onChange={handleUserChange}
              options={usersFiltered}
              getOptionLabel={(option) => 
                `${option.nom} ${option.prenom}${option.matricule ? ` (${option.matricule})` : ''}`
              }
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="👤 Utilisateur"
                  placeholder="Tous les utilisateurs"
                />
              )}
              renderOption={(props, option) => (
                <li {...props} key={option.id}>
                  <Box>
                    <Typography variant="body2">
                      {option.nom} {option.prenom}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {option.matricule && `Matricule: ${option.matricule} • `}
                      {option.service?.nom || 'Sans service'}
                    </Typography>
                  </Box>
                </li>
              )}
              noOptionsText="Aucun utilisateur trouvé"
              filterOptions={(options, { inputValue }) => {
                const filterValue = inputValue.toLowerCase();
                return options.filter(option => 
                  option.nom?.toLowerCase().includes(filterValue) ||
                  option.prenom?.toLowerCase().includes(filterValue) ||
                  option.matricule?.toLowerCase().includes(filterValue)
                );
              }}
            />
          </Grid>

          {/* Info helper */}
          <Grid item xs={12}>
            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              💡 Astuce : Sélectionnez une entité pour filtrer les services, puis un service pour filtrer les utilisateurs.
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* ══════════════════════════════════════════════════════════ */}
      {/* FILTRES AVANCÉS (DÉROULANTS) */}
      {/* ══════════════════════════════════════════════════════════ */}
      {showAdvancedFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
              Filtres avancés
            </Typography>

            <Grid container spacing={2}>
              {/* Recherche globale */}
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth 
                  size="small"
                  label="Recherche globale"
                  placeholder="N° inventaire, modèle, bon sortie, nom utilisateur..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>

              {/* Statut */}
              <Grid item xs={12} md={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select
                    value={filters.status}
                    label="Statut"
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <MenuItem value="">Tous</MenuItem>
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="RETURNED">Retournée</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* RÉSUMÉ DES FILTRES ACTIFS (CHIPS) */}
      {/* ══════════════════════════════════════════════════════════ */}
      {activeFilterCount > 0 && (
        <Box sx={{ mb: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary" fontWeight={600}>
            Filtres actifs :
          </Typography>
          {filters.search && (
            <Chip 
              label={`Recherche: "${filters.search}"`} 
              onDelete={() => handleFilterChange('search', '')}
              size="small"
              color="primary"
            />
          )}
          {selectedEntite && (
            <Chip 
              label={`🏢 ${selectedEntite.nom}`} 
              onDelete={() => handleEntiteChange(null, null)}
              size="small"
              color="primary"
            />
          )}
          {selectedService && (
            <Chip 
              label={`🏛️ ${selectedService.nom}`} 
              onDelete={() => handleServiceChange(null, null)}
              size="small"
              color="primary"
            />
          )}
          {selectedUser && (
            <Chip 
              label={`👤 ${selectedUser.nom} ${selectedUser.prenom}`} 
              onDelete={() => handleUserChange(null, null)}
              size="small"
              color="primary"
            />
          )}
          {filters.status && (
            <Chip 
              label={`Statut: ${filters.status === 'ACTIVE' ? 'Active' : 'Retournée'}`} 
              onDelete={() => handleFilterChange('status', '')}
              size="small"
              color="primary"
            />
          )}
        </Box>
      )}

      {/* ══════════════════════════════════════════════════════════ */}
      {/* DATAGRID */}
      {/* ══════════════════════════════════════════════════════════ */}
      <Card>
        <DataGrid
          rows={affectations}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50, 100]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ 
            border: 'none',
            '& .MuiDataGrid-cell': { py: 1 },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: 'grey.50',
              borderBottom: 2,
              borderColor: 'divider',
            },
          }}
          localeText={{
            noRowsLabel: 'Aucune affectation trouvée',
            MuiTablePagination: {
              labelRowsPerPage: 'Lignes par page:',
              labelDisplayedRows: ({ from, to, count }) => 
                `${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`,
            },
          }}
        />
      </Card>

      {/* ── Confirm retour ── */}
      <ConfirmDialog
        open={confirm.open}
        title="Confirmer le retour du matériel"
        message="Le matériel sera remis en stock et l'affectation sera clôturée. Cette action est irréversible."
        confirmText="Retourner"
        color="warning"
        onConfirm={handleReturn}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </Box>
  );
}