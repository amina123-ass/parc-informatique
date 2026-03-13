// src/pages/admin-parc/SousCategoriesManagePage.jsx

import { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Card, CardContent, IconButton, Chip,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Breadcrumbs, Link,
} from '@mui/material';
import { Add, Edit, Delete, Category } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../api/client';
import SousCategorieDialog from '../../components/admin-parc/SousCategorieDialog';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

export default function SousCategoriesManagePage() {
  const navigate = useNavigate();
  const [sousCategories, setSousCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [categoryId, setCategoryId] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin-parc/sous-categories');
      setSousCategories(res.data);
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = (catId = null) => {
    setEditId(null);
    setCategoryId(catId);
    setDialogOpen(true);
  };

  const handleEdit = (id) => {
    setEditId(id);
    setCategoryId(null);
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await api.delete(`/admin-parc/sous-categories/${confirmDelete.id}`);
      toast.success('Sous-catégorie supprimée.');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur lors de la suppression.');
    }
    setConfirmDelete({ open: false, id: null });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover"
          color="inherit"
          sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin-parc/categories')}
        >
          Catégories
        </Link>
        <Typography color="text.primary" fontWeight={600}>
          Gestion des sous-catégories
        </Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Gestion des sous-catégories</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleCreate()}
        >
          Nouvelle sous-catégorie
        </Button>
      </Box>

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Catégorie</TableCell>
                  <TableCell>Nom</TableCell>
                  <TableCell>Attributs</TableCell>
                  <TableCell>Matériels</TableCell>
                  <TableCell>Ordre</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {sousCategories.map((sub) => (
                  <TableRow key={sub.id}>
                    <TableCell>
                      <Chip
                        icon={<Category />}
                        label={sub.categorie?.nom}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600}>{sub.nom}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${sub.attributes?.length || 0} attribut(s)`}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`${sub.materiels_count || 0}`}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{sub.trie}</TableCell>
                    <TableCell align="right">
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleEdit(sub.id)}
                        title="Modifier"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => setConfirmDelete({ open: true, id: sub.id })}
                        title="Supprimer"
                        disabled={sub.materiels_count > 0}
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <SousCategorieDialog
        open={dialogOpen}
        categoryId={categoryId}
        editId={editId}
        onClose={() => setDialogOpen(false)}
        onSaved={() => {
          setDialogOpen(false);
          fetchData();
        }}
      />

      <ConfirmDialog
        open={confirmDelete.open}
        title="Supprimer la sous-catégorie"
        message="Êtes-vous sûr de vouloir supprimer cette sous-catégorie ? Cette action est irréversible."
        confirmText="Supprimer"
        color="error"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />
    </Box>
  );
}

