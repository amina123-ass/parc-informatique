// src/components/admin-parc/SpecsFields.jsx

import { useState, useEffect } from 'react';
import {
  Box, TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, CircularProgress, Typography,
  InputAdornment, Alert,
} from '@mui/material';
import { CalendarMonth, Api } from '@mui/icons-material';
import api from '../../api/client';

// Mapping data_key → endpoint API
const API_ENDPOINTS = {
  cartouches:              '/admin-parc/cartouches',
  systemes_exploitation:   '/admin-parc/systemes-exploitation',
  systemesExploitation:    '/admin-parc/systemes-exploitation',
  marques:                 '/admin-parc/marques',
  services:                '/admin-parc/services',
  entites:                 '/admin-parc/entites',
};

// Mapping data_key → champs label/value par défaut
const API_DEFAULTS = {
  cartouches:            { labelField: 'reference', valueField: 'id' },
  systemes_exploitation: { labelField: 'nom',       valueField: 'id' },
  systemesExploitation:  { labelField: 'nom',       valueField: 'id' },
  marques:               { labelField: 'nom',       valueField: 'id' },
  services:              { labelField: 'nom',       valueField: 'id' },
  entites:               { labelField: 'nom',       valueField: 'id' },
};

// ─── Composant pour un champ api_select ────────────────────────────────────
function ApiSelectField({ attr, value, onChange, referenceData }) {
  const [options, setOptions]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const dataKey    = attr.data_key    || '';
  const labelField = attr.label_field || API_DEFAULTS[dataKey]?.labelField || 'nom';
  const valueField = attr.value_field || API_DEFAULTS[dataKey]?.valueField || 'id';

  useEffect(() => {
    if (!dataKey) return;

    // 1. Utiliser les données déjà chargées dans referenceData si disponibles
    if (dataKey === 'cartouches' && referenceData?.cartouches?.length > 0) {
      setOptions(referenceData.cartouches);
      return;
    }
    if ((dataKey === 'systemes_exploitation' || dataKey === 'systemesExploitation')
        && referenceData?.systemesExploitation?.length > 0) {
      setOptions(referenceData.systemesExploitation);
      return;
    }
    if (dataKey === 'marques' && referenceData?.marques?.length > 0) {
      setOptions(referenceData.marques);
      return;
    }

    // 2. Sinon, appel API
    const endpoint = API_ENDPOINTS[dataKey];
    if (!endpoint) {
      setError(`Endpoint inconnu pour "${dataKey}"`);
      return;
    }

    setLoading(true);
    setError('');

    api.get(endpoint)
      .then((res) => setOptions(res.data || []))
      .catch(() => setError(`Impossible de charger les données (${dataKey})`))
      .finally(() => setLoading(false));
  }, [dataKey, referenceData]);

  if (!dataKey) {
    return (
      <Alert severity="warning" icon={<Api />}>
        Aucun <code>data_key</code> configuré pour cet attribut.
      </Alert>
    );
  }

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={1}>
        <CircularProgress size={18} />
        <Typography variant="body2" color="text.secondary">
          Chargement…
        </Typography>
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <FormControl fullWidth size="small" required={attr.required}>
      <InputLabel>
        {attr.label}{attr.required ? ' *' : ''}
      </InputLabel>
      <Select
        value={value ?? ''}
        label={attr.label + (attr.required ? ' *' : '')}
        onChange={(e) => onChange(e.target.value)}
        startAdornment={
          <InputAdornment position="start">
            <Api fontSize="small" color="action" />
          </InputAdornment>
        }
      >
        <MenuItem value="">— Sélectionner —</MenuItem>
        {options.map((opt) => (
          <MenuItem key={opt[valueField]} value={String(opt[valueField])}>
            {opt[labelField]}
            {/* Afficher un détail secondaire si disponible */}
            {opt.reference && labelField !== 'reference' && (
              <Typography
                component="span"
                variant="caption"
                color="text.secondary"
                sx={{ ml: 1 }}
              >
                ({opt.reference})
              </Typography>
            )}
          </MenuItem>
        ))}
        {options.length === 0 && (
          <MenuItem disabled>Aucune donnée disponible</MenuItem>
        )}
      </Select>
    </FormControl>
  );
}

// ─── Composant principal ────────────────────────────────────────────────────
export default function SpecsFields({
  subCategoryId,
  specs = {},
  onChange,
  referenceData = {},
}) {
  const [attributes, setAttributes]     = useState([]);
  const [loadingAttrs, setLoadingAttrs] = useState(false);

  useEffect(() => {
    if (!subCategoryId) return;

    setLoadingAttrs(true);
    api.get(`/admin-parc/sub-categories/${subCategoryId}`)
      .then((res) => setAttributes(res.data?.attributes || []))
      .catch(() => setAttributes([]))
      .finally(() => setLoadingAttrs(false));
  }, [subCategoryId]);

  const handleChange = (key, value) => {
    onChange({ ...specs, [key]: value });
  };

  // ── Rendu de chaque champ selon son type ──────────────────────────────────
  const renderField = (attr) => {
    const value = specs[attr.key] ?? '';

    switch (attr.type) {

      // ── Texte libre ────────────────────────────────────────────────────────
      case 'text':
        return (
          <TextField
            fullWidth size="small"
            label={attr.label + (attr.required ? ' *' : '')}
            value={value}
            onChange={(e) => handleChange(attr.key, e.target.value)}
            required={attr.required}
            placeholder={attr.unit ? `Ex: 8 ${attr.unit}` : ''}
            InputProps={
              attr.unit
                ? { endAdornment: <InputAdornment position="end">{attr.unit}</InputAdornment> }
                : undefined
            }
          />
        );

      // ── Nombre ─────────────────────────────────────────────────────────────
      case 'number':
        return (
          <TextField
            fullWidth size="small" type="number"
            label={attr.label + (attr.required ? ' *' : '')}
            value={value}
            onChange={(e) => handleChange(attr.key, e.target.value)}
            required={attr.required}
            inputProps={{ min: 0, step: 'any' }}
            InputProps={
              attr.unit
                ? { endAdornment: <InputAdornment position="end">{attr.unit}</InputAdornment> }
                : undefined
            }
          />
        );

      // ── Date ───────────────────────────────────────────────────────────────
      case 'date':
        return (
          <TextField
            fullWidth size="small" type="date"
            label={attr.label + (attr.required ? ' *' : '')}
            value={value}
            onChange={(e) => handleChange(attr.key, e.target.value)}
            required={attr.required}
            InputLabelProps={{ shrink: true }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CalendarMonth fontSize="small" color="action" />
                </InputAdornment>
              ),
            }}
          />
        );

      // ── Texte long ─────────────────────────────────────────────────────────
      case 'textarea':
        return (
          <TextField
            fullWidth size="small" multiline rows={3}
            label={attr.label + (attr.required ? ' *' : '')}
            value={value}
            onChange={(e) => handleChange(attr.key, e.target.value)}
            required={attr.required}
          />
        );

      // ── Liste statique ─────────────────────────────────────────────────────
      case 'select':
        return (
          <FormControl fullWidth size="small" required={attr.required}>
            <InputLabel>{attr.label + (attr.required ? ' *' : '')}</InputLabel>
            <Select
              value={value}
              label={attr.label + (attr.required ? ' *' : '')}
              onChange={(e) => handleChange(attr.key, e.target.value)}
            >
              <MenuItem value="">— Sélectionner —</MenuItem>
              {(attr.options || []).map((opt) => (
                <MenuItem key={opt} value={opt}>{opt}</MenuItem>
              ))}
            </Select>
          </FormControl>
        );

      // ── Oui / Non ──────────────────────────────────────────────────────────
      case 'boolean':
        return (
          <FormControlLabel
            control={
              <Switch
                checked={!!value}
                onChange={(e) => handleChange(attr.key, e.target.checked)}
                size="small"
              />
            }
            label={attr.label}
          />
        );

      // ── ✅ Sélection API (NOUVEAU) ─────────────────────────────────────────
      case 'api_select':
        return (
          <ApiSelectField
            attr={attr}
            value={value}
            onChange={(val) => handleChange(attr.key, val)}
            referenceData={referenceData}
          />
        );

      // ── Fallback ───────────────────────────────────────────────────────────
      default:
        return (
          <TextField
            fullWidth size="small"
            label={attr.label}
            value={value}
            onChange={(e) => handleChange(attr.key, e.target.value)}
          />
        );
    }
  };

  // ── États de chargement ───────────────────────────────────────────────────
  if (loadingAttrs) {
    return (
      <Box display="flex" alignItems="center" gap={1} py={2}>
        <CircularProgress size={20} />
        <Typography variant="body2" color="text.secondary">
          Chargement des attributs…
        </Typography>
      </Box>
    );
  }

  if (!attributes || attributes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
        Aucun attribut spécifique pour cette sous-catégorie.
      </Typography>
    );
  }

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
        gap: 2,
      }}
    >
      {attributes.map((attr) => (
        <Box key={attr.key}>
          {renderField(attr)}
        </Box>
      ))}
    </Box>
  );
}