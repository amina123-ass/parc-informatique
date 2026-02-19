import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box, Typography, Button, IconButton, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Edit, Delete } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';

// ── Configuration des champs par type ────────────────
const DICO_CONFIG = {
  'marques':              { label: 'Marques',                fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'cartouches':           { label: 'Cartouches',             fields: [{ name: 'couleur', label: 'Couleur', required: true }, { name: 'reference', label: 'Référence', required: true }, { name: 'prix_unitaire', label: 'Prix unitaire', type: 'number', required: true }] },
  'categories':           { label: 'Catégories',             fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'sous-categories':      { label: 'Sous-catégories',        fields: [{ name: 'category_id', label: 'Catégorie', type: 'select', required: true, endpoint: '/admin/dico/categories' }, { name: 'nom', label: 'Nom', required: true }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'entites':              { label: 'Entités',                fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'communes':             { label: 'Communes',               fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'milieu', label: 'Milieu' }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'structures':           { label: 'Structures',             fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'system-exploitations': { label: 'Systèmes d\'exploitation', fields: [{ name: 'nom', label: 'Nom', required: true }, { name: 'version', label: 'Version' }, { name: 'trie', label: 'Tri', type: 'number' }] },
  'type-connexions':      { label: 'Types de connexion',     fields: [{ name: 'nom', label: 'Nom', required: true }] },
};

export default function DictionnairePage() {
  const { type } = useParams();
  const config = DICO_CONFIG[type];

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState({ open: false, mode: 'create', id: null, form: {} });
  const [selectOptions, setSelectOptions] = useState({});

  const buildEmptyForm = useCallback(() => {
    const form = {};
    config?.fields.forEach((f) => { form[f.name] = ''; });
    return form;
  }, [config]);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/admin/dico/${type}`);
      setItems(res.data);
    } catch { /* handled */ }
    setLoading(false);
  }, [type]);

  const fetchSelectOptions = useCallback(async () => {
    if (!config) return;
    for (const field of config.fields) {
      if (field.type === 'select' && field.endpoint) {
        const res = await api.get(field.endpoint);
        setSelectOptions((prev) => ({ ...prev, [field.name]: res.data }));
      }
    }
  }, [config]);

  useEffect(() => {
    fetchItems();
    fetchSelectOptions();
  }, [fetchItems, fetchSelectOptions]);

  if (!config) {
    return <Typography color="error">Type de dictionnaire inconnu: {type}</Typography>;
  }

  const openCreate = () => setModal({ open: true, mode: 'create', id: null, form: buildEmptyForm() });
  const openEdit = (item) => {
    const form = {};
    config.fields.forEach((f) => { form[f.name] = item[f.name] ?? ''; });
    setModal({ open: true, mode: 'edit', id: item.id, form });
  };
  const closeModal = () => setModal({ open: false, mode: 'create', id: null, form: {} });

  const handleChange = (field, value) => {
    setModal((m) => ({ ...m, form: { ...m.form, [field]: value } }));
  };

  const handleSave = async () => {
    const payload = { ...modal.form };
    // Convert empty strings to null for non-required fields
    config.fields.forEach((f) => {
      if (!f.required && payload[f.name] === '') payload[f.name] = null;
      if (f.type === 'number' && payload[f.name] !== null && payload[f.name] !== '') {
        payload[f.name] = Number(payload[f.name]);
      }
    });

    try {
      if (modal.mode === 'create') {
        await api.post(`/admin/dico/${type}`, payload);
        toast.success('Élément créé.');
      } else {
        await api.patch(`/admin/dico/${type}/${modal.id}`, payload);
        toast.success('Élément modifié.');
      }
      closeModal();
      fetchItems();
    } catch { /* handled */ }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet élément ?')) return;
    try {
      await api.delete(`/admin/dico/${type}/${id}`);
      toast.success('Élément supprimé.');
      fetchItems();
    } catch { /* handled */ }
  };

  // Build columns dynamically
  const columns = [
    { field: 'id', headerName: 'ID', width: 70 },
    ...config.fields.map((f) => {
      const col = { field: f.name, headerName: f.label, flex: 1 };
      if (f.type === 'select') {
        col.renderCell = (p) => {
          const opts = selectOptions[f.name] || [];
          const found = opts.find((o) => o.id === p.value);
          return found?.nom || p.value || '—';
        };
      }
      return col;
    }),
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
        <Typography variant="h4">{config.label}</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={openCreate}>Ajouter</Button>
      </Box>

      <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={items} columns={columns} loading={loading}
          disableRowSelectionOnClick autoHeight
          pageSizeOptions={[10, 25, 50]}
          initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
          sx={{ border: 'none' }}
        />
      </Box>

      {/* Create/Edit Modal */}
      <Dialog open={modal.open} onClose={closeModal} maxWidth="sm" fullWidth>
        <DialogTitle>
          {modal.mode === 'create' ? `Ajouter - ${config.label}` : `Modifier - ${config.label}`}
        </DialogTitle>
        <DialogContent>
          {config.fields.map((f) => {
            if (f.type === 'select') {
              const opts = selectOptions[f.name] || [];
              return (
                <FormControl fullWidth margin="normal" key={f.name}>
                  <InputLabel>{f.label}</InputLabel>
                  <Select
                    value={modal.form[f.name] || ''} label={f.label}
                    onChange={(e) => handleChange(f.name, e.target.value)}
                    required={f.required}
                  >
                    {opts.map((o) => <MenuItem key={o.id} value={o.id}>{o.nom}</MenuItem>)}
                  </Select>
                </FormControl>
              );
            }
            return (
              <TextField
                key={f.name} fullWidth label={f.label} margin="normal"
                type={f.type === 'number' ? 'number' : 'text'}
                value={modal.form[f.name] || ''}
                onChange={(e) => handleChange(f.name, e.target.value)}
                required={f.required}
              />
            );
          })}
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