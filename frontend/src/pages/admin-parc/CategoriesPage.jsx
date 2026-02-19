import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip, CircularProgress, Avatar,
} from '@mui/material';
import { Computer, Print, Router, Security } from '@mui/icons-material';
import api from '../../api/client';

const CATEGORY_ICONS = {
  'Informatique': <Computer />,
  'Impression':   <Print />,
  'Réseau':       <Router />,
  'Sécurité':     <Security />,
};

const CATEGORY_COLORS = {
  'Informatique': '#1565c0',
  'Impression':   '#e65100',
  'Réseau':       '#2e7d32',
  'Sécurité':     '#6a1b9a',
};

export default function CategoriesPage() {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin-parc/categories').then((res) => {
      setCategories(res.data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Catégories</Typography>

      <Grid container spacing={3}>
        {categories.map((cat) => {
          const color = CATEGORY_COLORS[cat.nom] || '#455a64';
          const icon = CATEGORY_ICONS[cat.nom] || <Computer />;
          const totalMateriels = cat.sous_categories?.reduce((sum, sc) => sum + (sc.materiels_count || 0), 0) || 0;

          return (
            <Grid item xs={12} sm={6} md={3} key={cat.id}>
              <Card sx={{ height: '100%', transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
                <CardActionArea onClick={() => navigate(`/admin-parc/categories/${cat.id}`)} sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center', py: 3 }}>
                    <Avatar sx={{ width: 56, height: 56, bgcolor: color + '20', color, mx: 'auto', mb: 2 }}>
                      {icon}
                    </Avatar>
                    <Typography variant="h6" fontWeight={600}>{cat.nom}</Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 1.5 }}>
                      <Chip label={`${cat.sous_categories_count || 0} sous-cat.`} size="small" variant="outlined" />
                      <Chip label={`${totalMateriels} matériels`} size="small" color="primary" variant="outlined" />
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}