// src/pages/admin-parc/MaterielCreatePage.jsx

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Card, CardContent, TextField, Button, Grid,
  FormControl, InputLabel, Select, MenuItem, FormControlLabel, Switch,
  CircularProgress, Alert, Breadcrumbs, Link, Chip,
} from '@mui/material';
import { Save, ArrowBack, UploadFile, PictureAsPdf, Close } from '@mui/icons-material';
import toast from 'react-hot-toast';
import api from '../../api/client';
import SpecsFields from '../../components/admin-parc/SpecsFields';
import ServiceUserSelect from '../../components/admin-parc/ServiceUserSelect';

export default function MaterielCreatePage() {
  const { subCategoryId, id: editId } = useParams();
  const navigate = useNavigate();
  const isEdit = !!editId;

  const [subCat, setSubCat] = useState(null);
  const [marques, setMarques] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [referenceData, setReferenceData] = useState({
    cartouches: [],
    systemesExploitation: [],
    marques: [],
  });

  const [form, setForm] = useState({
    model: '', 
    marque_id: '', 
    date_achat: '', 
    garantie_fin: '',
    observation: '', 
    prix_unitaire: '', 
    etat: 'EN_STOCK', 
    reseau: false,
  });
  
  const [specs, setSpecs] = useState({});
  const [withAffectation, setWithAffectation] = useState(false);
  const [affectation, setAffectation] = useState({
    service_id: '', 
    user_id: '', 
    numero_inventaire: '',
    annee_inventaire: new Date().getFullYear(), 
    bon_sortie: '', 
    nature: '', 
    date_affectation: '',
  });

  const [bonSortiePdf, setBonSortiePdf] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        const [marqueRes, serviceRes] = await Promise.all([
          api.get('/admin-parc/marques'),
          api.get('/admin-parc/services'),
        ]);
        setMarques(marqueRes.data || []);
        setServices(serviceRes.data || []);

        const refData = { 
          cartouches: [], 
          systemesExploitation: [],
          marques: marqueRes.data || [],
        };
        
        try {
          const cartoucheRes = await api.get('/admin-parc/cartouches');
          refData.cartouches = cartoucheRes.data || [];
        } catch (e) { 
          console.warn('Cartouches non chargées:', e); 
        }
        
        try {
          const osRes = await api.get('/admin-parc/systemes-exploitation');
          refData.systemesExploitation = osRes.data || [];
        } catch (e) { 
          console.warn('Systèmes exploitation non chargés:', e); 
        }
        
        setReferenceData(refData);

        if (subCategoryId) {
          const subRes = await api.get(`/admin-parc/sub-categories/${subCategoryId}`);
          setSubCat(subRes.data);
        }

        if (editId) {
          const matRes = await api.get(`/admin-parc/materiels/${editId}`);
          const mat = matRes.data;
          
          setForm({
            model: mat.model || '',
            marque_id: mat.marque_id || '',
            date_achat: mat.date_achat?.split('T')[0] || '',
            garantie_fin: mat.garantie_fin?.split('T')[0] || '',
            observation: mat.observation || '',
            prix_unitaire: mat.prix_unitaire || '',
            etat: mat.etat || 'EN_STOCK',
            reseau: mat.reseau || false,
          });
          
          setSpecs(mat.specs || {});
          
          if (!subCategoryId && mat.sous_categorie) {
            setSubCat(mat.sous_categorie);
          }
        }
      } catch (err) {
        console.error('Init error:', err);
        setError('Erreur lors du chargement des données.');
      }
      setLoading(false);
    };
    init();
  }, [subCategoryId, editId]);

  const handleFormChange = (field, value) => {
    setForm((f) => ({ ...f, [field]: value }));
  };

  const handleAffChange = (field, value) => {
    if (typeof field === 'object') {
      setAffectation((a) => ({ ...a, ...field }));
    } else {
      setAffectation((a) => ({ ...a, [field]: value }));
    }
  };

  const handlePdfChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast.error('Veuillez sélectionner un fichier PDF.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Le fichier ne doit pas dépasser 5 Mo.');
        return;
      }
      setBonSortiePdf(file);
    }
  };

  const handleRemovePdf = () => {
    setBonSortiePdf(null);
  };

  // ✅ Callback pour éviter les re-rendus
  const handleSpecsChange = useCallback((newSpecs) => {
    setSpecs(newSpecs);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      if (isEdit) {
        // Mode édition (JSON)
        const payload = {
          ...form,
          category_id: subCat?.category_id || subCat?.categorie?.id,
          sous_category_id: subCat?.id || parseInt(subCategoryId),
          marque_id: form.marque_id || null,
          specs: Object.keys(specs).length > 0 ? specs : {},
        };

        console.log('📤 Updating material:', payload);
        await api.patch(`/admin-parc/materiels/${editId}`, payload);
        toast.success('Matériel mis à jour.');
      } else {
        // Mode création (FormData)
        const formData = new FormData();

        // Données de base
        formData.append('model', form.model);
        if (form.marque_id) formData.append('marque_id', form.marque_id);
        formData.append('date_achat', form.date_achat);
        if (form.garantie_fin) formData.append('garantie_fin', form.garantie_fin);
        if (form.observation) formData.append('observation', form.observation);
        formData.append('prix_unitaire', form.prix_unitaire);
        formData.append('etat', form.etat);
        formData.append('reseau', form.reseau ? '1' : '0');
        formData.append('category_id', subCat?.category_id || subCat?.categorie?.id || '');
        formData.append('sous_category_id', subCat?.id || subCategoryId || '');

        // ✅ Envoyer les specs comme JSON string
        if (Object.keys(specs).length > 0) {
          const cleanedSpecs = Object.fromEntries(
            Object.entries(specs).filter(([_, value]) => value !== null && value !== '')
          );
          
          if (Object.keys(cleanedSpecs).length > 0) {
            formData.append('specs', JSON.stringify(cleanedSpecs));
          }
        }

        // Affectation
        if (withAffectation) {
          if (affectation.service_id) formData.append('affectation[service_id]', affectation.service_id);
          if (affectation.user_id) formData.append('affectation[user_id]', affectation.user_id);
          if (affectation.numero_inventaire) formData.append('affectation[numero_inventaire]', affectation.numero_inventaire);
          if (affectation.annee_inventaire) formData.append('affectation[annee_inventaire]', affectation.annee_inventaire);
          if (affectation.bon_sortie) formData.append('affectation[bon_sortie]', affectation.bon_sortie);
          if (affectation.nature) formData.append('affectation[nature]', affectation.nature);
          if (affectation.date_affectation) formData.append('affectation[date_affectation]', affectation.date_affectation);

          if (bonSortiePdf) {
            formData.append('bon_sortie_pdf', bonSortiePdf);
          }
        }

        // Debug
        console.log('📤 FormData entries:');
        for (let [key, value] of formData.entries()) {
          console.log(`  ${key}:`, value);
        }

        await api.post('/admin-parc/materiels', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Matériel créé avec succès.');
      }

      const scId = subCategoryId || subCat?.id;
      navigate(`/admin-parc/sub-categories/${scId}/materiels`);
    } catch (err) {
      console.error('❌ Submit error:', err);
      console.error('Response:', err.response?.data);
      
      if (err.response?.data?.errors) {
        const errors = err.response.data.errors;
        Object.entries(errors).forEach(([field, messages]) => {
          console.error(`  ${field}:`, messages);
        });
      }
      
      setError(err.response?.data?.message || 'Erreur lors de l\'enregistrement.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link 
          underline="hover" 
          color="inherit" 
          sx={{ cursor: 'pointer' }} 
          onClick={() => navigate('/admin-parc/categories')}
        >
          Catégories
        </Link>
        {subCat?.categorie && (
          <Link 
            underline="hover" 
            color="inherit" 
            sx={{ cursor: 'pointer' }} 
            onClick={() => navigate(`/admin-parc/categories/${subCat.categorie.id || subCat.category_id}`)}
          >
            {subCat.categorie?.nom}
          </Link>
        )}
        <Link 
          underline="hover" 
          color="inherit" 
          sx={{ cursor: 'pointer' }} 
          onClick={() => navigate(`/admin-parc/sub-categories/${subCat?.id || subCategoryId}/materiels`)}
        >
          {subCat?.nom}
        </Link>
        <Typography color="text.primary" fontWeight={600}>
          {isEdit ? 'Modifier' : 'Nouveau'}
        </Typography>
      </Breadcrumbs>

      <Typography variant="h4" sx={{ mb: 3 }}>
        {isEdit ? 'Modifier le matériel' : `Nouveau ${subCat?.nom || 'matériel'}`}
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <form onSubmit={handleSubmit}>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Informations générales
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField 
                  fullWidth 
                  label="Modèle *" 
                  value={form.model} 
                  onChange={(e) => handleFormChange('model', e.target.value)} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Marque</InputLabel>
                  <Select 
                    value={form.marque_id} 
                    label="Marque" 
                    onChange={(e) => handleFormChange('marque_id', e.target.value)}
                  >
                    <MenuItem value="">— Aucune —</MenuItem>
                    {marques.map((m) => (
                      <MenuItem key={m.id} value={m.id}>{m.nom}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Date d'achat *" 
                  type="date" 
                  InputLabelProps={{ shrink: true }}
                  value={form.date_achat} 
                  onChange={(e) => handleFormChange('date_achat', e.target.value)} 
                  required 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Fin de garantie" 
                  type="date" 
                  InputLabelProps={{ shrink: true }}
                  value={form.garantie_fin} 
                  onChange={(e) => handleFormChange('garantie_fin', e.target.value)} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField 
                  fullWidth 
                  label="Prix unitaire (DH) *" 
                  type="number" 
                  value={form.prix_unitaire} 
                  onChange={(e) => handleFormChange('prix_unitaire', e.target.value)} 
                  required 
                  inputProps={{ min: 0, step: 0.01 }} 
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>État</InputLabel>
                  <Select 
                    value={form.etat} 
                    label="État" 
                    onChange={(e) => handleFormChange('etat', e.target.value)}
                  >
                    <MenuItem value="EN_STOCK">En stock</MenuItem>
                    <MenuItem value="AFFECTE">Affecté</MenuItem>
                    <MenuItem value="PANNE">En panne</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={form.reseau} 
                      onChange={(e) => handleFormChange('reseau', e.target.checked)} 
                    />
                  }
                  label="Connecté réseau"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  fullWidth 
                  label="Observation" 
                  multiline 
                  rows={2} 
                  value={form.observation} 
                  onChange={(e) => handleFormChange('observation', e.target.value)} 
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Spécifications — {subCat?.nom}
            </Typography>
            <SpecsFields
              subCategoryId={subCat?.id || subCategoryId}
              specs={specs}
              onChange={handleSpecsChange}
              referenceData={referenceData}
            />
          </CardContent>
        </Card>

        {!isEdit && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 2 
              }}>
                <Typography variant="h6">Affectation</Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={withAffectation} 
                      onChange={(e) => setWithAffectation(e.target.checked)} 
                    />
                  }
                  label="Affecter maintenant"
                />
              </Box>

              {withAffectation && (
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <ServiceUserSelect
                      services={services}
                      value={{ 
                        service_id: affectation.service_id, 
                        user_id: affectation.user_id 
                      }}
                      onChange={(val) => handleAffChange(val)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth 
                      label="N° Inventaire" 
                      value={affectation.numero_inventaire} 
                      onChange={(e) => handleAffChange('numero_inventaire', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth 
                      label="Année inventaire" 
                      type="number" 
                      value={affectation.annee_inventaire} 
                      onChange={(e) => handleAffChange('annee_inventaire', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <TextField 
                      fullWidth 
                      label="Réf. Bon de sortie" 
                      value={affectation.bon_sortie} 
                      onChange={(e) => handleAffChange('bon_sortie', e.target.value)} 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Nature" 
                      value={affectation.nature} 
                      onChange={(e) => handleAffChange('nature', e.target.value)} 
                      placeholder="Ex: Affectation initiale" 
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField 
                      fullWidth 
                      label="Date d'affectation *" 
                      type="date" 
                      InputLabelProps={{ shrink: true }}
                      value={affectation.date_affectation} 
                      onChange={(e) => handleAffChange('date_affectation', e.target.value)} 
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Bon de sortie (PDF)
                    </Typography>

                    {!bonSortiePdf ? (
                      <Button
                        variant="outlined"
                        component="label"
                        startIcon={<UploadFile />}
                        sx={{ borderStyle: 'dashed' }}
                      >
                        Joindre un PDF
                        <input
                          type="file"
                          accept="application/pdf"
                          hidden
                          onChange={handlePdfChange}
                        />
                      </Button>
                    ) : (
                      <Chip
                        icon={<PictureAsPdf />}
                        label={bonSortiePdf.name}
                        onDelete={handleRemovePdf}
                        deleteIcon={<Close />}
                        color="primary"
                        variant="outlined"
                        sx={{ maxWidth: 350 }}
                      />
                    )}

                    <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                      Format PDF uniquement, max 5 Mo
                    </Typography>
                  </Grid>
                </Grid>
              )}
            </CardContent>
          </Card>
        )}

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="outlined" 
            startIcon={<ArrowBack />} 
            onClick={() => navigate(-1)}
          >
            Annuler
          </Button>
          <Button 
            variant="contained" 
            type="submit" 
            startIcon={<Save />} 
            disabled={saving}
          >
            {saving ? <CircularProgress size={22} /> : (isEdit ? 'Mettre à jour' : 'Enregistrer')}
          </Button>
        </Box>
      </form>
    </Box>
  );
}