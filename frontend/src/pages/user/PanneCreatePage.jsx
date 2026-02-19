// src/pages/user/PanneCreatePage.jsx

import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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

export default function PanneCreatePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [materiels, setMateriels] = useState([]);

  const [form, setForm] = useState({
    materiel_id: location.state?.materiel_id || '',
    type_panne: '',
    priorite: 'moyenne',
    description: '',
  });

  useEffect(() => {
    loadMateriels();
  }, []);

  const loadMateriels = async () => {
    try {
      const res = await userApi.getMaterielsDisponibles();
      setMateriels(res.data || []);
    } catch (err) {
      toast.error('Erreur de chargement des matériels');
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
      await userApi.createPanne(form);
      toast.success('Panne déclarée avec succès. Un technicien sera notifié.');
      navigate('/user/pannes');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la déclaration');
      toast.error(err.response?.data?.message || 'Erreur lors de la déclaration');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/user/pannes')}
        >
          Retour
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          🔧 Déclarer une panne
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Card>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Alert severity="info">
                  Décrivez le problème rencontré de manière détaillée pour permettre au technicien d'intervenir rapidement.
                </Alert>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  required
                  select
                  label="Matériel concerné"
                  value={form.materiel_id}
                  onChange={(e) => handleChange('materiel_id', e.target.value)}
                  helperText="Sélectionnez le matériel qui vous est affecté"
                >
                  {materiels.map(mat => (
                    <MenuItem key={mat.id} value={mat.id}>
                      {mat.label} - {mat.numero_inventaire}
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
                  <MenuItem value="materielle">Panne matérielle (écran, clavier, souris...)</MenuItem>
                  <MenuItem value="logicielle">Panne logicielle (système, application...)</MenuItem>
                  <MenuItem value="reseau">Problème réseau (connexion, wifi...)</MenuItem>
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
                  helperText="Urgente : bloque votre travail"
                >
                  <MenuItem value="faible">Faible - Peut attendre</MenuItem>
                  <MenuItem value="moyenne">Moyenne - Important</MenuItem>
                  <MenuItem value="urgente">Urgente - Bloquant</MenuItem>
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
                  placeholder="Décrivez précisément le problème rencontré, les circonstances, les messages d'erreur éventuels..."
                  helperText="Plus votre description est précise, plus l'intervention sera rapide"
                />
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    onClick={() => navigate('/user/pannes')}
                    disabled={loading}
                  >
                    Annuler
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    color="error"
                    startIcon={<SendIcon />}
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