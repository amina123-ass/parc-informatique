// src/pages/Admin/DashboardPage.jsx

import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Card, CardContent, Grid, CircularProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Chip, IconButton, Tooltip, Dialog, DialogTitle,
  DialogContent, DialogActions, Button, MenuItem, Select,
  FormControl, InputLabel, Alert, Avatar, Divider, Skeleton,
  Stack, LinearProgress,
} from '@mui/material';
import {
  People, HourglassBottom, Security, Business,
  CheckCircle, Cancel, PersonAdd, Refresh, Info,
  AssignmentInd, MiscellaneousServices,
} from '@mui/icons-material';
import api from '../../api/client';

/* ─── KPI Config ─────────────────────────────────────────────── */
const KPI_CONFIG = [
  { key: 'users_total',              label: 'Utilisateurs',  icon: People,           color: '#1565c0' },
  { key: 'users_pending_activation', label: 'En attente',    icon: HourglassBottom,  color: '#e65100' },
  { key: 'roles_total',              label: 'Rôles',         icon: Security,         color: '#2e7d32' },
  { key: 'services_total',           label: 'Services',      icon: Business,         color: '#6a1b9a' },
];

/* ─── Initials Avatar ─────────────────────────────────────────── */
function UserAvatar({ nom, prenom }) {
  const initials = `${(prenom?.[0] ?? '').toUpperCase()}${(nom?.[0] ?? '').toUpperCase()}`;
  return (
    <Avatar sx={{ width: 34, height: 34, fontSize: 13, fontWeight: 700, bgcolor: '#1565c020', color: '#1565c0' }}>
      {initials}
    </Avatar>
  );
}

/* ─── Activation Dialog ───────────────────────────────────────── */
function ActivationDialog({ open, user, roles, services, onClose, onSuccess }) {
  const [roleId,     setRoleId]     = useState('');
  const [serviceId,  setServiceId]  = useState('');
  const [step,       setStep]       = useState('form'); // 'form' | 'loading' | 'success' | 'error'
  const [error,      setError]      = useState('');

  // Pré-remplir si déjà attribués
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
      setError('Veuillez attribuer un rôle et un service avant d\'activer.');
      return;
    }
    setStep('loading');
    setError('');
    try {
      // 1. Assigner rôle (si changé)
      if (roleId !== user.role_id) {
        await api.post(`/admin/users/${user.id}/assign-role`, { role_id: roleId });
      }
      // 2. Assigner service (si changé)
      if (serviceId !== user.service_id) {
        await api.post(`/admin/users/${user.id}/assign-service`, { service_id: serviceId });
      }
      // 3. Activer
      await api.patch(`/admin/users/${user.id}/activation`, { account_active: true });
      setStep('success');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1200);
    } catch (err) {
      setError(err?.response?.data?.message ?? 'Une erreur est survenue.');
      setStep('form');
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={step === 'loading' ? undefined : onClose} maxWidth="xs" fullWidth
      PaperProps={{ sx: { borderRadius: 3 } }}>

      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" alignItems="center" gap={1.5}>
          <PersonAdd color="primary" />
          <Box>
            <Typography fontWeight={700}>Activer le compte</Typography>
            <Typography variant="caption" color="text.secondary">
              {user.prenom} {user.nom} — {user.matricule}
            </Typography>
          </Box>
        </Stack>
      </DialogTitle>

      <Divider />

      <DialogContent sx={{ pt: 2.5 }}>
        {step === 'loading' && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CircularProgress size={40} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
              Activation en cours…
            </Typography>
          </Box>
        )}

        {step === 'success' && (
          <Box sx={{ py: 3, textAlign: 'center' }}>
            <CheckCircle sx={{ fontSize: 48, color: 'success.main' }} />
            <Typography fontWeight={600} sx={{ mt: 1 }}>Compte activé avec succès !</Typography>
          </Box>
        )}

        {step === 'form' && (
          <Stack spacing={2.5}>
            {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

            {/* Infos utilisateur */}
            <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2, bgcolor: 'grey.50' }}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <UserAvatar nom={user.nom} prenom={user.prenom} />
                <Box>
                  <Typography variant="body2" fontWeight={600}>{user.prenom} {user.nom}</Typography>
                  <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                </Box>
                <Box sx={{ ml: 'auto' }}>
                  <Chip
                    label={user.email_verified_at ? 'Email vérifié' : 'Email non vérifié'}
                    size="small"
                    color={user.email_verified_at ? 'success' : 'warning'}
                    variant="outlined"
                  />
                </Box>
              </Stack>
            </Paper>

            {/* Sélection Rôle */}
            <FormControl fullWidth size="small" required>
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <AssignmentInd sx={{ fontSize: 16 }} /> Rôle
                </Stack>
              </InputLabel>
              <Select
                value={roleId}
                onChange={(e) => setRoleId(e.target.value)}
                label="Rôle"
              >
                <MenuItem value="" disabled><em>Sélectionner un rôle</em></MenuItem>
                {roles.map((r) => (
                  <MenuItem key={r.id} value={r.id}>{r.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Sélection Service */}
            <FormControl fullWidth size="small" required>
              <InputLabel>
                <Stack direction="row" alignItems="center" gap={0.5}>
                  <MiscellaneousServices sx={{ fontSize: 16 }} /> Service
                </Stack>
              </InputLabel>
              <Select
                value={serviceId}
                onChange={(e) => setServiceId(e.target.value)}
                label="Service"
              >
                <MenuItem value="" disabled><em>Sélectionner un service</em></MenuItem>
                {services.map((s) => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <Alert severity="info" icon={<Info />} sx={{ borderRadius: 2, fontSize: 12 }}>
              Le rôle et le service sont <strong>obligatoires</strong> avant l'activation.
            </Alert>
          </Stack>
        )}
      </DialogContent>

      {step === 'form' && (
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 2 }}>
            Annuler
          </Button>
          <Button
            onClick={handleActivate}
            variant="contained"
            startIcon={<CheckCircle />}
            disabled={!roleId || !serviceId}
            sx={{ borderRadius: 2 }}
          >
            Activer
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

/* ─── Pending Users Table ─────────────────────────────────────── */
function PendingUsersSection({ roles, services, onActivated }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchPending = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { pending: true, per_page: 50 } });
      setUsers(res.data.data ?? res.data);
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
    onActivated();      // Rafraîchit aussi les KPI
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight={700}>
            Comptes en attente d'activation
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Utilisateurs ayant vérifié leur email mais non encore activés
          </Typography>
        </Box>
        <Tooltip title="Rafraîchir">
          <IconButton onClick={fetchPending} size="small">
            <Refresh fontSize="small" />
          </IconButton>
        </Tooltip>
      </Stack>

      {loading ? (
        <Stack spacing={1}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={52} />)}
        </Stack>
      ) : users.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', borderRadius: 3, borderStyle: 'dashed' }}>
          <CheckCircle sx={{ fontSize: 40, color: 'success.light', mb: 1 }} />
          <Typography color="text.secondary">Aucun compte en attente d'activation.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, overflow: 'hidden' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Utilisateur</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Matricule</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Rôle</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Service</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Statut email</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user, idx) => (
                <TableRow
                  key={user.id}
                  hover
                  sx={{ '&:last-child td': { border: 0 }, bgcolor: idx % 2 === 0 ? 'white' : 'grey.50' }}
                >
                  <TableCell>
                    <Stack direction="row" alignItems="center" gap={1}>
                      <UserAvatar nom={user.nom} prenom={user.prenom} />
                      <Typography variant="body2" fontWeight={600}>
                        {user.prenom} {user.nom}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>
                      {user.matricule ?? '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{user.email}</Typography>
                  </TableCell>
                  <TableCell>
                    {user.role
                      ? <Chip label={user.role.name} size="small" color="primary" variant="outlined" />
                      : <Chip label="Non attribué" size="small" color="warning" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    {user.service
                      ? <Chip label={user.service.name} size="small" color="secondary" variant="outlined" />
                      : <Chip label="Non attribué" size="small" color="warning" variant="outlined" />}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.email_verified_at ? 'Vérifié' : 'Non vérifié'}
                      size="small"
                      color={user.email_verified_at ? 'success' : 'error'}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip title="Attribuer rôle / service et activer">
                      <span>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openDialog(user)}
                          disabled={!user.email_verified_at}
                          sx={{
                            bgcolor: 'primary.main', color: 'white',
                            borderRadius: 1.5, px: 1.5,
                            '&:hover': { bgcolor: 'primary.dark' },
                            '&.Mui-disabled': { bgcolor: 'action.disabledBackground' },
                          }}
                        >
                          <CheckCircle sx={{ fontSize: 18, mr: 0.5 }} />
                          <Typography variant="caption" fontWeight={700}>Activer</Typography>
                        </IconButton>
                      </span>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
    const res = await api.get('/admin/dashboard');
    setKpi(res.data);
  }, []);

  useEffect(() => {
    Promise.all([
      api.get('/admin/dashboard'),
      api.get('/admin/roles'),
      api.get('/admin/services'),
    ]).then(([kpiRes, rolesRes, servicesRes]) => {
      setKpi(kpiRes.data);
      setRoles(rolesRes.data?.data ?? rolesRes.data);
      setServices(servicesRes.data?.data ?? servicesRes.data);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box>
        <Skeleton variant="text" width={220} height={45} sx={{ mb: 3 }} />
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
        {KPI_CONFIG.map((kpi_item) => {
          const Icon = kpi_item.icon;
          const value = kpi?.[kpi_item.key] ?? 0;
          const isPending = kpi_item.key === 'users_pending_activation';
          return (
            <Grid item xs={12} sm={6} md={3} key={kpi_item.key}>
              <Card
                variant="outlined"
                sx={{
                  borderRadius: 3,
                  borderColor: isPending && value > 0 ? '#e6510040' : 'divider',
                  boxShadow: isPending && value > 0 ? '0 0 0 2px #e6510020' : 'none',
                  transition: 'box-shadow 0.2s',
                }}
              >
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 2.5 }}>
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: 2,
                      bgcolor: kpi_item.color + '15', color: kpi_item.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700} lineHeight={1}>
                      {value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">{kpi_item.label}</Typography>
                  </Box>
                  {isPending && value > 0 && (
                    <Box sx={{ ml: 'auto' }}>
                      <Box
                        sx={{
                          width: 10, height: 10, borderRadius: '50%',
                          bgcolor: '#e65100',
                          animation: 'pulse 1.5s infinite',
                          '@keyframes pulse': {
                            '0%, 100%': { opacity: 1, transform: 'scale(1)' },
                            '50%': { opacity: 0.4, transform: 'scale(1.4)' },
                          },
                        }}
                      />
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* ── Pending Users ── */}
      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
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
