import { useState, useEffect } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  Chip, Divider, CircularProgress, TextField, Grid, Stepper, Step, StepLabel,
  StepContent, Alert,
} from '@mui/material';
import {
  Person, Business, CalendarToday, PlayArrow, CheckCircle, Cancel,
  History, AccessTime,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';

const STATUT_CONFIG = {
  en_attente: { label: 'En attente', color: 'warning' },
  en_cours:   { label: 'En cours',   color: 'info' },
  valide:     { label: 'Validé',     color: 'success' },
  rejete:     { label: 'Rejeté',     color: 'error' },
};

const PRIORITE_CONFIG = {
  faible:  { label: 'Faible',  color: 'default' },
  moyenne: { label: 'Moyenne', color: 'primary' },
  urgente: { label: 'Urgente', color: 'error' },
};

export default function BesoinDetailDialog({ open, besoinId, onClose, onAction }) {
  const [besoin, setBesoin] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMode, setActionMode] = useState(null); // 'valider' | 'rejeter' | null
  const [commentaire, setCommentaire] = useState('');
  const [motifRejet, setMotifRejet] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && besoinId) {
      setLoading(true);
      setActionMode(null);
      setCommentaire('');
      setMotifRejet('');
      api.get(`/admin-parc/besoins/${besoinId}`)
        .then((res) => setBesoin(res.data))
        .catch(() => toast.error('Erreur lors du chargement.'))
        .finally(() => setLoading(false));
    }
  }, [open, besoinId]);

  const handleEnCours = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin-parc/besoins/${besoinId}/en-cours`, { commentaire });
      toast.success('Besoin passé en cours.');
      onAction?.();
    } catch { /* handled */ }
    setSaving(false);
  };

  const handleValider = async () => {
    setSaving(true);
    try {
      await api.patch(`/admin-parc/besoins/${besoinId}/valider`, { commentaire });
      toast.success('Besoin validé.');
      onAction?.();
    } catch { /* handled */ }
    setSaving(false);
  };

  const handleRejeter = async () => {
    if (!motifRejet.trim()) {
      toast.error('Le motif de rejet est obligatoire.');
      return;
    }
    setSaving(true);
    try {
      await api.patch(`/admin-parc/besoins/${besoinId}/rejeter`, {
        motif_rejet: motifRejet,
        commentaire,
      });
      toast.success('Besoin rejeté.');
      onAction?.();
    } catch { /* handled */ }
    setSaving(false);
  };

  const canProcess = besoin && ['en_attente', 'en_cours'].includes(besoin.statut);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h6">
            Besoin #{besoinId}
          </Typography>
          {besoin && (
            <Chip
              label={STATUT_CONFIG[besoin.statut]?.label}
              color={STATUT_CONFIG[besoin.statut]?.color}
              size="small"
              sx={{ mt: 0.5 }}
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>
        ) : besoin ? (
          <Box>
            {/* ── Infos principales ── */}
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={12} sm={6}>
                <InfoBlock
                  icon={<Person fontSize="small" color="primary" />}
                  label="Demandeur"
                  value={`${besoin.utilisateur?.nom} ${besoin.utilisateur?.prenom}`}
                  sub={besoin.utilisateur?.matricule}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <InfoBlock
                  icon={<Business fontSize="small" color="primary" />}
                  label="Service"
                  value={besoin.service?.nom}
                  sub={besoin.entite?.nom}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <InfoBlock
                  icon={<CalendarToday fontSize="small" color="primary" />}
                  label="Date demande"
                  value={besoin.date_demande}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Type</Typography>
                <Box><Chip label={besoin.type_besoin} size="small" variant="outlined" /></Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Priorité</Typography>
                <Box>
                  <Chip
                    label={PRIORITE_CONFIG[besoin.priorite]?.label}
                    color={PRIORITE_CONFIG[besoin.priorite]?.color}
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>

            {/* Désignation & Description */}
            <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="subtitle2" color="text.secondary">Désignation</Typography>
              <Typography variant="body1" fontWeight={600} sx={{ mb: 1 }}>{besoin.designation}</Typography>
              {besoin.description && (
                <>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>Description</Typography>
                  <Typography variant="body2">{besoin.description}</Typography>
                </>
              )}
            </Box>

            {/* Réponse responsable */}
            {besoin.date_reponse && (
              <Alert
                severity={besoin.statut === 'valide' ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                <Typography variant="subtitle2">
                  Réponse du {besoin.date_reponse}
                </Typography>
                {besoin.commentaire_responsable && (
                  <Typography variant="body2">Commentaire: {besoin.commentaire_responsable}</Typography>
                )}
                {besoin.motif_rejet && (
                  <Typography variant="body2">Motif de rejet: {besoin.motif_rejet}</Typography>
                )}
              </Alert>
            )}

            {/* ── Zone d'action ── */}
            {canProcess && !actionMode && (
              <Box sx={{ display: 'flex', gap: 1, mb: 3, p: 2, border: '1px dashed', borderColor: 'divider', borderRadius: 1 }}>
                {besoin.statut === 'en_attente' && (
                  <Button variant="outlined" color="primary" startIcon={<PlayArrow />} onClick={handleEnCours} disabled={saving}>
                    Passer en cours
                  </Button>
                )}
                <Button variant="contained" color="success" startIcon={<CheckCircle />} onClick={() => setActionMode('valider')}>
                  Valider
                </Button>
                <Button variant="contained" color="error" startIcon={<Cancel />} onClick={() => setActionMode('rejeter')}>
                  Rejeter
                </Button>
              </Box>
            )}

            {/* Formulaire validation */}
            {actionMode === 'valider' && (
              <Box sx={{ mb: 3, p: 2, border: '2px solid', borderColor: 'success.main', borderRadius: 1 }}>
                <Typography variant="subtitle1" color="success.main" fontWeight={600} sx={{ mb: 1 }}>
                  Valider ce besoin
                </Typography>
                <TextField
                  fullWidth multiline rows={2} label="Commentaire (optionnel)"
                  value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="success" onClick={handleValider} disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : 'Confirmer la validation'}
                  </Button>
                  <Button onClick={() => setActionMode(null)}>Annuler</Button>
                </Box>
              </Box>
            )}

            {/* Formulaire rejet */}
            {actionMode === 'rejeter' && (
              <Box sx={{ mb: 3, p: 2, border: '2px solid', borderColor: 'error.main', borderRadius: 1 }}>
                <Typography variant="subtitle1" color="error.main" fontWeight={600} sx={{ mb: 1 }}>
                  Rejeter ce besoin
                </Typography>
                <TextField
                  fullWidth multiline rows={2} label="Motif de rejet *" required
                  value={motifRejet} onChange={(e) => setMotifRejet(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <TextField
                  fullWidth multiline rows={2} label="Commentaire (optionnel)"
                  value={commentaire} onChange={(e) => setCommentaire(e.target.value)}
                  sx={{ mb: 2 }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button variant="contained" color="error" onClick={handleRejeter} disabled={saving}>
                    {saving ? <CircularProgress size={20} /> : 'Confirmer le rejet'}
                  </Button>
                  <Button onClick={() => setActionMode(null)}>Annuler</Button>
                </Box>
              </Box>
            )}

            {/* ── Historique ── */}
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <History color="primary" />
              <Typography variant="h6">Historique</Typography>
            </Box>

            {besoin.historiques?.length > 0 ? (
              <Stepper orientation="vertical" activeStep={-1}>
                {besoin.historiques.map((h, index) => (
                  <Step key={h.id} active expanded>
                    <StepLabel
                      StepIconComponent={() => (
                        <AccessTime fontSize="small" color={index === 0 ? 'primary' : 'disabled'} />
                      )}
                    >
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        {h.ancien_statut && (
                          <Chip label={STATUT_CONFIG[h.ancien_statut]?.label || h.ancien_statut} size="small" variant="outlined" />
                        )}
                        {h.ancien_statut && '→'}
                        <Chip
                          label={STATUT_CONFIG[h.nouveau_statut]?.label || h.nouveau_statut}
                          size="small"
                          color={STATUT_CONFIG[h.nouveau_statut]?.color || 'default'}
                        />
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="caption" color="text.secondary">
                        {h.date_action} — par {h.user_action?.nom} {h.user_action?.prenom}
                      </Typography>
                      {h.commentaire && (
                        <Typography variant="body2" sx={{ mt: 0.5 }}>
                          {h.commentaire}
                        </Typography>
                      )}
                    </StepContent>
                  </Step>
                ))}
              </Stepper>
            ) : (
              <Typography variant="body2" color="text.secondary">Aucun historique.</Typography>
            )}
          </Box>
        ) : (
          <Typography>Besoin introuvable.</Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Fermer</Button>
      </DialogActions>
    </Dialog>
  );
}

function InfoBlock({ icon, label, value, sub }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
      {icon}
      <Box>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="body2" fontWeight={600}>{value || '—'}</Typography>
        {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
      </Box>
    </Box>
  );
}