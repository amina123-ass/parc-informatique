// src/components/admin-parc/AttributeFieldsBuilder.jsx

import { useState } from 'react';
import {
  Box, Typography, IconButton, Button, TextField, FormControl, InputLabel,
  Select, MenuItem, Paper, Chip, Grid, Alert,
} from '@mui/material';
import { Add, Delete, DragIndicator } from '@mui/icons-material';

const TYPE_OPTIONS = [
  { value: 'text', label: 'Texte libre' },
  { value: 'number', label: 'Nombre' },
  { value: 'select', label: 'Liste de choix' },
  { value: 'api_select', label: 'Liste dynamique (Cartouches, Systèmes...)' },
];

const API_DATA_SOURCES = [
  { value: 'cartouches', label: 'Cartouches', labelField: 'reference', valueField: 'id' },
  { value: 'systemesExploitation', label: 'Systèmes d\'exploitation', labelField: 'nom', valueField: 'nom' },
  { value: 'marques', label: 'Marques', labelField: 'nom', valueField: 'id' },
];

// Fonction pour générer automatiquement la clé technique
function generateKey(label) {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Enlever les accents
    .replace(/[^a-z0-9]+/g, '_')      // Remplacer les caractères spéciaux par _
    .replace(/^_|_$/g, '');           // Enlever les _ au début et à la fin
}

export default function AttributeFieldsBuilder({ attributes = [], onChange }) {
  const handleAddAttribute = () => {
    const newAttr = {
      key: '',
      label: '',
      type: 'text',
      options: [],
      data_key: '',
      label_field: '',
      value_field: '',
      required: false,
    };
    onChange([...attributes, newAttr]);
  };

  const handleRemoveAttribute = (index) => {
    const updated = attributes.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleChangeAttribute = (index, field, value) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-générer la clé technique depuis le libellé
    if (field === 'label') {
      updated[index].key = generateKey(value);
    }

    onChange(updated);
  };

  const handleChangeOptions = (index, optionsString) => {
    const options = optionsString
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    handleChangeAttribute(index, 'options', options);
  };

  const handleSelectDataSource = (index, dataKey) => {
    const source = API_DATA_SOURCES.find((s) => s.value === dataKey);
    if (source) {
      const updated = [...attributes];
      updated[index] = {
        ...updated[index],
        data_key: dataKey,
        label_field: source.labelField,
        value_field: source.valueField,
      };
      onChange(updated);
    } else {
      handleChangeAttribute(index, 'data_key', dataKey);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Attributs spécifiques</Typography>
        <Button variant="outlined" size="small" startIcon={<Add />} onClick={handleAddAttribute}>
          Ajouter un attribut
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Les attributs définissent les champs qui apparaîtront dans le formulaire de création de matériel.
        <br />
        <strong>Exemple :</strong> Pour un PC, vous pouvez ajouter "Processeur", "RAM", "Disque dur", etc.
      </Alert>

      {attributes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 3, textAlign: 'center', bgcolor: 'grey.50' }}>
          <Typography color="text.secondary">
            Aucun attribut défini. Cliquez sur "Ajouter un attribut" pour commencer.
          </Typography>
        </Paper>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {attributes.map((attr, index) => (
            <Paper key={index} variant="outlined" sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <DragIndicator color="action" />
                <Chip label={`#${index + 1}`} size="small" color="primary" />
                <Typography variant="subtitle2" sx={{ flex: 1 }}>
                  {attr.label || 'Nouvel attribut'}
                </Typography>
                <IconButton size="small" color="error" onClick={() => handleRemoveAttribute(index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>

              <Grid container spacing={2}>
                {/* LIBELLÉ (visible) */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    required
                    label="Nom du champ"
                    value={attr.label}
                    onChange={(e) => handleChangeAttribute(index, 'label', e.target.value)}
                    placeholder="Ex: Processeur, RAM, Résolution..."
                    helperText="Ce nom apparaîtra dans le formulaire"
                  />
                </Grid>

                {/* TYPE DE CHAMP */}
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Type de champ</InputLabel>
                    <Select
                      value={attr.type}
                      label="Type de champ"
                      onChange={(e) => handleChangeAttribute(index, 'type', e.target.value)}
                    >
                      {TYPE_OPTIONS.map((t) => (
                        <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* OPTIONS (si type = select) */}
                {attr.type === 'select' && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Options (séparées par des virgules)"
                      value={attr.options?.join(', ') || ''}
                      onChange={(e) => handleChangeOptions(index, e.target.value)}
                      placeholder="Ex: oui, non   OU   laser, jet d'encre, thermique"
                      helperText="Entrez les choix disponibles, séparés par des virgules"
                    />
                  </Grid>
                )}

                {/* SOURCE API (si type = api_select) */}
                {attr.type === 'api_select' && (
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Source de données</InputLabel>
                      <Select
                        value={attr.data_key}
                        label="Source de données"
                        onChange={(e) => handleSelectDataSource(index, e.target.value)}
                      >
                        <MenuItem value="">— Sélectionner —</MenuItem>
                        {API_DATA_SOURCES.map((s) => (
                          <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>
                )}

                {/* DEBUG: Afficher la clé générée (optionnel, peut être retiré) */}
                {attr.key && (
                  <Grid item xs={12}>
                    <Alert severity="success" icon={false}>
                      <Typography variant="caption" color="text.secondary">
                        Identifiant technique : <strong>{attr.key}</strong>
                      </Typography>
                    </Alert>
                  </Grid>
                )}
              </Grid>
            </Paper>
          ))}
        </Box>
      )}
    </Box>
  );
}