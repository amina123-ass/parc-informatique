import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem, Chip,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';

const EMPTY_FORM = { nom: '', type_connexion_id: '', commune_id: '', entite_id: '', structure_id: '' };

export default function ServicesPage() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', id: null, form: { ...EMPTY_FORM } });

  // Dico data for selects
  const [typeConnexions, setTypeConnexions] = useState([]);
  const [communes, setCommunes] = useState([]);
  const [entites, setEntites] = useState([]);
  const [structures, setStructures] = useState([]);

  const fetchAll = async () => {
    setLoading(true);
    const [svc, tc, co, en, st] = await Promise.all([
      api.get('/admin/services'),
      api.get('/admin/dico/type-connexions'),
      api.get('/admin/dico/communes'),
      api.get('/admin/dico/entites'),
      api.get('/admin/dico/structures'),
    ]);
    setServices(svc.data);
    setTypeConnexions(tc.data);
    setCommunes(co.data);
    setEntites(en.data);
    setStructures(st.data);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => setModal({ open: true, mode: 'create', id: null, form: { ...EMPTY_FORM } });
  const openEdit = (svc) => setModal({
    open: true, mode: 'edit', id: svc.id,
    form: {
      nom: svc.nom,
      type_connexion_id: svc.type_connexion_id || '',
      commune_id: svc.commune_id || '',
      entite_id: svc.entite_id || '',
      structure_id: svc.structure_id || '',
    },
  });
  const closeModal = () => setModal({ open: false, mode: 'create', id: null, form: { ...EMPTY_FORM } });

  const handleChange = (field, value) => {
    setModal((m) => ({ ...m, form: { ...m.form, [field]: value } }));
  };

  const handleSave = async () => {
    const payload = { ...modal.form };
    // Convert empty strings to null
    Object.keys(payload).forEach((k) => { if (payload[k] === '') payload[k] = null; });

    try {
      if (modal.mode === 'create') {
        await api.post('/admin/services', payload);
        toast.success('Service créé.');
      } else {
        await api.patch(`/admin/services/${modal.id}`, payload);
        toast.success('Service modifié.');
      }
      closeModal();
      fetchAll();
    } catch { /* handled */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce service ?')) return;
    try {
      await api.delete(`/admin/services/${id}`);
      toast.success('Service supprimé.');
      fetchAll();
    } catch { /* handled */ }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    { field: 'nom', headerName: 'Nom', flex: 1 },
    {
      field: 'type_connexion', headerName: 'Connexion', width: 150,
      renderCell: (p) => p.row.type_connexion?.nom || '—',
    },
    {
      field: 'commune', headerName: 'Commune', width: 140,
      renderCell: (p) => p.row.commune?.nom || '—',
    },
    {
      field: 'entite', headerName: 'Entité', width: 200,
      renderCell: (p) => p.row.entite?.nom || '—',
    },
    {
      field: 'users_count', headerName: 'Users', width: 100,
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

  const renderSelect = (label, field, options) => (
    <FormControl fullWidth margin="normal">
      <InputLabel>{label}</InputLabel>
      <Select
        value={modal.form[field]} label={label}
        onChange={(e) => handleChange(field, e.target.value)}
      >
        <MenuItem value="">— Aucun —</MenuItem>
        {options.map((o) => <MenuItem key={o.id} value={o.id}>{o.nom}</MenuItem>)}
      </Select>
    </FormControl>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Services</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Nouveau service</Button>
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={services} columns={columns} loading={loading}
          disableRowSelectionOnClick autoHeight
          sx={{ border: 'none' }}
        />
      </Box>

      <Dialog open={modal.open} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>{modal.mode === 'create' ? 'Nouveau service' : 'Modifier le service'}</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth label="Nom du service" margin="normal"
            value={modal.form.nom} onChange={(e) => handleChange('nom', e.target.value)}
            required
          />
          {renderSelect('Type de connexion', 'type_connexion_id', typeConnexions)}
          {renderSelect('Commune', 'commune_id', communes)}
          {renderSelect('Entité', 'entite_id', entites)}
          {renderSelect('Structure', 'structure_id', structures)}
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