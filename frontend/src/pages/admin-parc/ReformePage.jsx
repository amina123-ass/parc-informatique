import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Chip, IconButton, TextField, InputAdornment } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility } from '@mui/icons-material';
import api from '../../api/client';

export default function ReformePage() {
  const navigate = useNavigate();
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowCount, setRowCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await api.get('/admin-parc/materiels', {
      params: {
        reforme_only: true,
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

  const columns = [
    { field: 'model', headerName: 'Modèle', flex: 1, minWidth: 180 },
    { field: 'marque', headerName: 'Marque', width: 120, renderCell: (p) => p.row.marque?.nom || '—' },
    { field: 'sous_categorie', headerName: 'Sous-catégorie', width: 160, renderCell: (p) => p.row.sous_categorie?.nom || '—' },
    { field: 'date_achat', headerName: 'Date achat', width: 120 },
    { field: 'date_reforme', headerName: 'Date réforme', width: 130 },
    { field: 'prix_unitaire', headerName: 'Prix (DH)', width: 110, renderCell: (p) => Number(p.value).toLocaleString('fr-MA') },
    {
      field: 'etat', headerName: 'État', width: 100,
      renderCell: () => <Chip label="Réformé" size="small" color="error" />,
    },
    {
      field: 'actions', headerName: '', width: 70, sortable: false,
      renderCell: (p) => (
        <IconButton size="small" color="info" onClick={() => navigate(`/admin-parc/materiels/${p.row.id}`)}>
          <Visibility fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Matériels réformés</Typography>
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
    </Box>
  );
}