import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField,
  FormControl, InputLabel, Select, MenuItem, Grid, CircularProgress, Alert,
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ServiceUserSelect from '../../components/admin-parc/ServiceUserSelect';

const TYPE_OPTIONS = [
  { value: 'PC', label: 'PC' },
  { value: 'imprimante', label: 'Imprimante' },
  { value: 'cartouche', label: 'Cartouche' },
  { value: 'autre', label: 'Autre' },
];

const PRIORITE_OPTIONS = [
  { value: 'faible', label: 'Faible' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'urgente', label: 'Urgente' },
];

export default function BesoinCreateDialog({ open, services, entites, onClose, onCreated }) {
  const [form, setForm] = useState({
    type_besoin: '', designation: '', description: '',
    date_demande: new Date().toISOString().split('T')[0],
    priorite: 'moyenne', entite_id: '',
  });
  const [affectation, setAffectation] = useState({ service_id: '', user_id: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleSubmit = async () => {
    setError('');

    if (!affectation.service_id || !affectation.user_id) {
      setError('Le service et l\'utilisateur sont obligatoires.');
      return;
    }
    if (!form.type_besoin || !form.designation || !form.date_demande) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin-parc/besoins', {
        ...form,
        utilisateur_id: affectation.user_id,
        service_id: affectation.service_id,
        entite_id: form.entite_id || null,
      });
      toast.success('Besoin créé avec succès.');
      resetForm();
      onCreated();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      type_besoin: '', designation: '', description: '',
      date_demande: new Date().toISOString().split('T')[0],
      priorite: 'moyenne', entite_id: '',
    });
    setAffectation({ service_id: '', user_id: '' });
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>Nouveau besoin</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {/* Service + Utilisateur */}
          <Grid item xs={12}>
            <ServiceUserSelect
              services={services}
              value={affectation}
              onChange={(val) => setAffectation(val)}
            />
          </Grid>

          {/* Entité */}
          {entites.length > 0 && (
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Entité</InputLabel>
                <Select value={form.entite_id} label="Entité" onChange={(e) => handleChange('entite_id', e.target.value)}>
                  <MenuItem value="">— Aucune —</MenuItem>
                  {entites.map((e) => <MenuItem key={e.id} value={e.id}>{e.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Type de besoin *</InputLabel>
              <Select value={form.type_besoin} label="Type de besoin *" onChange={(e) => handleChange('type_besoin', e.target.value)}>
                <MenuItem value="">— Sélectionner —</MenuItem>
                {TYPE_OPTIONS.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>

          {/* Désignation */}
          <Grid item xs={12}>
            <TextField
              fullWidth required label="Désignation *"
              value={form.designation}
              onChange={(e) => handleChange('designation', e.target.value)}
              placeholder="Ex: PC Portable HP ProBook 450"
            />
          </Grid>

          {/* Description */}
          <Grid item xs={12}>
            <TextField
              fullWidth multiline rows={3} label="Description"
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Détails supplémentaires..."
            />
          </Grid>

          {/* Date demande */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth required label="Date de demande *" type="date"
              value={form.date_demande}
              onChange={(e) => handleChange('date_demande', e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>

          {/* Priorité */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required>
              <InputLabel>Priorité *</InputLabel>
              <Select value={form.priorite} label="Priorité *" onChange={(e) => handleChange('priorite', e.target.value)}>
                {PRIORITE_OPTIONS.map((p) => <MenuItem key={p.value} value={p.value}>{p.label}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : 'Créer le besoin'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}