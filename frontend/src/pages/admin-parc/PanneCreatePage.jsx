// src/pages/admin-parc/PanneCreatePage.jsx - VERSION CORRIGÉE COMPLÈTE

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, TextField, MenuItem,
  Button, Grid, Alert, Autocomplete
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { panneApi } from '../../services/panneApi';
import api from '../../api/client'; // ✅ CORRECTION ICI
import toast from 'react-hot-toast';

export default function PanneCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [materiels, setMateriels] = useState([]);
  const [users, setUsers] = useState([]);

  const [form, setForm] = useState({
    materiel_id: '',
    type_panne: '',
    priorite: 'moyenne',
    description: '',
    user_declarant_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // ✅ CORRECTION : Utiliser la route admin-parc au lieu de admin
      const [materielsRes, usersRes] = await Promise.all([
        api.get('/admin-parc/materiels?etat=AFFECTE&per_page=500'),
        api.get('/admin-parc/users'), // ✅ Changé de /admin/users à /admin-parc/users
      ]);
      setMateriels(materielsRes.data.data || []);
      setUsers(usersRes.data || []); // ✅ Adapté selon le format de réponse
    } catch (err) {
      console.error(err);
      toast.error('Erreur de chargement des données');
    }
  };

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      await panneApi.createPanne(form);
      toast.success('Panne déclarée avec succès');
      navigate('/admin-parc/pannes');
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
          onClick={() => navigate('/admin-parc/pannes')}
        >
          Retour
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Déclarer une nouvelle panne
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Matériel concerné"
                  value={form.materiel_id}
                  onChange={(e) => handleChange('materiel_id', e.target.value)}
                >
                  {materiels.map(mat => (
                    <MenuItem key={mat.id} value={mat.id}>
                      {mat.marque?.nom} {mat.model} - {mat.affectation_active?.service?.nom}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  select
                  label="Déclarant (optionnel)"
                  value={form.user_declarant_id}
                  onChange={(e) => handleChange('user_declarant_id', e.target.value)}
                  helperText="Laisser vide pour déclarer en votre nom"
                >
                  <MenuItem value="">Moi-même</MenuItem>
                  {users.map(user => (
                    <MenuItem key={user.id} value={user.id}>
                      {user.nom} {user.prenom} {user.matricule ? `(${user.matricule})` : ''}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Type de panne"
                  value={form.type_panne}
                  onChange={(e) => handleChange('type_panne', e.target.value)}
                >
                  <MenuItem value="materielle">Matérielle</MenuItem>
                  <MenuItem value="logicielle">Logicielle</MenuItem>
                  <MenuItem value="reseau">Réseau</MenuItem>
                  <MenuItem value="autre">Autre</MenuItem>
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
                >
                  <MenuItem value="faible">Faible</MenuItem>
                  <MenuItem value="moyenne">Moyenne</MenuItem>
                  <MenuItem value="urgente">Urgente</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  multiline
                  rows={6}
                  label="Description du problème"
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Décrivez en détail le problème rencontré..."
                  helperText="Soyez le plus précis possible pour faciliter le diagnostic"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/admin-parc/pannes')}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={loading || !form.materiel_id || !form.type_panne || !form.description}
                  >
                    {loading ? 'Déclaration en cours...' : 'Déclarer la panne'}
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