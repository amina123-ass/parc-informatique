import { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Alert, CircularProgress,
} from '@mui/material';
import toast from 'react-hot-toast';
import api from '../../api/client';

export default function QuickCreateUserModal({ open, serviceId, onClose, onCreated }) {
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/admin-parc/users/quick-create', {
        ...form,
        service_id: serviceId,
      });
      toast.success('Utilisateur créé.');
      onCreated(res.data.user);
      setForm({ matricule: '', nom: '', prenom: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({ matricule: '', nom: '', prenom: '' });
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Ajouter un utilisateur (rapide)</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Alert severity="info" sx={{ mb: 2 }}>
          Cet utilisateur sera créé avec un compte minimal. L'AdminSI devra compléter et activer le compte.
        </Alert>
        <TextField fullWidth label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} margin="normal" required />
        <TextField fullWidth label="Nom" name="nom" value={form.nom} onChange={handleChange} margin="normal" required />
        <TextField fullWidth label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} margin="normal" required />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose}>Annuler</Button>
        <Button variant="contained" onClick={handleSubmit} disabled={loading}>
          {loading ? <CircularProgress size={22} /> : 'Créer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}