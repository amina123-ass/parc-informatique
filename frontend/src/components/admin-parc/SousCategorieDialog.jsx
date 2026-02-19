// src/components/admin-parc/SousCategorieDialog.jsx

import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, CircularProgress, Alert, Box,
  Stepper, Step, StepLabel, Typography,
} from '@mui/material';
import { Category, ViewModule } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import AttributeFieldsBuilder from './AttributeFieldsBuilder';

export default function SousCategorieDialog({ open, categoryId, editId, onClose, onSaved }) {
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState({
    category_id: categoryId || '',
    nom: '',
    trie: 0,
  });
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const isEdit = !!editId;

  const steps = ['Informations de base', 'Attributs spécifiques'];

  useEffect(() => {
    const init = async () => {
      try {
        const catRes = await api.get('/admin-parc/categories');
        setCategories(catRes.data || []);

        if (editId) {
          const subRes = await api.get(`/admin-parc/sous-categories/${editId}`);
          const sub = subRes.data;
          setForm({
            category_id: sub.category_id,
            nom: sub.nom,
            trie: sub.trie || 0,
          });
          setAttributes(sub.attributes || []);
        } else if (categoryId) {
          setForm((f) => ({ ...f, category_id: categoryId }));
        }
      } catch (err) {
        console.error('Erreur init:', err);
      }
    };
    if (open) {
      init();
    }
  }, [open, editId, categoryId]);

  const handleNext = () => {
    if (activeStep === 0) {
      if (!form.category_id || !form.nom) {
        setError('Veuillez remplir tous les champs obligatoires.');
        return;
      }
      setError('');
    }
    setActiveStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setError('');
    
    // Validation
    if (!form.category_id || !form.nom) {
      setError('Veuillez remplir tous les champs obligatoires.');
      setActiveStep(0);
      return;
    }

    // Vérifier que tous les attributs ont un libellé
    const invalidAttrs = attributes.filter((a) => !a.label || !a.key);
    if (invalidAttrs.length > 0) {
      setError('Tous les attributs doivent avoir un nom.');
      setActiveStep(1);
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        attributes: attributes.filter((a) => a.key && a.label),
      };

      if (isEdit) {
        await api.patch(`/admin-parc/sous-categories/${editId}`, payload);
        toast.success('Sous-catégorie mise à jour.');
      } else {
        await api.post('/admin-parc/sous-categories', payload);
        toast.success('Sous-catégorie créée avec succès.');
      }

      resetForm();
      onSaved?.();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ category_id: categoryId || '', nom: '', trie: 0 });
    setAttributes([]);
    setError('');
    setActiveStep(0);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ViewModule color="primary" />
          <Typography variant="h6">
            {isEdit ? 'Modifier la sous-catégorie' : 'Nouvelle sous-catégorie'}
          </Typography>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* ÉTAPE 1: Informations de base */}
        {activeStep === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Alert severity="info" icon={<Category />}>
              Une sous-catégorie représente un type spécifique de matériel.
              <br />
              <strong>Exemples :</strong> PC Portable, Imprimante, Scanner, Switch...
            </Alert>

            <FormControl fullWidth required>
              <InputLabel>Catégorie parente</InputLabel>
              <Select
                value={form.category_id}
                label="Catégorie parente"
                onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                disabled={isEdit}
              >
                <MenuItem value="">— Sélectionner —</MenuItem>
                {categories.map((c) => (
                  <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              required
              label="Nom de la sous-catégorie"
              value={form.nom}
              onChange={(e) => setForm({ ...form, nom: e.target.value })}
              placeholder="Ex: PC Portable, Imprimante Laser..."
              helperText="Donnez un nom clair et descriptif"
            />

            <TextField
              fullWidth
              type="number"
              label="Ordre d'affichage"
              value={form.trie}
              onChange={(e) => setForm({ ...form, trie: parseInt(e.target.value) || 0 })}
              helperText="Les sous-catégories avec un ordre plus petit apparaissent en premier"
            />
          </Box>
        )}

        {/* ÉTAPE 2: Attributs spécifiques */}
        {activeStep === 1 && (
          <Box>
            <AttributeFieldsBuilder
              attributes={attributes}
              onChange={setAttributes}
            />
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
        <Button onClick={handleClose}>Annuler</Button>
        
        {activeStep > 0 && (
          <Button onClick={handleBack}>Retour</Button>
        )}
        
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext}>
            Suivant
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={loading}>
            {loading ? <CircularProgress size={22} /> : (isEdit ? 'Mettre à jour' : 'Créer')}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}