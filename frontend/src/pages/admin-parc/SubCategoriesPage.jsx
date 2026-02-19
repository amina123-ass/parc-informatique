import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Grid, Card, CardContent, CardActionArea, Chip,
  CircularProgress, Button, Breadcrumbs, Link,
} from '@mui/material';
import { ArrowBack, Inventory } from '@mui/icons-material';
import api from '../../api/client';

export default function SubCategoriesPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState({ category: null, sub_categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get(`/admin-parc/categories/${categoryId}/sub-categories`).then((res) => {
      setData(res.data);
      setLoading(false);
    });
  }, [categoryId]);

  if (loading) return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link
          underline="hover" color="inherit" sx={{ cursor: 'pointer' }}
          onClick={() => navigate('/admin-parc/categories')}
        >
          Catégories
        </Link>
        <Typography color="text.primary" fontWeight={600}>{data.category?.nom}</Typography>
      </Breadcrumbs>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">{data.category?.nom} — Sous-catégories</Typography>
        <Button variant="outlined" startIcon={<ArrowBack />} onClick={() => navigate('/admin-parc/categories')}>
          Retour
        </Button>
      </Box>

      <Grid container spacing={3}>
        {data.sub_categories.map((sub) => (
          <Grid item xs={12} sm={6} md={4} key={sub.id}>
            <Card sx={{ transition: 'transform 0.2s', '&:hover': { transform: 'translateY(-4px)' } }}>
              <CardActionArea onClick={() => navigate(`/admin-parc/sub-categories/${sub.id}/materiels`)}>
                <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
                  <Inventory sx={{ fontSize: 40, color: 'primary.main', opacity: 0.7 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="h6" fontWeight={600}>{sub.nom}</Typography>
                    <Chip
                      label={`${sub.materiels_count || 0} matériel(s)`}
                      size="small" color="primary" variant="outlined" sx={{ mt: 0.5 }}
                    />
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>

      {data.sub_categories.length === 0 && (
        <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
          Aucune sous-catégorie pour cette catégorie.
        </Typography>
      )}
    </Box>
  );
}