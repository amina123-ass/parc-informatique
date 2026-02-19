// src/pages/user/PanneDetailPage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, Divider,
  CircularProgress, Alert, Paper, Stepper, Step, StepLabel
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { userApi } from '../../services/userApi';

const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

export default function PanneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [panne, setPanne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPanne();
  }, [id]);

  const loadPanne = async () => {
    try {
      setLoading(true);
      const res = await userApi.getPanne(id);
      setPanne(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getActiveStep = () => {
    if (panne.statut === 'annulee') return 0;
    if (panne.statut === 'resolue') return 3;
    if (panne.statut === 'en_cours') return 2;
    return 1;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/user/pannes')}
          >
            Retour
          </Button>
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Panne {panne.numero_ticket}
          </Typography>
          <Chip 
            label={panne.statut.toUpperCase()}
            sx={{ 
              bgcolor: STATUT_COLORS[panne.statut],
              color: 'white'
            }}
          />
        </Box>
      </Box>

      {/* Progression */}
      {panne.statut !== 'annulee' && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Suivi de votre demande
            </Typography>
            <Stepper activeStep={getActiveStep()} sx={{ mt: 2 }}>
              <Step>
                <StepLabel>Déclarée</StepLabel>
              </Step>
              <Step>
                <StepLabel>En attente</StepLabel>
              </Step>
              <Step>
                <StepLabel>Prise en charge</StepLabel>
              </Step>
              <Step>
                <StepLabel>Résolue</StepLabel>
              </Step>
            </Stepper>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Type de panne
                  </Typography>
                  <Chip 
                    label={panne.type_panne}
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Priorité
                  </Typography>
                  <Chip 
                    label={panne.priorite.charAt(0).toUpperCase() + panne.priorite.slice(1)}
                    color={panne.priorite === 'urgente' ? 'error' : 'default'}
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Date de déclaration
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(panne.date_declaration).toLocaleDateString('fr-FR', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Matériel concerné */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Matériel concerné
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Équipement
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {panne.materiel?.marque?.nom} - {panne.materiel?.model}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Catégorie
                  </Typography>
                  <Typography variant="body1">
                    {panne.materiel?.sous_categorie?.nom}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Description */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Description du problème
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'grey.50' }}>
                <Typography variant="body2">
                  {panne.description}
                </Typography>
              </Paper>
            </CardContent>
          </Card>
        </Grid>

        {/* Prise en charge */}
        {panne.technicien && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Prise en charge
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Technicien assigné
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {panne.technicien.nom} {panne.technicien.prenom}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Date de prise en charge
                    </Typography>
                    <Typography variant="body1">
                      {panne.date_prise_en_charge 
                        ? new Date(panne.date_prise_en_charge).toLocaleDateString('fr-FR')
                        : 'N/A'
                      }
                    </Typography>
                  </Grid>
                  {panne.diagnostic && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Diagnostic
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter', mt: 1 }}>
                        <Typography variant="body2">
                          {panne.diagnostic}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Solution */}
        {panne.solution && (
          <Grid item xs={12}>
            <Card sx={{ border: '2px solid', borderColor: 'success.main' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <CheckCircleIcon color="success" />
                  <Typography variant="h6" color="success.main">
                    Panne résolue
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Date de résolution
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {new Date(panne.date_resolution).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Solution appliquée
                    </Typography>
                    <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter', mt: 1 }}>
                      <Typography variant="body2">
                        {panne.solution}
                      </Typography>
                    </Paper>
                  </Grid>
                  {panne.commentaire_technicien && (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="text.secondary">
                        Commentaire du technicien
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mt: 1 }}>
                        <Typography variant="body2">
                          {panne.commentaire_technicien}
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}