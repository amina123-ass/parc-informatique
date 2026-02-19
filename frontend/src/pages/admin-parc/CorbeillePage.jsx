import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, IconButton, TextField, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility, RestoreFromTrash } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

export default function CorbeillePage() {
  const navigate = useNavigate();
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowCount, setRowCount] = useState(0);
  const [confirm, setConfirm] = useState({ open: false, id: null });

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/admin-parc/materiels', {
      params: {
        trashed_only: true,
        page: paginationModel.page + 1,
        per_page: paginationModel.pageSize,
        search: search || undefined,
      },
    });
    setMateriels(res.data.data);
    setRowCount(res.data.total);
    setLoading(false);
  }, [paginationModel, search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleRestore = async () => {
    try {
      await api.patch(`/admin-parc/materiels/${confirm.id}/restore`);
      toast.success('Matériel restauré.');
      fetchData();
    } catch { /* handled */ }
    setConfirm({ open: false, id: null });
  };

  const columns = [
    { field: 'model', headerName: 'Modèle', flex: 1, minWidth: 180 },
    { field: 'marque', headerName: 'Marque', width: 120, renderCell: (p) => p.row.marque?.nom || '—' },
    { field: 'sous_categorie', headerName: 'Sous-catégorie', width: 160, renderCell: (p) => p.row.sous_categorie?.nom || '—' },
    { field: 'date_achat', headerName: 'Date achat', width: 120 },
    {
      field: 'deleted_at', headerName: 'Supprimé le', width: 160,
      renderCell: (p) => p.value?.split('T')[0] || '—',
    },
    {
      field: 'actions', headerName: 'Actions', width: 120, sortable: false,
      renderCell: (p) => (
        <Box>
          <IconButton size="small" color="info" onClick={() => navigate(`/admin-parc/materiels/${p.row.id}`)}>
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton size="small" color="success" onClick={() => setConfirm({ open: true, id: p.row.id })} title="Restaurer">
            <RestoreFromTrash fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Corbeille</Typography>
        <TextField
          size="small" placeholder="Rechercher..."
          value={search} onChange={(e) => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><Search /></InputAdornment> }}
          sx={{ width: 260 }}
        />
      </Box>
      <Box sx={{ bgcolor: 'white', borderRadius: 2 }}>
        <DataGrid
          rows={materiels} columns={columns} loading={loading}
          paginationMode="server" rowCount={rowCount}
          paginationModel={paginationModel}
          onPaginationModelChange={setPaginationModel}
          pageSizeOptions={[10, 20, 50]}
          disableRowSelectionOnClick autoHeight
          sx={{ border: 'none' }}
        />
      </Box>
      <ConfirmDialog
        open={confirm.open}
        title="Restaurer ce matériel ?"
        message="Le matériel sera restauré depuis la corbeille."
        confirmText="Restaurer" color="success"
        onConfirm={handleRestore}
        onCancel={() => setConfirm({ open: false, id: null })}
      />
    </Box>
  );
}