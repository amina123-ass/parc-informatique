// src/components/admin-parc/AttributeFieldsBuilder.jsx

import {
  Box, Button, IconButton, TextField, Select, MenuItem,
  FormControl, InputLabel, Typography, Paper, Tooltip,
  Chip, Divider, Switch, FormControlLabel,
} from '@mui/material';
import {
  Add, Delete, DragIndicator, TextFields, Numbers,
  List, CalendarMonth, ToggleOn, Api,
} from '@mui/icons-material';

// ✅ Dictionnaire complet — synchronisé avec VALID_FIELD_TYPES du backend
export const FIELD_TYPES = [
  {
    value: 'text',
    label: 'Texte',
    icon: <TextFields fontSize="small" />,
    description: 'Champ texte libre',
  },
  {
    value: 'number',
    label: 'Nombre',
    icon: <Numbers fontSize="small" />,
    description: 'Valeur numérique',
  },
  {
    value: 'date',
    label: 'Date',
    icon: <CalendarMonth fontSize="small" />,
    description: 'Sélecteur de date',
  },
  {
    value: 'select',
    label: 'Liste déroulante',
    icon: <List fontSize="small" />,
    description: 'Choix parmi une liste',
  },
  {
    value: 'boolean',
    label: 'Oui / Non',
    icon: <ToggleOn fontSize="small" />,
    description: 'Case à cocher',
  },
  {
    value: 'textarea',
    label: 'Texte long',
    icon: <TextFields fontSize="small" />,
    description: 'Zone de texte multiligne',
  },
  {
    value: 'api_select',
    label: 'Sélection API',
    icon: <Api fontSize="small" />,
    description: "Liste chargée depuis l'API",
  },
];

// Génère une clé snake_case depuis un libellé
const toKey = (label) =>
  label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');

export default function AttributeFieldsBuilder({ attributes = [], onChange }) {
  const handleAdd = () => {
    onChange([
      ...attributes,
      { key: '', label: '', type: 'text', required: false, options: [] },
    ]);
  };

  const handleRemove = (index) => {
    onChange(attributes.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const updated = attributes.map((attr, i) => {
      if (i !== index) return attr;
      const newAttr = { ...attr, [field]: value };
      if (field === 'label') newAttr.key = toKey(value);
      return newAttr;
    });
    onChange(updated);
  };

  const handleOptionAdd = (index) => {
    onChange(
      attributes.map((attr, i) =>
        i !== index ? attr : { ...attr, options: [...(attr.options || []), ''] }
      )
    );
  };

  const handleOptionChange = (attrIndex, optIndex, value) => {
    onChange(
      attributes.map((attr, i) => {
        if (i !== attrIndex) return attr;
        const newOptions = [...(attr.options || [])];
        newOptions[optIndex] = value;
        return { ...attr, options: newOptions };
      })
    );
  };

  const handleOptionRemove = (attrIndex, optIndex) => {
    onChange(
      attributes.map((attr, i) =>
        i !== attrIndex
          ? attr
          : { ...attr, options: (attr.options || []).filter((_, oi) => oi !== optIndex) }
      )
    );
  };

  const getTypeIcon = (typeValue) => {
    const found = FIELD_TYPES.find((t) => t.value === typeValue);
    return found?.icon || <TextFields fontSize="small" />;
  };

  return (
    <Box>
      {/* En-tête */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Box>
          <Typography variant="subtitle1" fontWeight={600}>
            Attributs de la sous-catégorie
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Définissez les champs spécifiques à saisir pour ce type de matériel
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<Add />} onClick={handleAdd} size="small">
          Ajouter un attribut
        </Button>
      </Box>

      {attributes.length === 0 && (
        <Paper
          variant="outlined"
          sx={{ p: 4, textAlign: 'center', borderStyle: 'dashed', bgcolor: 'action.hover' }}
        >
          <Typography color="text.secondary" variant="body2">
            Aucun attribut défini. Cliquez sur <strong>Ajouter un attribut</strong> pour commencer.
          </Typography>
          <Typography color="text.secondary" variant="caption">
            Exemples : RAM, Fréquence processeur, Date de mise en service, Capacité disque...
          </Typography>
        </Paper>
      )}

      {/* Liste des attributs */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {attributes.map((attr, index) => (
          <Paper key={index} variant="outlined" sx={{ p: 2, borderRadius: 2 }}>

            {/* Header ligne */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <DragIndicator fontSize="small" color="disabled" />
                <Chip
                  label={`Attribut ${index + 1}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  icon={getTypeIcon(attr.type)}
                />
              </Box>
              <Tooltip title="Supprimer cet attribut">
                <IconButton size="small" color="error" onClick={() => handleRemove(index)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>

            {/* Champs de configuration */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              {/* Libellé */}
              <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
                <TextField
                  fullWidth size="small" label="Libellé *"
                  value={attr.label}
                  onChange={(e) => handleChange(index, 'label', e.target.value)}
                  placeholder="Ex: Capacité RAM"
                  required
                />
              </Box>

              {/* Clé technique */}
              <Box sx={{ flex: '1 1 160px', minWidth: 140 }}>
                <TextField
                  fullWidth size="small" label="Clé (auto)"
                  value={attr.key}
                  onChange={(e) => handleChange(index, 'key', e.target.value)}
                  placeholder="capacite_ram"
                  helperText="Identifiant unique"
                  inputProps={{ style: { fontFamily: 'monospace', fontSize: 13 } }}
                />
              </Box>

              {/* Type de champ */}
              <Box sx={{ flex: '1 1 200px', minWidth: 180 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type de champ</InputLabel>
                  <Select
                    value={attr.type}
                    label="Type de champ"
                    onChange={(e) => handleChange(index, 'type', e.target.value)}
                  >
                    {FIELD_TYPES.map((t) => (
                      <MenuItem key={t.value} value={t.value}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {t.icon}
                          <Box>
                            <Typography variant="body2">{t.label}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {t.description}
                            </Typography>
                          </Box>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {/* data_key — uniquement pour api_select */}
              {attr.type === 'api_select' && (
                <Box sx={{ flex: '1 1 180px', minWidth: 160 }}>
                  <TextField
                    fullWidth size="small" label="data_key (API)"
                    value={attr.data_key || ''}
                    onChange={(e) => handleChange(index, 'data_key', e.target.value)}
                    placeholder="Ex: cartouches"
                    helperText="Endpoint ou clé de données"
                  />
                </Box>
              )}

              {/* Obligatoire */}
              <Box sx={{ flex: '0 1 140px', display: 'flex', alignItems: 'center' }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={attr.required || false}
                      onChange={(e) => handleChange(index, 'required', e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Obligatoire</Typography>}
                />
              </Box>
            </Box>

            {/* Section options — uniquement pour select */}
            {attr.type === 'select' && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary">
                      OPTIONS DE LA LISTE
                    </Typography>
                    <Button size="small" startIcon={<Add />} onClick={() => handleOptionAdd(index)}>
                      Ajouter option
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {(attr.options || []).map((opt, oi) => (
                      <Box key={oi} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <TextField
                          size="small"
                          value={opt}
                          onChange={(e) => handleOptionChange(index, oi, e.target.value)}
                          placeholder={`Option ${oi + 1}`}
                          sx={{ width: 140 }}
                        />
                        <IconButton size="small" color="error" onClick={() => handleOptionRemove(index, oi)}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                    {(attr.options || []).length === 0 && (
                      <Typography variant="caption" color="text.secondary" sx={{ py: 1 }}>
                        Aucune option. Ajoutez au moins une option.
                      </Typography>
                    )}
                  </Box>
                </Box>
              </>
            )}

            {/* Badges d'aperçu selon type */}
            {attr.type === 'date' && (
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  icon={<CalendarMonth fontSize="small" />}
                  label="Sélecteur de date (jj/mm/aaaa)"
                  size="small" color="info" variant="outlined"
                />
              </Box>
            )}
            {attr.type === 'api_select' && (
              <Box sx={{ mt: 1.5 }}>
                <Chip
                  icon={<Api fontSize="small" />}
                  label="Liste dynamique chargée depuis l'API"
                  size="small" color="warning" variant="outlined"
                />
              </Box>
            )}
          </Paper>
        ))}
      </Box>

      {attributes.length > 0 && (
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="outlined" startIcon={<Add />} onClick={handleAdd} size="small">
            Ajouter un attribut
          </Button>
        </Box>
      )}
    </Box>
  );
}


