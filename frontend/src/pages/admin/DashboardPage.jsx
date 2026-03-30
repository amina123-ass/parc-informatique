// src/pages/Admin/DashboardPage.jsx

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, MenuItem, Select,
  FormControl, InputLabel, Alert, Avatar, Divider, Skeleton,
  Stack,
} from '@mui/material';
import {
  People, HourglassBottom, Security, Business,
  CheckCircle, Refresh, PersonAdd, Info,
} from '@mui/icons-material';
import api from '../../api/client';

/* ─── KPI Config ─────────────────────────────────────────────── */
const KPI_CONFIG = [
  { key: 'users_total',              label: 'Utilisateurs', icon: People,          color: '#1565c0' },
  { key: 'users_pending_activation', label: 'En attente',   icon: HourglassBottom, color: '#e65100' },
  { key: 'roles_total',              label: 'Rôles',        icon: Security,        color: '#2e7d32' },
  { key: 'services_total',           label: 'Services',     icon: Business,        color: '#6a1b9a' },
];

/* ─── Avatar initiales ───────────────────────────────────────── */
function UserAvatar({ nom, prenom }) {
  const initials = `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
  return (
    <Avatar
      sx={{
        width: 34, height: 34,
        fontSize: 12, fontWeight: 700,
        bgcolor: '#1565c018', color: '#1565c0',
      }}
    >
      {initials}
    </Avatar>
  );
}

/* ─── Dialog Activation ──────────────────────────────────────── */
function ActivationDialog({ open, user, roles, services, onClose, onSuccess }) {
  const [roleId,    setRoleId]    = useState('');
  const [serviceId, setServiceId] = useState('');
  const [step,      setStep]      = useState('form'); // 'form' | 'loading' | 'success'
  const [error,     setError]     = useState('');

  useEffect(() => {
    if (user) {
      setRoleId(user.role_id ?? '');
      setServiceId(user.service_id ?? '');
      setStep('form');
      setError('');
    }
  }, [user]);

  const handleActivate = async () => {
    if (!roleId || !serviceId) {
      setError("Veuillez attribuer un rôle et un service avant d'activer.");
      return;
    }
    setStep('loading');
    setError('');
    try {
      // ✅ URLs corrigées selon routes/api.php
      if (String(roleId) !== String(user.role_id)) {
        await api.patch(`/admin/users/${user.id}/role`, { role_id: roleId });
      }
      if (String(serviceId) !== String(user.service_id)) {
        await api.patch(`/admin/users/${user.id}/service`, { service_id: serviceId });
      }
      await api.patch(`/admin/users/${user.id}/activation`, { account_active: true });

      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Erreur serveur. Réessayez.');
      setStep('form');
    }
  };

  if (!user) return null;

  return (
    <Dialog
      open={open}
      onClose={step === 'loading' ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}
    >
      {/* ── Titre ── */}
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PersonAdd color="primary" />
          <Box>
            <Typography fontWeight={700} fontSize={16}>
              Activer le compte
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {user.prenom} {user.nom} · {user.matricule ?? user.email}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      {/* ── Contenu ── */}
      <DialogContent sx={{ pt: 2.5 }}>

        {/* Chargement */}
        {step === 'loading' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CircularProgress size={44} />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Activation en cours…
            </Typography>
          </Box>
        )}

        {/* Succès */}
        {step === 'success' && (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 52, color: 'success.main' }} />
            <Typography fontWeight={700} mt={1.5} fontSize={15}>
              Compte activé avec succès !
            </Typography>
          </Box>
        )}

        {/* Formulaire */}
        {step === 'form' && (
          <Stack spacing={2.5}>

            {/* Erreur */}
            {error && (
              <Alert severity="error" sx={{ borderRadius: 2, fontSize: 13 }}>
                {error}
              </Alert>
            )}

            {/* Récap utilisateur */}
            <Paper
              variant="outlined"
              sx={{
                p: 1.5, borderRadius: 2,
                bgcolor: 'grey.50', borderColor: 'grey.200',
              }}
            >
              <Stack direction="row" alignItems="center" gap={1.5}>
                <UserAvatar nom={user.nom} prenom={user.prenom} />
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>
                    {user.prenom} {user.nom}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {user.email}
                  </Typography>
                </Box>
                <Chip
                  label={user.email_verified_at ? 'Email vérifié' : 'Non vérifié'}
                  size="small"
                  color={user.email_verified_at ? 'success' : 'warning'}
                  variant="outlined"
                  sx={{ flexShrink: 0 }}
                />
              </Stack>
            </Paper>

            {/* Select Rôle */}
            <FormControl fullWidth size="small" required>
              <InputLabel id="dlg-role-label">Rôle</InputLabel>
              <Select
                labelId="dlg-role-label"
                id="dlg-role-select"
                value={roleId}
                label="Rôle"
                onChange={(e) => setRoleId(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 240, borderRadius: 2, mt: 0.5 },
                  },
                }}
              >
                {roles.length === 0 ? (
                  <MenuItem disabled>Aucun rôle disponible</MenuItem>
                ) : (
                  roles.map((r) => (
                    <MenuItem key={r.id} value={r.id}>
                      {r.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Select Service */}
            <FormControl fullWidth size="small" required>
              <InputLabel id="dlg-service-label">Service</InputLabel>
              <Select
                labelId="dlg-service-label"
                id="dlg-service-select"
                value={serviceId}
                label="Service"
                onChange={(e) => setServiceId(e.target.value)}
                MenuProps={{
                  PaperProps: {
                    sx: { maxHeight: 240, borderRadius: 2, mt: 0.5 },
                  },
                }}
              >
                {services.length === 0 ? (
                  <MenuItem disabled>Aucun service disponible</MenuItem>
                ) : (
                  services.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      {s.name}
                    </MenuItem>
                  ))
                )}
              </Select>
            </FormControl>

            {/* Info */}
            <Alert
              severity="info"
              icon={<Info fontSize="small" />}
              sx={{ borderRadius: 2, py: 0.5 }}
            >
              <Typography variant="caption">
                Rôle et service <strong>obligatoires</strong> avant activation.
              </Typography>
            </Alert>

          </Stack>
        )}
      </DialogContent>

      {/* ── Actions ── */}
      {step === 'form' && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            color="inherit"
            sx={{ borderRadius: 2 }}
          >
            Annuler
          </Button>
          <Button
            onClick={handleActivate}
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={!roleId || !serviceId}
            sx={{ borderRadius: 2 }}
          >
            Activer le compte
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

/* ─── Section utilisateurs en attente ────────────────────────── */
function PendingUsersSection({ roles, services, onActivated }) {
  const [users,      setUsers]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [selected,   setSelected]   = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', {
        params: { pending: 1, per_page: 50 },
      });
      const raw = res.data;
      setUsers(Array.isArray(raw) ? raw : (raw?.data ?? []));
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const openDialog = (user) => {
    setSelected(user);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    fetchPending();
    onActivated(); // rafraîchit les KPI
  };

  return (
    <Box>
      {/* En-tête */}
      <Stack
        direction="row"
        alignItems="flex-start"
        justifyContent="space-between"
        mb={2.5}
      >
        <Box>
          <Typography variant="h6" fontWeight={700} fontSize={16}>
            Comptes en attente d'activation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Utilisateurs ayant vérifié leur email, non encore activés
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={fetchPending} size="small" sx={{ mt: 0.5 }}>
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {/* Skeletons chargement */}
      {loading && (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} variant="rounded" height={52} />
          ))}
        </Stack>
      )}

      {/* Vide */}
      {!loading && users.length === 0 && (
        <Paper
          variant="outlined"
          sx={{
            p: 4, textAlign: 'center',
            borderRadius: 2, borderStyle: 'dashed', borderColor: 'grey.300',
          }}
        >
          <CheckCircle sx={{ fontSize: 38, color: 'success.light', mb: 0.5 }} />
          <Typography variant="body2" color="text.secondary">
            Aucun compte en attente d'activation.
          </Typography>
        </Paper>
      )}

      {/* Tableau */}
      {!loading && users.length > 0 && (
        <TableContainer
          component={Paper}
          variant="outlined"
          sx={{ borderRadius: 2 }}
        >
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                {['Utilisateur', 'Matricule', 'Email', 'Rôle', 'Service', 'Email statut', 'Action'].map((h) => (
                  <TableCell
                    key={h}
                    sx={{ fontWeight: 700, fontSize: 12, py: 1.5, color: 'text.secondary' }}
                  >
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {users.map((user, idx) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{
                    '&:last-child td': { border: 0 },
                    bgcolor: idx % 2 === 0 ? 'white' : 'grey.50',
                  }}
                >
                  {/* Nom */}
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <UserAvatar nom={user.nom} prenom={user.prenom} />
                      <Typography variant="body2" fontWeight={600} fontSize={13}>
                        {user.prenom} {user.nom}
                      </Typography>
                    </Stack>
                  </TableCell>

                  {/* Matricule */}
                  <TableCell>
                    <Typography
                      variant="body2"
                      sx={{ fontFamily: 'monospace', color: 'text.secondary', fontSize: 12 }}
                    >
                      {user.matricule ?? '—'}
                    </Typography>
                  </TableCell>

                  {/* Email */}
                  <TableCell>
                    <Typography variant="body2" fontSize={13}>
                      {user.email}
                    </Typography>
                  </TableCell>

                  {/* Rôle */}
                  <TableCell>
                    {user.role ? (
                      <Chip
                        label={user.role.name}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Non attribué"
                        size="small"
                        variant="outlined"
                        sx={{ color: 'warning.dark', borderColor: 'warning.main' }}
                      />
                    )}
                  </TableCell>

                  {/* Service */}
                  <TableCell>
                    {user.service ? (
                      <Chip
                        label={user.service.name}
                        size="small"
                        color="secondary"
                        variant="outlined"
                      />
                    ) : (
                      <Chip
                        label="Non attribué"
                        size="small"
                        variant="outlined"
                        sx={{ color: 'warning.dark', borderColor: 'warning.main' }}
                      />
                    )}
                  </TableCell>

                  {/* Statut email */}
                  <TableCell>
                    <Chip
                      label={user.email_verified_at ? 'Vérifié' : 'Non vérifié'}
                      size="small"
                      color={user.email_verified_at ? 'success' : 'error'}
                    />
                  </TableCell>

                  {/* Action */}
                  <TableCell>
                    <Tooltip
                      title={
                        !user.email_verified_at
                          ? 'Email non vérifié — activation impossible'
                          : 'Attribuer rôle / service et activer'
                      }
                    >
                      <span>
                        <Button
                          size="small"
                          variant="contained"
                          startIcon={<CheckCircle sx={{ fontSize: '15px !important' }} />}
                          disabled={!user.email_verified_at}
                          onClick={() => openDialog(user)}
                          sx={{
                            fontSize: 12,
                            px: 1.5, py: 0.5,
                            borderRadius: 1.5,
                            textTransform: 'none',
                            boxShadow: 'none',
                            '&:hover': { boxShadow: 'none' },
                          }}
                        >
                          Activer
                        </Button>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Dialog */}
      <ActivationDialog
        open={dialogOpen}
        user={selected}
        roles={roles}
        services={services}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleSuccess}
      />
    </Box>
  );
}

/* ─── Dashboard Page ──────────────────────────────────────────── */
export default function DashboardPage() {
  const [kpi,      setKpi]      = useState(null);
  const [roles,    setRoles]    = useState([]);
  const [services, setServices] = useState([]);
  const [loading,  setLoading]  = useState(true);

  const fetchKpi = useCallback(async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setKpi(res.data);
    } catch { /* silencieux */ }
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/roles'),
      api.get('/admin/services'),
    ])
      .then(([kpiRes, rolesRes, servicesRes]) => {
        setKpi(kpiRes.data);
        const toArr = (d) => (Array.isArray(d) ? d : (d?.data ?? []));
        setRoles(toArr(rolesRes.data));
        setServices(toArr(servicesRes.data));
      })
      .finally(() => setLoading(false));
  }, []);

  /* ── Squelette initial ── */
  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={44} sx={{ mb: 3 }} />
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={90} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} sx={{ mb: 3 }}>
        Tableau de bord
      </Typography>

      {/* ── KPI Cards ── */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {KPI_CONFIG.map((item) => {
          const Icon     = item.icon;
          const value    = kpi?.[item.key] ?? 0;
          const isPulse  = item.key === 'users_pending_activation' && value > 0;

          return (
            <Grid item xs={12} sm={6} md={3} key={item.key}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: isPulse ? `${item.color}55` : 'divider',
                  transition: 'border-color 0.3s',
                }}
              >
                <CardContent
                  sx={{
                    display: 'flex', alignItems: 'center', gap: 2,
                    py: 2.5, '&:last-child': { pb: 2.5 },
                  }}
                >
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: 2, flexShrink: 0,
                      bgcolor: item.color + '18', color: item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>

                  <Box>
                    <Typography variant="h4" fontWeight={700} lineHeight={1.1}>
                      {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.label}
                    </Typography>
                  </Box>

                  {/* Point clignotant si en attente */}
                  {isPulse && (
                    <Box
                      sx={{
                        ml: 'auto',
                        width: 10, height: 10, borderRadius: '50%',
                        bgcolor: item.color,
                        animation: 'blink 1.6s ease-in-out infinite',
                        '@keyframes blink': {
                          '0%, 100%': { opacity: 1 },
                          '50%':      { opacity: 0.15 },
                        },
                      }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Section en attente ── */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
          <PendingUsersSection
            roles={roles}
            services={services}
            onActivated={fetchKpi}
          />
        </CardContent>
      </Card>
    </Box>
  );
}
