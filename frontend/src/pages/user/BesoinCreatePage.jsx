// src/pages/user/BesoinCreatePage.jsx - VERSION FINALE

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Button, Grid, Alert
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { userApi } from '../../services/userApi';
import toast from 'react-hot-toast';

export default function BesoinCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    type_besoin: '',
    designation: '',
    priorite: 'moyenne',
    description: '',
  });

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await userApi.createBesoin(form);
      toast.success('Demande envoyée avec succès. Elle sera examinée par votre responsable.');
      navigate('/user/besoins');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la création');
      toast.error(err.response?.data?.message || 'Erreur lors de la création');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/user/besoins')}
        >
          Retour
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          📋 Nouvelle demande de matériel
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Remplissez ce formulaire pour demander du matériel informatique. Votre demande sera soumise à votre responsable pour validation.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Type de besoin"
                  value={form.type_besoin}
                  onChange={(e) => handleChange('type_besoin', e.target.value)}
                  helperText="Sélectionnez le type de matériel demandé"
                >
                  {/* ✅ VALEURS EXACTES DE VOTRE BASE DE DONNÉES */}
                  <MenuItem value="PC">PC / Ordinateur</MenuItem>
                  <MenuItem value="imprimante">Imprimante</MenuItem>
                  <MenuItem value="cartouche">Cartouche d'encre</MenuItem>
                  <MenuItem value="autre">Autre matériel</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Priorité"
                  value={form.priorite}
                  onChange={(e) => handleChange('priorite', e.target.value)}
                  helperText="Urgence de votre demande"
                >
                  {/* ✅ VALEURS EXACTES DE VOTRE BASE DE DONNÉES */}
                  <MenuItem value="faible">Faible - Peut attendre</MenuItem>
                  <MenuItem value="moyenne">Moyenne - Important</MenuItem>
                  <MenuItem value="urgente">Urgente - Bloquant</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Titre de la demande"
                  value={form.designation}
                  onChange={(e) => handleChange('designation', e.target.value)}
                  placeholder="Ex: PC portable HP EliteBook, Imprimante Laser HP, Cartouches HP 305..."
                  helperText="Donnez un titre court et descriptif à votre demande"
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={6}
                  label="Description détaillée"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez précisément votre besoin :&#10;- Marque et modèle souhaités&#10;- Caractéristiques techniques nécessaires&#10;- Raison de la demande (remplacement, nouveau poste, panne...)&#10;- Toute information utile..."
                  helperText="Plus votre description est précise, plus le traitement sera rapide"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/user/besoins')}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SendIcon />}
                    disabled={loading || !form.type_besoin || !form.designation || !form.description}
                  >
                    {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}