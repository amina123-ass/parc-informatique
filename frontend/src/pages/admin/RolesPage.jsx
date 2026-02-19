import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function RolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', id: null, nom: '' });

  const fetchRoles = async () => {
    setLoading(true);
    const res = await api.get('/admin/roles');
    setRoles(res.data);
    setLoading(false);
  };

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => setModal({ open: true, mode: 'create', id: null, nom: '' });
  const openEdit = (role) => setModal({ open: true, mode: 'edit', id: role.id, nom: role.nom });
  const closeModal = () => setModal({ open: false, mode: 'create', id: null, nom: '' });

  const handleSave = async () => {
    try {
      if (modal.mode === 'create') {
        await api.post('/admin/roles', { nom: modal.nom });
        toast.success('Rôle créé.');
      } else {
        await api.patch(`/admin/roles/${modal.id}`, { nom: modal.nom });
        toast.success('Rôle modifié.');
      }
      closeModal();
      fetchRoles();
    } catch { /* handled */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce rôle ?')) return;
    try {
      await api.delete(`/admin/roles/${id}`);
      toast.success('Rôle supprimé.');
      fetchRoles();
    } catch { /* handled */ }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80 },
    { field: 'nom', headerName: 'Nom', flex: 1 },
    {
      field: 'users_count', headerName: 'Utilisateurs', width: 150,
      renderCell: (p) => <Chip label={p.value} size="small" />,
    },
    {
      field: 'actions', headerName: 'Actions', width: 130, sortable: false,
      renderCell: (p) => (
        <Box>
          <IconButton size="small" color="primary" onClick={() => openEdit(p.row)}><Edit fontSize="small" /></IconButton>
          <IconButton size="small" color="error" onClick={() => handleDelete(p.row.id)}><Delete fontSize="small" /></IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Rôles</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nouveau rôle</Button>
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={roles} columns={columns} loading={loading}
          disableRowSelectionOnClick autoHeight
          sx={{ border: 'none' }}
        />
      </Box>

      <Dialog open={modal.open} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{modal.mode === 'create' ? 'Nouveau rôle' : 'Modifier le rôle'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Nom du rôle" margin="normal"
            value={modal.nom} onChange={(e) => setModal({ ...modal, nom: e.target.value })}
            placeholder="Ex: ADMIN_PARC"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={closeModal}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>
            {modal.mode === 'create' ? 'Créer' : 'Modifier'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}