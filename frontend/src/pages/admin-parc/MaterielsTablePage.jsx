// src/pages/admin-parc/MaterielsTablePage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Chip,
  IconButton,
  Breadcrumbs,
  Link,
  TextField,
  InputAdornment,
  CircularProgress,
  Card,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Add, Visibility, Edit, RemoveCircle, Delete, Search } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

const ETAT_COLORS = {
  EN_STOCK: 'success',
  AFFECTE:  'primary',
  PANNE:    'warning',
  REFORME:  'error',
};

const ETAT_LABELS = {
  EN_STOCK: 'En stock',
  AFFECTE:  'Affecté',
  PANNE:    'En panne',
  REFORME:  'Réformé',
};

export default function MaterielsTablePage() {
  const { categoryId, subCategoryId } = useParams();
  const navigate = useNavigate();

  const [subCat, setSubCat] = useState(null);
  const [materiels, setMateriels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 20 });
  const [rowCount, setRowCount] = useState(0);
  const [confirm, setConfirm] = useState({ open: false, type: '', id: null });

  const fetchSubCat = useCallback(async () => {
    try {
      const res = await api.get(`/admin-parc/sub-categories/${subCategoryId}`);
      setSubCat(res.data);
    } catch (error) {
      console.error('Erreur chargement sous-catégorie:', error);
      toast.error('Erreur lors du chargement de la sous-catégorie');
    }
  }, [subCategoryId]);

  const fetchMateriels = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin-parc/materiels', {
        params: {
          sous_category_id: subCategoryId,
          page:             paginationModel.page + 1,
          per_page:         paginationModel.pageSize,
          search:           search || undefined,
        },
      });
      setMateriels(res.data.data || []);
      setRowCount(res.data.total || 0);
    } catch (error) {
      console.error('Erreur chargement matériels:', error);
      toast.error('Erreur lors du chargement des matériels');
      setMateriels([]);
      setRowCount(0);
    } finally {
      setLoading(false);
    }
  }, [subCategoryId, paginationModel, search]);

  useEffect(() => { fetchSubCat(); }, [fetchSubCat]);
  useEffect(() => { fetchMateriels(); }, [fetchMateriels]);

  const handleReforme = async () => {
    try {
      await api.patch(`/admin-parc/materiels/${confirm.id}/reforme`);
      toast.success('Matériel réformé.');
      fetchMateriels();
    } catch (error) {
      console.error('Erreur réforme:', error);
      toast.error('Erreur lors de la réforme du matériel');
    }
    setConfirm({ open: false, type: '', id: null });
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin-parc/materiels/${confirm.id}`);
      toast.success('Matériel supprimé.');
      fetchMateriels();
    } catch (error) {
      console.error('Erreur suppression:', error);
      toast.error('Erreur lors de la suppression du matériel');
    }
    setConfirm({ open: false, type: '', id: null });
  };

  const columns = [
    {
      field: 'model',
      headerName: 'Modèle',
      flex: 1,
      minWidth: 160,
    },
    {
      field: 'numero_serie',             // ✅ Numéro de série
      headerName: 'N° Série',
      width: 150,
      renderCell: (p) => (
        <Typography
          variant="body2"
          sx={{ fontFamily: 'monospace', fontSize: 12 }}
        >
          {p.value || '—'}
        </Typography>
      ),
    },
    {
      field: 'marque',
      headerName: 'Marque',
      width: 120,
      renderCell: (p) => p.row.marque?.nom || '—',
    },
    {
      field: 'date_achat',
      headerName: 'Date achat',
      width: 120,
    },
    {
      field: 'prix_unitaire',
      headerName: 'Prix (DH)',
      width: 110,
      renderCell: (p) => (p.value ? Number(p.value).toLocaleString('fr-MA') : '—'),
    },
    {
      field: 'etat',
      headerName: 'État',
      width: 120,
      renderCell: (p) => (
        <Chip
          label={ETAT_LABELS[p.value] || p.value}
          size="small"
          color={ETAT_COLORS[p.value] || 'default'}
        />
      ),
    },
    {
      field: 'service_actuel',
      headerName: 'Service',
      width: 160,
      renderCell: (p) => p.row.affectation_active?.service?.nom || '—',
    },
    {
      field: 'user_actuel',
      headerName: 'Utilisateur',
      width: 160,
      renderCell: (p) => {
        const u = p.row.affectation_active?.user;
        return u ? `${u.nom} ${u.prenom}` : '—';
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.3 }}>
          <IconButton
            size="small"
            color="info"
            onClick={() => navigate(`/admin-parc/materiels/${p.row.id}`)}
            title="Voir"
          >
            <Visibility fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => navigate(`/admin-parc/materiels/${p.row.id}/edit`)}
            title="Modifier"
          >
            <Edit fontSize="small" />
          </IconButton>
          {p.row.etat !== 'REFORME' && (
            <IconButton
              size="small"
              color="warning"
              onClick={() => setConfirm({ open: true, type: 'reforme', id: p.row.id })}
              title="Réformer"
            >
              <RemoveCircle fontSize="small" />
            </IconButton>
          )}
          <IconButton
            size="small"
            color="error"
            onClick={() => setConfirm({ open: true, type: 'delete', id: p.row.id })}
            title="Supprimer"
          >
            <Delete fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  if (!subCat && !loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <Typography variant="h6" color="text.secondary">
          Sous-catégorie introuvable
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin-parc/dashboard')}
        >
          Tableau de bord
        </Link>
        {subCat?.categorie && (
          <Link
            underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
            onClick={() => navigate(`/admin-parc/categories/${subCat.categorie.id}`)}
          >
            {subCat.categorie.nom}
          </Link>
        )}
        <Typography color="text.primary" fontWeight={600}>
          {subCat?.nom || '...'}
        </Typography>
      </Breadcrumbs>

      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4">{subCat?.nom || 'Chargement...'}</Typography>
          {subCat?.materiels_count !== undefined && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {subCat.materiels_count} matériel{subCat.materiels_count > 1 ? 's' : ''}
            </Typography>
          )}
        </Box>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField
            size="small"
            placeholder="Modèle, N° série, marque..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ width: 260 }}
          />
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate(`/admin-parc/sub-categories/${subCategoryId}/materiels/new`)}
          >
            Nouveau matériel
          </Button>
        </Box>
      </Box>

      {/* DataGrid */}
      <Card>
        <DataGrid
          rows={materiels}
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
              bgcolor: 'grey.50',
              borderRadius: 0,
            },
          }}
          localeText={{
            noRowsLabel: 'Aucun matériel trouvé',
            MuiTablePagination: {
              labelRowsPerPage: 'Lignes par page',
            },
          }}
        />
      </Card>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirm.open && confirm.type === 'reforme'}
        title="Confirmer la réforme"
        message="Êtes-vous sûr de vouloir réformer ce matériel ? Il ne pourra plus être affecté."
        confirmText="Réformer"
        color="warning"
        onConfirm={handleReforme}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === 'delete'}
        title="Confirmer la suppression"
        message="Ce matériel sera envoyé dans la corbeille."
        confirmText="Supprimer"
        color="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirm({ open: false, type: '', id: null })}
      />
    </Box>
  );
}


