import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, TextField, Chip, Button, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControl, InputLabel, Select, MenuItem, InputAdornment,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, CheckCircle, Cancel, Edit } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 15 });
  const [rowCount, setRowCount] = useState(0);

  // Modal state
  const [editModal, setEditModal] = useState({ open: false, user: null, role_id: '', service_id: '' });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: {
          page: paginationModel.page + 1,
          per_page: paginationModel.pageSize,
          search: search || undefined,
        },
      });
      setUsers(res.data.data);
      setRowCount(res.data.total);
    } catch { /* handled */ }
    setLoading(false);
  }, [paginationModel, search]);

  const fetchMeta = async () => {
    const [r, s] = await Promise.all([
      api.get('/admin/roles'),
      api.get('/admin/services'),
    ]);
    setRoles(r.data);
    setServices(s.data);
  };

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { fetchMeta(); }, []);

  const handleActivation = async (userId, active) => {
    try {
      await api.patch(`/admin/users/${userId}/activation`, { account_active: active });
      toast.success(active ? 'Utilisateur activé.' : 'Utilisateur désactivé.');
      fetchUsers();
    } catch { /* handled */ }
  };

  const openEditModal = (user) => {
    setEditModal({
      open: true,
      user,
      role_id: user.role_id || '',
      service_id: user.service_id || '',
    });
  };

  const handleSaveEdit = async () => {
    const { user, role_id, service_id } = editModal;
    try {
      if (role_id && role_id !== user.role_id) {
        await api.patch(`/admin/users/${user.id}/role`, { role_id });
      }
      if (service_id && service_id !== user.service_id) {
        await api.patch(`/admin/users/${user.id}/service`, { service_id });
      }
      toast.success('Utilisateur mis à jour.');
      setEditModal({ open: false, user: null, role_id: '', service_id: '' });
      fetchUsers();
    } catch { /* handled */ }
  };

  const columns = [
    { field: 'matricule', headerName: 'Matricule', width: 110 },
    { field: 'nom', headerName: 'Nom', width: 130 },
    { field: 'prenom', headerName: 'Prénom', width: 130 },
    { field: 'email', headerName: 'Email', width: 220 },
    { field: 'fonction', headerName: 'Fonction', width: 130 },
    {
      field: 'role', headerName: 'Rôle', width: 130,
      renderCell: (p) => p.row.role?.nom ? <Chip label={p.row.role.nom} size="small" color="primary" variant="outlined" /> : <Chip label="Non attribué" size="small" />,
    },
    {
      field: 'service', headerName: 'Service', width: 160,
      renderCell: (p) => p.row.service?.nom || '—',
    },
    {
      field: 'account_active', headerName: 'Statut', width: 120,
      renderCell: (p) => {
        if (!p.row.email_verified_at) return <Chip label="Non vérifié" size="small" color="default" />;
        return p.row.account_active
          ? <Chip label="Actif" size="small" color="success" />
          : <Chip label="En attente" size="small" color="warning" />;
      },
    },
    {
      field: 'actions', headerName: 'Actions', width: 160, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <IconButton size="small" color="primary" onClick={() => openEditModal(p.row)} title="Modifier">
            <Edit fontSize="small" />
          </IconButton>
          {p.row.email_verified_at && !p.row.account_active && (
            <IconButton size="small" color="success" onClick={() => handleActivation(p.row.id, true)} title="Activer">
              <CheckCircle fontSize="small" />
            </IconButton>
          )}
          {p.row.account_active && (
            <IconButton size="small" color="error" onClick={() => handleActivation(p.row.id, false)} title="Désactiver">
              <Cancel fontSize="small" />
            </IconButton>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Utilisateurs</Typography>
        <TextField
          size="small" placeholder="Rechercher..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search /></InputAdornment>,
          }}
          sx={{ width: 280 }}
        />
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: 2, overflow: 'hidden' }}>
        <DataGrid
          rows={users} columns={columns} loading={loading}
          paginationMode="server" rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 15, 25, 50]}
          disableRowSelectionOnClick
          autoHeight
          sx={{ border: 'none', '& .MuiDataGrid-cell': { py: 1 } }}
        />
      </Box>

      {/* Edit Modal */}
      <Dialog open={editModal.open} onClose={() => setEditModal({ ...editModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle>Modifier l'utilisateur: {editModal.user?.prenom} {editModal.user?.nom}</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <FormControl fullWidth margin="normal">
            <InputLabel>Rôle</InputLabel>
            <Select
              value={editModal.role_id} label="Rôle"
              onChange={(e) => setEditModal({ ...editModal, role_id: e.target.value })}
            >
              {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.nom}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Service</InputLabel>
            <Select
              value={editModal.service_id} label="Service"
              onChange={(e) => setEditModal({ ...editModal, service_id: e.target.value })}
            >
              {services.map((s) => <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>)}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditModal({ ...editModal, open: false })}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveEdit}>Enregistrer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}