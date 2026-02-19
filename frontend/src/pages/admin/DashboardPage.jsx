import { useState, useEffect } from 'react';
import { Box, Typography, Card, CardContent, Grid, CircularProgress } from '@mui/material';
import { People, HourglassBottom, Security, Business } from '@mui/icons-material';
import api from '../../api/client';

const KPI_CONFIG = [
  { key: 'users_total', label: 'Utilisateurs', icon: People, color: '#1565c0' },
  { key: 'users_pending_activation', label: 'En attente', icon: HourglassBottom, color: '#e65100' },
  { key: 'roles_total', label: 'Rôles', icon: Security, color: '#2e7d32' },
  { key: 'services_total', label: 'Services', icon: Business, color: '#6a1b9a' },
];

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard').then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Tableau de bord</Typography>

      <Grid container spacing={3}>
        {KPI_CONFIG.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Grid item xs={12} sm={6} md={3} key={kpi.key}>
              <Card>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box
                    sx={{
                      width: 52, height: 52, borderRadius: 2,
                      bgcolor: kpi.color + '15', color: kpi.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >
                    <Icon sx={{ fontSize: 28 }} />
                  </Box>
                  <Box>
                    <Typography variant="h4" fontWeight={700}>{data?.[kpi.key] ?? 0}</Typography>
                    <Typography variant="body2" color="text.secondary">{kpi.label}</Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}