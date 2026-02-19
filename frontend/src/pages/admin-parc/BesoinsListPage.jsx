import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Button, Chip, IconButton, TextField, InputAdornment,
  FormControl, InputLabel, Select, MenuItem, Grid, Card, CardContent,
  Tooltip, Badge,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import {
  Add, Visibility, Search, FilterList, Dashboard, PlayArrow,
  CheckCircle, Cancel, Clear,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import BesoinDetailDialog from '../../components/admin-parc/BesoinDetailDialog';
import BesoinCreateDialog from '../../components/admin-parc/BesoinCreateDialog';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

// ── Constantes ──
const STATUT_CONFIG = {
  en_attente: { label: 'En attente', color: 'warning' },
  en_cours:   { label: 'En cours',   color: 'info' },
  valide:     { label: 'Validé',     color: 'success' },
  rejete:     { label: 'Rejeté',     color: 'error' },
};

const PRIORITE_CONFIG = {
  faible:  { label: 'Faible',  color: 'default' },
  moyenne: { label: 'Moyenne', color: 'primary' },
  urgente: { label: 'Urgente', color: 'error' },
};

const TYPE_OPTIONS = ['PC', 'imprimante', 'cartouche', 'autre'];

export default function BesoinsListPage() {
  const navigate = useNavigate();

  // ── State ──
  const [besoins, setBesoins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowCount, setRowCount] = useState(0);
  const [services, setServices] = useState([]);
  const [entites, setEntites] = useState([]);

  // Filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '', statut: '', service_id: '', entite_id: '',
    priorite: '', type_besoin: '', date_from: '', date_to: '',
  });

  // Dialogs
  const [detailDialog, setDetailDialog] = useState({ open: false, besoinId: null });
  const [createDialog, setCreateDialog] = useState(false);
  const [actionDialog, setActionDialog] = useState({ open: false, type: '', besoin: null });

  // ── Chargement données ref ──
  useEffect(() => {
    Promise.all([
      api.get('/admin-parc/services').catch(() => ({ data: [] })),
      api.get('/admin-parc/entites').catch(() => ({ data: [] })),
    ]).then(([sRes, eRes]) => {
      setServices(sRes.data || []);
      setEntites(eRes.data || []);
    });
  }, []);

  // ── Fetch besoins ──
  const fetchBesoins = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
      };
      // Ajouter les filtres non vides
      Object.entries(filters).forEach(([key, val]) => {
        if (val) params[key] = val;
      });

      const res = await api.get('/admin-parc/besoins', { params });
      setBesoins(res.data.data);
      setRowCount(res.data.total);
    } catch (err) {
      console.error('Fetch besoins error:', err);
    }
    setLoading(false);
  }, [paginationModel, filters]);

  useEffect(() => { fetchBesoins(); }, [fetchBesoins]);

  // ── Handlers filtre ──
  const handleFilterChange = (field, value) => {
    setFilters((f) => ({ ...f, [field]: value }));
    setPaginationModel((p) => ({ ...p, page: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      search: '', statut: '', service_id: '', entite_id: '',
      priorite: '', type_besoin: '', date_from: '', date_to: '',
    });
  };

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  // ── Actions workflow ──
  const handleEnCours = async (besoin) => {
    try {
      await api.patch(`/admin-parc/besoins/${besoin.id}/en-cours`);
      toast.success('Besoin passé en cours.');
      fetchBesoins();
    } catch { /* handled */ }
  };

  const handleValider = async (besoin, commentaire) => {
    try {
      await api.patch(`/admin-parc/besoins/${besoin.id}/valider`, { commentaire });
      toast.success('Besoin validé.');
      fetchBesoins();
    } catch { /* handled */ }
  };

  const handleRejeter = async (besoin, motif_rejet) => {
    try {
      await api.patch(`/admin-parc/besoins/${besoin.id}/rejeter`, { motif_rejet });
      toast.success('Besoin rejeté.');
      fetchBesoins();
    } catch { /* handled */ }
  };

  // ── Colonnes DataGrid ──
  const columns = [
    {
      field: 'id', headerName: 'N°', width: 80,
      renderCell: (p) => <Typography fontWeight={600}>#{p.value}</Typography>,
    },
    {
      field: 'utilisateur', headerName: 'Demandeur', flex: 1, minWidth: 160,
      renderCell: (p) => {
        const u = p.row.utilisateur;
        return u ? `${u.nom} ${u.prenom}` : '—';
      },
    },
    {
      field: 'service', headerName: 'Service', width: 150,
      renderCell: (p) => p.row.service?.nom || '—',
    },
    {
      field: 'type_besoin', headerName: 'Type', width: 120,
      renderCell: (p) => <Chip label={p.value} size="small" variant="outlined" />,
    },
    { field: 'designation', headerName: 'Désignation', flex: 1, minWidth: 180 },
    {
      field: 'priorite', headerName: 'Priorité', width: 110,
      renderCell: (p) => {
        const conf = PRIORITE_CONFIG[p.value] || {};
        return <Chip label={conf.label || p.value} size="small" color={conf.color || 'default'} />;
      },
    },
    { field: 'date_demande', headerName: 'Date demande', width: 130 },
    {
      field: 'statut', headerName: 'Statut', width: 130,
      renderCell: (p) => {
        const conf = STATUT_CONFIG[p.value] || {};
        return <Chip label={conf.label || p.value} size="small" color={conf.color || 'default'} />;
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.3 }}>
          <Tooltip title="Détails">
            <IconButton size="small" color="info" onClick={() => setDetailDialog({ open: true, besoinId: p.row.id })}>
              <Visibility fontSize="small" />
            </IconButton>
          </Tooltip>

          {p.row.statut === 'en_attente' && (
            <Tooltip title="Passer en cours">
              <IconButton size="small" color="primary" onClick={() => handleEnCours(p.row)}>
                <PlayArrow fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {['en_attente', 'en_cours'].includes(p.row.statut) && (
            <>
              <Tooltip title="Valider">
                <IconButton size="small" color="success" onClick={() => setActionDialog({ open: true, type: 'valider', besoin: p.row })}>
                  <CheckCircle fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Rejeter">
                <IconButton size="small" color="error" onClick={() => setActionDialog({ open: true, type: 'rejeter', besoin: p.row })}>
                  <Cancel fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Gestion des Besoins</Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<Dashboard />}
            onClick={() => navigate('/admin-parc/besoins/dashboard')}
          >
            Dashboard
          </Button>
          <Badge badgeContent={activeFilterCount} color="primary">
            <Button
              variant="outlined"
              startIcon={<FilterList />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filtres
            </Button>
          </Badge>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setCreateDialog(true)}
          >
            Nouveau besoin
          </Button>
        </Box>
      </Box>

      {/* ── Filtres avancés ── */}
      {showFilters && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="subtitle1" fontWeight={600}>Filtres avancés</Typography>
              {activeFilterCount > 0 && (
                <Button size="small" startIcon={<Clear />} onClick={clearFilters}>
                  Réinitialiser
                </Button>
              )}
            </Box>
            <Grid container spacing={2}>
              {/* Recherche */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth size="small" label="Rechercher"
                  placeholder="Nom, matricule, désignation..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment> }}
                />
              </Grid>

              {/* Statut */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Statut</InputLabel>
                  <Select value={filters.statut} label="Statut" onChange={(e) => handleFilterChange('statut', e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    {Object.entries(STATUT_CONFIG).map(([key, val]) => (
                      <MenuItem key={key} value={key}>{val.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Service */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Service</InputLabel>
                  <Select value={filters.service_id} label="Service" onChange={(e) => handleFilterChange('service_id', e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    {services.map((s) => <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Entité */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Entité</InputLabel>
                  <Select value={filters.entite_id} label="Entité" onChange={(e) => handleFilterChange('entite_id', e.target.value)}>
                    <MenuItem value="">Toutes</MenuItem>
                    {entites.map((e) => <MenuItem key={e.id} value={e.id}>{e.nom}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Priorité */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Priorité</InputLabel>
                  <Select value={filters.priorite} label="Priorité" onChange={(e) => handleFilterChange('priorite', e.target.value)}>
                    <MenuItem value="">Toutes</MenuItem>
                    {Object.entries(PRIORITE_CONFIG).map(([key, val]) => (
                      <MenuItem key={key} value={key}>{val.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              {/* Type */}
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={filters.type_besoin} label="Type" onChange={(e) => handleFilterChange('type_besoin', e.target.value)}>
                    <MenuItem value="">Tous</MenuItem>
                    {TYPE_OPTIONS.map((t) => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>

              {/* Date de / à */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth size="small" label="Date du" type="date"
                  value={filters.date_from}
                  onChange={(e) => handleFilterChange('date_from', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth size="small" label="Date au" type="date"
                  value={filters.date_to}
                  onChange={(e) => handleFilterChange('date_to', e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* ── DataGrid ── */}
      <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={besoins}
          columns={columns}
          loading={loading}
          paginationMode="server"
          rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-cell': { py: 1 } }}
        />
      </Box>

      {/* ── Dialogs ── */}
      <BesoinDetailDialog
        open={detailDialog.open}
        besoinId={detailDialog.besoinId}
        onClose={() => setDetailDialog({ open: false, besoinId: null })}
        onAction={() => { fetchBesoins(); setDetailDialog({ open: false, besoinId: null }); }}
      />

      <BesoinCreateDialog
        open={createDialog}
        services={services}
        entites={entites}
        onClose={() => setCreateDialog(false)}
        onCreated={() => { fetchBesoins(); setCreateDialog(false); }}
      />

      {/* Valider Dialog */}
      <ActionCommentDialog
        open={actionDialog.open && actionDialog.type === 'valider'}
        title="Valider le besoin"
        message={`Voulez-vous valider la demande #${actionDialog.besoin?.id} — "${actionDialog.besoin?.designation}" ?`}
        label="Commentaire (optionnel)"
        confirmText="Valider"
        color="success"
        required={false}
        onConfirm={(commentaire) => {
          handleValider(actionDialog.besoin, commentaire);
          setActionDialog({ open: false, type: '', besoin: null });
        }}
        onCancel={() => setActionDialog({ open: false, type: '', besoin: null })}
      />

      {/* Rejeter Dialog */}
      <ActionCommentDialog
        open={actionDialog.open && actionDialog.type === 'rejeter'}
        title="Rejeter le besoin"
        message={`Voulez-vous rejeter la demande #${actionDialog.besoin?.id} — "${actionDialog.besoin?.designation}" ?`}
        label="Motif de rejet *"
        confirmText="Rejeter"
        color="error"
        required={true}
        onConfirm={(motif) => {
          handleRejeter(actionDialog.besoin, motif);
          setActionDialog({ open: false, type: '', besoin: null });
        }}
        onCancel={() => setActionDialog({ open: false, type: '', besoin: null })}
      />
    </Box>
  );
}

// ── Composant interne: Dialog avec champ texte ──
import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions } from '@mui/material';

function ActionCommentDialog({ open, title, message, label, confirmText, color, required, onConfirm, onCancel }) {
  const [text, setText] = useState('');

  const handleConfirm = () => {
    if (required && !text.trim()) {
      toast.error(`${label.replace(' *', '')} est obligatoire.`);
      return;
    }
    onConfirm(text);
    setText('');
  };

  const handleClose = () => {
    setText('');
    onCancel();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>{message}</DialogContentText>
        <TextField
          fullWidth
          multiline
          rows={3}
          label={label}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required={required}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Annuler</Button>
        <Button variant="contained" color={color} onClick={handleConfirm}>{confirmText}</Button>
      </DialogActions>
    </Dialog>
  );
}