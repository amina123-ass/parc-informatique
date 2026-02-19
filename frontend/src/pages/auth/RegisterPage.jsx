import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Link, Alert, CircularProgress,
} from '@mui/material';
import { Computer } from '@mui/icons-material';
import api from '../../api/client';

export default function RegisterPage() {
  const [form, setForm] = useState({ matricule: '', nom: '', prenom: '', email: '', fonction: '' });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    setLoading(true);
    try {
      const res = await api.post('/auth/register', form);
      setSuccess(res.data.message);
      setForm({ matricule: '', nom: '', prenom: '', email: '', fonction: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Computer sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5">Inscription</Typography>
            <Typography color="text.secondary" variant="body2">Créer un compte Parc Informatique</Typography>
          </Box>

          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

          <form onSubmit={handleSubmit}>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
              <TextField label="Matricule" name="matricule" value={form.matricule} onChange={handleChange} required fullWidth />
              <TextField label="Fonction" name="fonction" value={form.fonction} onChange={handleChange} fullWidth />
              <TextField label="Nom" name="nom" value={form.nom} onChange={handleChange} required fullWidth />
              <TextField label="Prénom" name="prenom" value={form.prenom} onChange={handleChange} required fullWidth />
            </Box>
            <TextField label="Email" name="email" type="email" value={form.email} onChange={handleChange} required fullWidth sx={{ mt: 2 }} />
            <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 3, py: 1.3 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'S\'inscrire'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Déjà un compte ?{' '}
              <Link component={RouterLink} to="/login">Se connecter</Link>
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}