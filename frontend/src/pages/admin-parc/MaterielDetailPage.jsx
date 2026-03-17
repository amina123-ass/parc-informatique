// src/pages/admin-parc/MaterielDetailPage.jsx

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, Grid, Chip, Button,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Breadcrumbs, Link, IconButton, Dialog,
  DialogTitle, DialogContent, Tooltip,
} from '@mui/material';
import {
  Edit, ArrowBack, Undo, RemoveCircle,
  PictureAsPdf, OpenInNew, Close, Wifi,
} from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import ConfirmDialog from '../../components/admin-parc/ConfirmDialog';

const ETAT_COLORS = {
  EN_STOCK: 'success',
  AFFECTE:  'primary',
  PANNE:    'warning',
  REFORME:  'error',
};

const ETAT_LABELS = {
  EN_STOCK: 'En stock',
  AFFECTE:  'Affecté',
  PANNE:    'En panne',
  REFORME:  'Réformé',
};

// ✅ Même dictionnaire que MaterielCreatePage
const TYPES_CONNEXION = [
  { value: 'ETHERNET',      label: 'Ethernet (RJ45)' },
  { value: 'WIFI',          label: 'Wi-Fi' },
  { value: 'ETHERNET_WIFI', label: 'Ethernet + Wi-Fi' },
  { value: 'FIBRE',         label: 'Fibre optique' },
  { value: '4G',            label: '4G / LTE' },
  { value: 'BLUETOOTH',     label: 'Bluetooth' },
  { value: 'VPN',           label: 'VPN' },
];

// ✅ Comparaison insensible à la casse (corrige "wifi" vs "WIFI")
const getReseauLabel = (value) => {
  if (!value) return null;
  const found = TYPES_CONNEXION.find(
    (t) => t.value.toLowerCase() === String(value).toLowerCase()
  );
  return found ? found.label : value; // fallback: affiche la valeur brute
};

// ✅ Formatter de date ISO → DD/MM/YYYY
const formatDate = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (isNaN(date)) return value;
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

export default function MaterielDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [materiel, setMateriel]   = useState(null);
  const [loading, setLoading]     = useState(true);
  const [confirm, setConfirm]     = useState({ open: false, type: '' });
  const [pdfDialog, setPdfDialog] = useState({ open: false, url: null, title: '' });

  const fetchMateriel = async () => {
    try {
      const res = await api.get(`/admin-parc/materiels/${id}`);
      setMateriel(res.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMateriel();
  }, [id]);

  const handleReturn = async () => {
    const activeAff = materiel.affectation_active;
    if (!activeAff) return;
    try {
      await api.patch(`/admin-parc/affectations/${activeAff.id}/return`);
      toast.success('Matériel retourné.');
      fetchMateriel();
    } catch { /* handled by interceptor */ }
    setConfirm({ open: false, type: '' });
  };

  const handleReforme = async () => {
    try {
      await api.patch(`/admin-parc/materiels/${id}/reforme`);
      toast.success('Matériel réformé.');
      fetchMateriel();
    } catch { /* handled by interceptor */ }
    setConfirm({ open: false, type: '' });
  };

  const handleOpenPdf = (url, title = 'Bon de sortie') => {
    setPdfDialog({ open: true, url, title });
  };

  const handleClosePdf = () => {
    setPdfDialog({ open: false, url: null, title: '' });
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (!materiel) {
    return <Typography>Matériel introuvable.</Typography>;
  }

  const specs       = materiel.specs || {};
  const activeAff   = materiel.affectation_active;
  const reseauLabel = getReseauLabel(materiel.reseau);

  return (
    <Box>
      {/* ── Breadcrumbs ── */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin-parc/categories')}>
          Catégories
        </Link>
        <Typography color="text.primary">{materiel.model}</Typography>
      </Breadcrumbs>

      {/* ── Header ── */}
      <Box sx={{
        display: 'flex', justifyContent: 'space-between',
        alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2,
      }}>
        <Box>
          <Typography variant="h4">{materiel.model}</Typography>
          {materiel.numero_serie && (
            <Typography variant="body2" color="text.secondary"
              sx={{ mt: 0.3, fontFamily: 'monospace' }}>
              N° série : {materiel.numero_serie}
            </Typography>
          )}
          <Chip
            label={ETAT_LABELS[materiel.etat] || materiel.etat}
            color={ETAT_COLORS[materiel.etat] || 'default'}
            sx={{ mt: 0.5 }}
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate(-1)}>
            Retour
          </Button>
          <Button variant="contained" startIcon={<Edit />}
            onClick={() => navigate(`/admin-parc/materiels/${id}/edit`)}>
            Modifier
          </Button>
          {activeAff && (
            <Button variant="outlined" color="warning" startIcon={<Undo />}
              onClick={() => setConfirm({ open: true, type: 'return' })}>
              Retourner
            </Button>
          )}
          {materiel.etat !== 'REFORME' && !activeAff && (
            <Button variant="outlined" color="error" startIcon={<RemoveCircle />}
              onClick={() => setConfirm({ open: true, type: 'reforme' })}>
              Réformer
            </Button>
          )}
        </Box>
      </Box>

      <Grid container spacing={3}>

        {/* ── Informations générales ── */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Informations générales</Typography>

              <InfoRow label="Catégorie"      value={materiel.categorie?.nom} />
              <InfoRow label="Sous-catégorie" value={materiel.sous_categorie?.nom} />
              <InfoRow label="Marque"         value={materiel.marque?.nom} />
              <InfoRow label="Modèle"         value={materiel.model} />

              {materiel.numero_serie && (
                <InfoRow
                  label="N° Série"
                  value={
                    <Typography variant="body2" fontWeight={500}
                      sx={{ fontFamily: 'monospace' }}>
                      {materiel.numero_serie}
                    </Typography>
                  }
                />
              )}

              {/* ✅ Dates formatées DD/MM/YYYY */}
              <InfoRow label="Date d'achat"    value={formatDate(materiel.date_achat)} />
              <InfoRow label="Fin de garantie" value={formatDate(materiel.garantie_fin)} />

              <InfoRow
                label="Prix"
                value={`${Number(materiel.prix_unitaire).toLocaleString('fr-MA')} DH`}
              />
              {materiel.observation && (
                <InfoRow label="Observation" value={materiel.observation} />
              )}
              {materiel.date_reforme && (
                <InfoRow label="Date réforme" value={formatDate(materiel.date_reforme)} />
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* ── Spécifications + Affectation active ── */}
        <Grid item xs={12} md={6}>
          {Object.keys(specs).length > 0 && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Spécifications</Typography>
                {Object.entries(specs).map(([key, val]) => (
                  <InfoRow
                    key={key}
                    label={key.replace(/_/g, ' ')}
                    value={String(val)}
                  />
                ))}
              </CardContent>
            </Card>
          )}

          {activeAff && (
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Affectation active</Typography>
                <InfoRow label="Service"
                  value={activeAff.service?.nom} />
                <InfoRow label="Utilisateur"
                  value={`${activeAff.user?.nom || ''} ${activeAff.user?.prenom || ''}`} />
                <InfoRow label="N° Inventaire"
                  value={activeAff.numero_inventaire || '—'} />
                {/* ✅ Date affectation formatée */}
                <InfoRow label="Date affectation"
                  value={formatDate(activeAff.date_affectation)} />
                <InfoRow label="Nature"
                  value={activeAff.nature || '—'} />

                {activeAff.bon_sortie_pdf_url && (
                  <Box sx={{
                    display: 'flex', py: 0.8,
                    borderBottom: '1px solid', borderColor: 'divider',
                    alignItems: 'center',
                  }}>
                    <Typography variant="body2" color="text.secondary"
                      sx={{ width: 160, flexShrink: 0 }}>
                      Bon de sortie PDF
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button size="small" variant="outlined" startIcon={<PictureAsPdf />}
                        onClick={() => handleOpenPdf(
                          activeAff.bon_sortie_pdf_url,
                          `Bon de sortie — ${activeAff.bon_sortie || ''}`
                        )}>
                        Voir PDF
                      </Button>
                      <Tooltip title="Ouvrir dans un nouvel onglet">
                        <IconButton size="small" color="primary"
                          component="a" href={activeAff.bon_sortie_pdf_url}
                          target="_blank" rel="noopener">
                          <OpenInNew fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* ── Historique affectations ── */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Historique des affectations
              </Typography>
              {materiel.affectations?.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Service</TableCell>
                        <TableCell>Utilisateur</TableCell>
                        <TableCell>Date affectation</TableCell>
                        <TableCell>Date retour</TableCell>
                        <TableCell>Statut</TableCell>
                        <TableCell>N° Inventaire</TableCell>
                        <TableCell>Bon de sortie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {materiel.affectations.map((aff) => (
                        <TableRow key={aff.id}>
                          <TableCell>{aff.service?.nom}</TableCell>
                          <TableCell>
                            {aff.user?.nom} {aff.user?.prenom}
                          </TableCell>
                          {/* ✅ Dates formatées dans le tableau */}
                          <TableCell>{formatDate(aff.date_affectation)}</TableCell>
                          <TableCell>{formatDate(aff.date_retour)}</TableCell>
                          <TableCell>
                            <Chip
                              label={aff.status} size="small"
                              color={aff.status === 'ACTIVE' ? 'success' : 'default'}
                            />
                          </TableCell>
                          <TableCell>{aff.numero_inventaire || '—'}</TableCell>
                          <TableCell>
                            {aff.bon_sortie_pdf_url ? (
                              <Tooltip title="Voir le PDF">
                                <IconButton size="small" color="error"
                                  onClick={() => handleOpenPdf(
                                    aff.bon_sortie_pdf_url,
                                    `Bon de sortie — ${aff.bon_sortie || ''}`
                                  )}>
                                  <PictureAsPdf fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              aff.bon_sortie || '—'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Typography color="text.secondary">Aucune affectation.</Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* ── PDF Viewer Dialog ── */}
      <Dialog
        open={pdfDialog.open}
        onClose={handleClosePdf}
        maxWidth="lg" fullWidth
        PaperProps={{ sx: { height: '90vh' } }}
      >
        <DialogTitle sx={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PictureAsPdf color="error" />
            <Typography variant="h6">{pdfDialog.title || 'Bon de sortie'}</Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Ouvrir dans un nouvel onglet">
              <IconButton component="a" href={pdfDialog.url}
                target="_blank" rel="noopener" color="primary">
                <OpenInNew />
              </IconButton>
            </Tooltip>
            <IconButton onClick={handleClosePdf}><Close /></IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {pdfDialog.url && (
            <iframe
              src={pdfDialog.url}
              title="Bon de sortie PDF"
              style={{ width: '100%', flex: 1, border: 'none', minHeight: '600px' }}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Confirm Dialogs ── */}
      <ConfirmDialog
        open={confirm.open && confirm.type === 'return'}
        title="Confirmer le retour"
        message="Le matériel sera remis en stock."
        confirmText="Retourner" color="warning"
        onConfirm={handleReturn}
        onCancel={() => setConfirm({ open: false, type: '' })}
      />
      <ConfirmDialog
        open={confirm.open && confirm.type === 'reforme'}
        title="Confirmer la réforme"
        message="Le matériel sera définitivement réformé."
        confirmText="Réformer" color="error"
        onConfirm={handleReforme}
        onCancel={() => setConfirm({ open: false, type: '' })}
      />
    </Box>
  );
}

// ── Composant ligne d'info ────────────────────────────────────────────────
function InfoRow({ label, value }) {
  return (
    <Box sx={{
      display: 'flex', py: 0.8,
      borderBottom: '1px solid', borderColor: 'divider',
    }}>
      <Typography variant="body2" color="text.secondary"
        sx={{ width: 160, flexShrink: 0, textTransform: 'capitalize' }}>
        {label}
      </Typography>
      {typeof value === 'string' || value === undefined || value === null ? (
        <Typography variant="body2" fontWeight={500}>{value || '—'}</Typography>
      ) : (
        value
      )}
    </Box>
  );
}