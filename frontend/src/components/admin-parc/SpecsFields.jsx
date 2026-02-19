// src/components/admin-parc/SpecsFields.jsx

import { useState, useEffect, useCallback } from 'react';
import { 
  TextField, Typography, FormControl, InputLabel, Select, MenuItem, 
  Grid, CircularProgress, Box, Alert 
} from '@mui/material';
import api from '../../api/client';

export default function SpecsFields({ subCategoryId, specs, onChange, referenceData = {} }) {
  const [attributes, setAttributes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttributes = async () => {
      if (!subCategoryId) {
        setAttributes([]);
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching attributes for subCategoryId:', subCategoryId);
      setLoading(true);
      setError('');
      
      try {
        const res = await api.get(`/admin-parc/sous-categories/${subCategoryId}`);
        console.log('✅ API Response:', res.data);
        
        const attrs = res.data.attributes || [];
        console.log('📋 Attributes found:', attrs.length, attrs);
        
        setAttributes(attrs);
      } catch (err) {
        console.error('❌ Erreur chargement attributs:', err);
        setError(err.response?.data?.message || 'Erreur lors du chargement des attributs');
        setAttributes([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttributes();
  }, [subCategoryId]);

  // ✅ Utiliser useCallback pour éviter les re-créations
  const handleChange = useCallback((key, value) => {
    console.log('📝 Spec changed:', key, '=', value);
    onChange(prevSpecs => ({ ...prevSpecs, [key]: value }));
  }, [onChange]);

  // ✅ Mémoriser le rendu des champs
  const renderField = useCallback((field) => {
    // Select statique
    if (field.type === 'select') {
      return (
        <FormControl fullWidth required={field.required}>
          <InputLabel>{field.label}{field.required && ' *'}</InputLabel>
          <Select
            value={specs[field.key] || ''}
            label={`${field.label}${field.required ? ' *' : ''}`}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            <MenuItem value="">—</MenuItem>
            {field.options?.map((opt) => (
              <MenuItem key={opt} value={opt}>{opt}</MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Select dynamique (API)
    if (field.type === 'api_select') {
      const items = referenceData[field.data_key] || [];
      const valueField = field.value_field || 'id';
      const labelField = field.label_field || 'nom';

      return (
        <FormControl fullWidth required={field.required}>
          <InputLabel>{field.label}{field.required && ' *'}</InputLabel>
          <Select
            value={specs[field.key] || ''}
            label={`${field.label}${field.required ? ' *' : ''}`}
            onChange={(e) => handleChange(field.key, e.target.value)}
          >
            <MenuItem value="">— Sélectionner —</MenuItem>
            {items.map((item) => (
              <MenuItem key={item.id ?? item[valueField]} value={item[valueField]}>
                {item[labelField]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      );
    }

    // Nombre
    if (field.type === 'number') {
      return (
        <TextField
          fullWidth
          type="number"
          label={field.label}
          required={field.required}
          value={specs[field.key] || ''}
          onChange={(e) => handleChange(field.key, e.target.value)}
        />
      );
    }

    // Texte (défaut)
    return (
      <TextField
        fullWidth
        label={field.label}
        required={field.required}
        value={specs[field.key] || ''}
        onChange={(e) => handleChange(field.key, e.target.value)}
      />
    );
  }, [specs, referenceData, handleChange]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2}>
        <CircularProgress size={24} />
        <Typography sx={{ ml: 2 }}>Chargement des attributs...</Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (attributes.length === 0) {
    return (
      <Alert severity="info" sx={{ py: 2 }}>
        Aucun attribut spécifique défini pour cette sous-catégorie.
        <br />
        <Typography variant="caption">
          Vous pouvez en ajouter via "Gestion → Sous-catégories"
        </Typography>
      </Alert>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {attributes.map((field) => (
          <Grid item xs={12} sm={6} key={field.key}>
            {renderField(field)}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}