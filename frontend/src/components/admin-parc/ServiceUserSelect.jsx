import { useState, useEffect } from 'react';
import {
  FormControl, InputLabel, Select, MenuItem, Box, Button, Typography, CircularProgress, Alert,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import api from '../../api/client';
import QuickCreateUserModal from './QuickCreateUserModal';

export default function ServiceUserSelect({ services, value, onChange }) {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  const { service_id = '', user_id = '' } = value || {};

  useEffect(() => {
    if (!service_id) {
      setUsers([]);
      return;
    }
    setLoadingUsers(true);
    api.get(`/admin-parc/services/${service_id}/users`)
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]))
      .finally(() => setLoadingUsers(false));
  }, [service_id]);

  const handleServiceChange = (e) => {
    onChange({ service_id: e.target.value, user_id: '' });
  };

  const handleUserChange = (e) => {
    onChange({ ...value, user_id: e.target.value });
  };

  const handleQuickCreated = (newUser) => {
    setUsers((prev) => [...prev, newUser]);
    onChange({ ...value, user_id: newUser.id });
    setQuickCreateOpen(false);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <FormControl fullWidth>
        <InputLabel>Service</InputLabel>
        <Select value={service_id} label="Service" onChange={handleServiceChange}>
          <MenuItem value="">— Sélectionner —</MenuItem>
          {services.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.nom}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {service_id && (
        <Box>
          <FormControl fullWidth>
            <InputLabel>Utilisateur</InputLabel>
            <Select value={user_id} label="Utilisateur" onChange={handleUserChange} disabled={loadingUsers}>
              <MenuItem value="">— Sélectionner —</MenuItem>
              {users.map((u) => (
                <MenuItem key={u.id} value={u.id}>
                  {u.nom} {u.prenom} ({u.matricule})
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {loadingUsers && <CircularProgress size={20} sx={{ mt: 1 }} />}

          {!loadingUsers && users.length === 0 && service_id && (
            <Alert severity="info" sx={{ mt: 1 }}>
              Aucun utilisateur dans ce service.
            </Alert>
          )}

          <Button
            size="small" startIcon={<PersonAdd />}
            onClick={() => setQuickCreateOpen(true)}
            sx={{ mt: 1 }}
          >
            Ajouter utilisateur (rapide)
          </Button>
        </Box>
      )}

      <QuickCreateUserModal
        open={quickCreateOpen}
        serviceId={service_id}
        onClose={() => setQuickCreateOpen(false)}
        onCreated={handleQuickCreated}
      />
    </Box>
  );
}