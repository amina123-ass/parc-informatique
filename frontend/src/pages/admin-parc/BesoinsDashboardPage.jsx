import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CircularProgress, Button,
  Table, TableBody, TableCell, TableRow, TableHead, Chip,
} from '@mui/material';
import {
  ArrowBack, Inbox, HourglassEmpty, CheckCircle, Cancel,
  TrendingUp, List,
} from '@mui/icons-material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';
import api from '../../api/client';

// ── Couleurs ──
const COLORS = ['#2196F3', '#FF9800', '#4CAF50', '#F44336', '#9C27B0', '#00BCD4', '#795548', '#607D8B'];
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

export default function BesoinsDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-parc/besoins/dashboard')
      .then((res) => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
  if (!data) return <Typography>Erreur de chargement.</Typography>;

  const { compteurs, par_service, par_type, par_priorite, evolution, recents_attente } = data;

  return (
    <Box>
      {/* ── Header ── */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4">Dashboard Besoins</Typography>
        <Button variant="outlined" startIcon={<List />} onClick={() => navigate('/admin-parc/besoins')}>
          Voir la liste
        </Button>
      </Box>

      {/* ── Cartes statistiques ── */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<Inbox />} label="Total" value={compteurs.total}
            color="#2196F3" bgColor="#E3F2FD"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<HourglassEmpty />} label="En attente" value={compteurs.en_attente}
            color="#FF9800" bgColor="#FFF3E0"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<TrendingUp />} label="En cours" value={compteurs.en_cours}
            color="#03A9F4" bgColor="#E1F5FE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<CheckCircle />} label="Validés" value={compteurs.valides}
            color="#4CAF50" bgColor="#E8F5E9"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<Cancel />} label="Rejetés" value={compteurs.rejetes}
            color="#F44336" bgColor="#FFEBEE"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2}>
          <StatCard
            icon={<TrendingUp />} label="Satisfaction"
            value={`${compteurs.taux_satisfaction}%`}
            color="#9C27B0" bgColor="#F3E5F5"
          />
        </Grid>
      </Grid>

      {/* ── Graphiques ── */}
      <Grid container spacing={3}>
        {/* Bar Chart — Répartition par service */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Répartition par service</Typography>
              {par_service?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={par_service} margin={{ top: 5, right: 20, bottom: 60, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="service" angle={-30} textAnchor="end"
                      interval={0} height={80}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Bar dataKey="total" fill="#2196F3" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Aucune donnée disponible.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Pie Chart — Répartition par type */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Répartition par type</Typography>
              {par_type?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={par_type}
                      dataKey="total"
                      nameKey="type"
                      cx="50%" cy="50%"
                      outerRadius={100}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {par_type.map((_, idx) => (
                        <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Aucune donnée disponible.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Line Chart — Évolution mensuelle */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Évolution mensuelle (6 mois)</Typography>
              {evolution?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={evolution} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis allowDecimals={false} />
                    <RTooltip />
                    <Legend />
                    <Line type="monotone" dataKey="total" stroke="#2196F3" name="Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="valides" stroke="#4CAF50" name="Validés" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejetes" stroke="#F44336" name="Rejetés" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Aucune donnée disponible.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Répartition par priorité */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Par priorité</Typography>
              {par_priorite?.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={par_priorite}
                      dataKey="total"
                      nameKey="priorite"
                      cx="50%" cy="50%"
                      innerRadius={60} outerRadius={90}
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      <Cell fill="#4CAF50" />
                      <Cell fill="#FF9800" />
                      <Cell fill="#F44336" />
                    </Pie>
                    <Legend />
                    <RTooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                  Aucune donnée disponible.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Derniers besoins en attente */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Dernières demandes en attente</Typography>
              {recents_attente?.length > 0 ? (
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>N°</TableCell>
                      <TableCell>Demandeur</TableCell>
                      <TableCell>Service</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>Désignation</TableCell>
                      <TableCell>Priorité</TableCell>
                      <TableCell>Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recents_attente.map((b) => (
                      <TableRow
                        key={b.id}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => navigate('/admin-parc/besoins')}
                      >
                        <TableCell><Typography fontWeight={600}>#{b.id}</Typography></TableCell>
                        <TableCell>{b.utilisateur?.nom} {b.utilisateur?.prenom}</TableCell>
                        <TableCell>{b.service?.nom}</TableCell>
                        <TableCell><Chip label={b.type_besoin} size="small" variant="outlined" /></TableCell>
                        <TableCell>{b.designation}</TableCell>
                        <TableCell>
                          <Chip
                            label={PRIORITE_CONFIG[b.priorite]?.label}
                            color={PRIORITE_CONFIG[b.priorite]?.color}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{b.date_demande}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                  Aucune demande en attente.
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

// ── Composant StatCard ──
function StatCard({ icon, label, value, color, bgColor }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ textAlign: 'center', py: 2 }}>
        <Box
          sx={{
            width: 48, height: 48, borderRadius: '50%', bgcolor: bgColor,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 1, color,
          }}
        >
          {icon}
        </Box>
        <Typography variant="h4" fontWeight={700} color={color}>{value}</Typography>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </CardContent>
    </Card>
  );
}