// src/pages/user/MaterielsUserPage.jsx

import { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Chip, TablePagination, CircularProgress, Alert, Grid, IconButton,
  Tooltip, Drawer, Divider, Stack, Avatar, Button, Skeleton,
  List, ListItem, ListItemText, ListItemIcon, Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
  Close as CloseIcon,
  Laptop as LaptopIcon,
  Inventory2 as InventoryIcon,
  Business as BusinessIcon,
  CalendarToday as CalendarIcon,
  Category as CategoryIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { userApi } from '../../services/userApi';

// ─── Detail Panel ────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }) {
  if (!value) return null;
  return (
    <ListItem disablePadding sx={{ py: 0.75 }}>
      <ListItemIcon sx={{ minWidth: 36 }}>
        <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
      </ListItemIcon>
      <ListItemText
        primary={
          <Typography variant="caption" color="text.secondary" display="block">
            {label}
          </Typography>
        }
        secondary={
          <Typography variant="body2" fontWeight={500}>
            {value}
          </Typography>
        }
        sx={{ my: 0 }}
      />
    </ListItem>
  );
}

function MaterielDetailDrawer({ affectationId, open, onClose, onDeclareBreakdown }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !affectationId) return;
    setDetail(null);
    setError(null);
    setLoading(true);
    userApi
      .getMateriel(affectationId)
      .then((res) => setDetail(res.data))
      .catch((err) => setError(err.response?.data?.message || 'Erreur de chargement'))
      .finally(() => setLoading(false));
  }, [open, affectationId]);

  const m = detail?.materiel;

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 420 },
          p: 0,
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 3,
          py: 2,
          background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
          <LaptopIcon />
        </Avatar>
        <Box flex={1} minWidth={0}>
          {loading || !m ? (
            <>
              <Skeleton variant="text" width={140} sx={{ bgcolor: 'rgba(255,255,255,0.3)' }} />
              <Skeleton variant="text" width={100} sx={{ bgcolor: 'rgba(255,255,255,0.2)' }} />
            </>
          ) : (
            <>
              <Typography variant="subtitle1" fontWeight={700} noWrap>
                {m.marque?.nom} {m.model}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>
                {m.numero_inventaire}
              </Typography>
            </>
          )}
        </Box>
        <IconButton onClick={onClose} sx={{ color: '#fff' }}>
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Body */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Stack spacing={1.5}>
            {[...Array(8)].map((_, i) => (
              <Skeleton key={i} variant="rectangular" height={48} sx={{ borderRadius: 1 }} />
            ))}
          </Stack>
        ) : detail ? (
          <>
            {/* Statut badge */}
            <Box mb={2} display="flex" alignItems="center" gap={1}>
              <Chip
                icon={detail.statut === 'active' ? <CheckCircleIcon /> : <CancelIcon />}
                label={detail.statut === 'active' ? 'Actif' : 'Retourné'}
                color={detail.statut === 'active' ? 'success' : 'default'}
                variant="filled"
              />
            </Box>

            {/* Section: Équipement */}
            <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
              <Box px={2} pt={1.5} pb={0.5}>
                <Typography
                  variant="overline"
                  color="primary"
                  fontWeight={700}
                  fontSize="0.65rem"
                >
                  Équipement
                </Typography>
              </Box>
              <List dense disablePadding sx={{ px: 1, pb: 1 }}>
                <DetailRow
                  icon={<CategoryIcon fontSize="small" />}
                  label="Catégorie"
                  value={m?.categorie?.nom}
                />
                <DetailRow
                  icon={<CategoryIcon fontSize="small" />}
                  label="Sous-catégorie"
                  value={m?.sous_categorie?.nom}
                />
                <DetailRow
                  icon={<LaptopIcon fontSize="small" />}
                  label="Marque"
                  value={m?.marque?.nom}
                />
                <DetailRow
                  icon={<LaptopIcon fontSize="small" />}
                  label="Modèle"
                  value={m?.model}
                />
                <DetailRow
                  icon={<InventoryIcon fontSize="small" />}
                  label="N° Inventaire"
                  value={m?.numero_inventaire}
                />
              </List>
            </Paper>

            {/* Section: Affectation */}
            <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
              <Box px={2} pt={1.5} pb={0.5}>
                <Typography
                  variant="overline"
                  color="primary"
                  fontWeight={700}
                  fontSize="0.65rem"
                >
                  Affectation
                </Typography>
              </Box>
              <List dense disablePadding sx={{ px: 1, pb: 1 }}>
                <DetailRow
                  icon={<BusinessIcon fontSize="small" />}
                  label="Service"
                  value={detail.service?.nom}
                />
                <DetailRow
                  icon={<BusinessIcon fontSize="small" />}
                  label="Entité"
                  value={detail.service?.entite?.nom}
                />
                <DetailRow
                  icon={<CalendarIcon fontSize="small" />}
                  label="Date d'affectation"
                  value={
                    detail.date_affectation
                      ? new Date(detail.date_affectation).toLocaleDateString('fr-FR')
                      : null
                  }
                />
                {detail.date_retour && (
                  <DetailRow
                    icon={<CalendarIcon fontSize="small" />}
                    label="Date de retour"
                    value={new Date(detail.date_retour).toLocaleDateString('fr-FR')}
                  />
                )}
              </List>
            </Paper>

            {/* Section: Détails techniques */}
            {m?.details && m.details.length > 0 && (
              <Paper variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
                <Box px={2} pt={1.5} pb={0.5}>
                  <Typography
                    variant="overline"
                    color="primary"
                    fontWeight={700}
                    fontSize="0.65rem"
                  >
                    Détails techniques
                  </Typography>
                </Box>
                <List dense disablePadding sx={{ px: 1, pb: 1 }}>
                  {m.details.map((d) => (
                    <DetailRow
                      key={d.id}
                      icon={<InfoIcon fontSize="small" />}
                      label={d.key}
                      value={String(d.value)}
                    />
                  ))}
                </List>
              </Paper>
            )}
          </>
        ) : null}
      </Box>

      {/* Footer actions */}
      {detail?.statut === 'active' && (
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button
            fullWidth
            variant="contained"
            color="error"
            startIcon={<BuildIcon />}
            onClick={() => onDeclareBreakdown(detail.materiel_id)}
          >
            Déclarer une panne
          </Button>
        </Box>
      )}
    </Drawer>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function MaterielsUserPage() {
  const navigate = useNavigate();
  const [data, setData] = useState({ data: [], total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Detail drawer state
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
    setFilters((prev) => ({ ...prev, [field]: value, page: 1 }));
  };

  const openDetail = (id) => {
    setSelectedId(id);
    setDrawerOpen(true);
  };

  const closeDetail = () => {
    setDrawerOpen(false);
  };

  const handleDeclareBreakdown = (materielId) => {
    closeDetail();
    navigate('/user/pannes/new', { state: { materiel_id: materielId } });
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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
                      <TableRow
                        key={aff.id}
                        hover
                        selected={selectedId === aff.id && drawerOpen}
                        sx={{
                          cursor: 'pointer',
                          '&.Mui-selected': { bgcolor: 'primary.50' },
                        }}
                      >
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
                              color={selectedId === aff.id && drawerOpen ? 'primary' : 'default'}
                              onClick={() => openDetail(aff.id)}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                          {aff.statut === 'active' && (
                            <Tooltip title="Déclarer une panne">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() =>
                                  navigate('/user/pannes/new', {
                                    state: { materiel_id: aff.materiel_id },
                                  })
                                }
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
              onRowsPerPageChange={(e) =>
                handleFilterChange('per_page', parseInt(e.target.value))
              }
              rowsPerPageOptions={[10, 25, 50, 100]}
              labelRowsPerPage="Lignes par page:"
              labelDisplayedRows={({ from, to, count }) => `${from}-${to} sur ${count}`}
            />
          </>
        )}
      </Card>

      {/* Detail Drawer */}
      <MaterielDetailDrawer
        affectationId={selectedId}
        open={drawerOpen}
        onClose={closeDetail}
        onDeclareBreakdown={handleDeclareBreakdown}
      />
    </Box>
  );
}