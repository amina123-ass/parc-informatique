// src/pages/admin-parc/PanneDetailPage.jsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, Typography, Grid, Chip, Button, Divider,
  CircularProgress, Alert, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, MenuItem, Paper
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Build as BuildIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { panneApi } from '../../services/panneApi';
import toast from 'react-hot-toast';

const STATUT_COLORS = {
  declaree: '#ffa726',
  en_cours: '#42a5f5',
  resolue: '#66bb6a',
  annulee: '#bdbdbd',
};

const TYPE_PANNE_LABELS = {
  materielle: 'Matérielle',
  logicielle: 'Logicielle',
  reseau: 'Réseau',
  autre: 'Autre',
};

export default function PanneDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [panne, setPanne] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [techniciens, setTechniciens] = useState([]);

  // Dialogs
  const [priseEnChargeDialog, setPriseEnChargeDialog] = useState(false);
  const [resoudreDialog, setResoudreDialog] = useState(false);
  const [annulerDialog, setAnnulerDialog] = useState(false);

  // Forms
  const [priseEnChargeForm, setPriseEnChargeForm] = useState({
    technicien_id: '',
    diagnostic: '',
  });
  const [resoudreForm, setResoudreForm] = useState({
    solution: '',
    commentaire_technicien: '',
  });
  const [annulerForm, setAnnulerForm] = useState({
    motif_annulation: '',
  });

  useEffect(() => {
    loadPanne();
    loadTechniciens();
  }, [id]);

  const loadPanne = async () => {
    try {
      setLoading(true);
      const res = await panneApi.getPanne(id);
      setPanne(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const loadTechniciens = async () => {
    try {
      const res = await panneApi.getTechniciens();
      setTechniciens(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriseEnCharge = async () => {
    try {
      await panneApi.priseEnCharge(id, priseEnChargeForm);
      toast.success('Panne prise en charge');
      setPriseEnChargeDialog(false);
      loadPanne();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleResoudre = async () => {
    try {
      await panneApi.resoudre(id, resoudreForm);
      toast.success('Panne résolue');
      setResoudreDialog(false);
      loadPanne();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
    }
  };

  const handleAnnuler = async () => {
    try {
      await panneApi.annuler(id, annulerForm);
      toast.success('Panne annulée');
      setAnnulerDialog(false);
      loadPanne();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Erreur');
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

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin-parc/pannes')}
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

        <Box sx={{ display: 'flex', gap: 1 }}>
          {panne.statut === 'declaree' && (
            <>
              <Button
                variant="contained"
                startIcon={<BuildIcon />}
                onClick={() => setPriseEnChargeDialog(true)}
              >
                Prendre en charge
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setAnnulerDialog(true)}
              >
                Annuler
              </Button>
            </>
          )}
          {panne.statut === 'en_cours' && (
            <>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircleIcon />}
                onClick={() => setResoudreDialog(true)}
              >
                Résoudre
              </Button>
              <Button
                variant="outlined"
                color="error"
                startIcon={<CancelIcon />}
                onClick={() => setAnnulerDialog(true)}
              >
                Annuler
              </Button>
            </>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Informations générales */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informations générales
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Type de panne
                  </Typography>
                  <Chip 
                    label={TYPE_PANNE_LABELS[panne.type_panne]}
                    color="primary"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Priorité
                  </Typography>
                  <Chip 
                    label={panne.priorite.charAt(0).toUpperCase() + panne.priorite.slice(1)}
                    color={
                      panne.priorite === 'urgente' ? 'error' :
                      panne.priorite === 'moyenne' ? 'warning' : 'default'
                    }
                    sx={{ mt: 0.5 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Typography variant="body2" color="text.secondary">
                    Date de déclaration
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {new Date(panne.date_declaration).toLocaleDateString('fr-FR')}
                  </Typography>
                </Grid>
                {panne.date_resolution && (
                  <Grid item xs={12} sm={6} md={3}>
                    <Typography variant="body2" color="text.secondary">
                      Délai de résolution
                    </Typography>
                    <Typography variant="body1" fontWeight={600} color="success.main">
                      {Math.ceil(
                        (new Date(panne.date_resolution) - new Date(panne.date_declaration)) 
                        / (1000 * 60 * 60 * 24)
                      )} jours
                    </Typography>
                  </Grid>
                )}
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
                    Marque / Modèle
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
                    {panne.materiel?.categorie?.nom} / {panne.materiel?.sous_categorie?.nom}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Localisation */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Localisation
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Entité
                  </Typography>
                  <Typography variant="body1">
                    {panne.entite?.nom || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography variant="body2" color="text.secondary">
                    Service
                  </Typography>
                  <Typography variant="body1">
                    {panne.service?.nom || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Déclarant
                  </Typography>
                  <Typography variant="body1">
                    {panne.declarant 
                      ? `${panne.declarant.nom} ${panne.declarant.prenom}`
                      : 'N/A'
                    }
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

        {/* Diagnostic */}
        {panne.diagnostic && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Diagnostic
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'info.lighter' }}>
                  <Typography variant="body2">
                    {panne.diagnostic}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Solution */}
        {panne.solution && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Solution apportée
                </Typography>
                <Divider sx={{ mb: 2 }} />
                <Paper variant="outlined" sx={{ p: 2, bgcolor: 'success.lighter' }}>
                  <Typography variant="body2">
                    {panne.solution}
                  </Typography>
                </Paper>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Technicien */}
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
                      Technicien
                    </Typography>
                    <Typography variant="body1">
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
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Dialog Prise en charge */}
      <Dialog open={priseEnChargeDialog} onClose={() => setPriseEnChargeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Prendre en charge la panne</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label="Technicien *"
                value={priseEnChargeForm.technicien_id}
                onChange={(e) => setPriseEnChargeForm(prev => ({ ...prev, technicien_id: e.target.value }))}
              >
                {techniciens.map(tech => (
                  <MenuItem key={tech.id} value={tech.id}>
                    {tech.nom} {tech.prenom} - {tech.fonction}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Diagnostic initial"
                value={priseEnChargeForm.diagnostic}
                onChange={(e) => setPriseEnChargeForm(prev => ({ ...prev, diagnostic: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPriseEnChargeDialog(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            onClick={handlePriseEnCharge}
            disabled={!priseEnChargeForm.technicien_id}
          >
            Confirmer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Résoudre */}
      <Dialog open={resoudreDialog} onClose={() => setResoudreDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Résoudre la panne</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                multiline
                rows={4}
                label="Solution appliquée *"
                value={resoudreForm.solution}
                onChange={(e) => setResoudreForm(prev => ({ ...prev, solution: e.target.value }))}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Commentaire technique"
                value={resoudreForm.commentaire_technicien}
                onChange={(e) => setResoudreForm(prev => ({ ...prev, commentaire_technicien: e.target.value }))}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResoudreDialog(false)}>Annuler</Button>
          <Button 
            variant="contained" 
            color="success"
            onClick={handleResoudre}
            disabled={!resoudreForm.solution}
          >
            Résoudre
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Annuler */}
      <Dialog open={annulerDialog} onClose={() => setAnnulerDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Annuler la panne</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            required
            multiline
            rows={4}
            label="Motif d'annulation *"
            value={annulerForm.motif_annulation}
            onChange={(e) => setAnnulerForm({ motif_annulation: e.target.value })}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAnnulerDialog(false)}>Fermer</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={handleAnnuler}
            disabled={!annulerForm.motif_annulation}
          >
            Annuler la panne
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}