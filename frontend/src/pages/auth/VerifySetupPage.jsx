import { useState, useEffect } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
  Stepper, Step, StepLabel, Link, MenuItem, Select, FormControl, InputLabel,
  FormHelperText, Skeleton, Divider, Chip,
} from '@mui/material';
import { Computer, Lock, QuestionAnswer, CheckCircle } from '@mui/icons-material';
import api from '../../api/client';

const STEPS = ['Mot de passe', 'Questions de sécurité', 'Terminé'];
const EMPTY_QUESTION = { question_id: '', answer: '' };

export default function VerifySetupPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';

  const [activeStep, setActiveStep] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [availableQuestions, setAvailableQuestions] = useState([]);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [questions, setQuestions] = useState([
    { ...EMPTY_QUESTION },
    { ...EMPTY_QUESTION },
    { ...EMPTY_QUESTION },
  ]);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // ── Charger les questions disponibles ──
  useEffect(() => {
    api.get('/auth/security-questions')
      .then((res) => setAvailableQuestions(res.data.questions || []))
      .catch(() => setError('Impossible de charger les questions de sécurité.'))
      .finally(() => setLoadingQuestions(false));
  }, []);

  // ── Mettre à jour une question ──
  const handleQChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    // Réinitialise la réponse si on change la question
    if (field === 'question_id') updated[idx].answer = '';
    setQuestions(updated);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[`q_${idx}_${field}`];
      return next;
    });
  };

  // Options disponibles pour un select (exclut celles prises par les autres)
  const getAvailableOptions = (currentIdx) => {
    const takenIds = questions
      .map((q, i) => (i !== currentIdx ? q.question_id : null))
      .filter(Boolean);
    return availableQuestions.filter((q) => !takenIds.includes(q.id));
  };

  // ── Validation étape 0 ──
  const validatePassword = () => {
    const errors = {};
    if (password.length < 8)
      errors.password = 'Le mot de passe doit contenir au moins 8 caractères.';
    if (password !== passwordConfirm)
      errors.passwordConfirm = 'Les mots de passe ne correspondent pas.';
    return errors;
  };

  // ── Validation étape 1 ──
  const validateQuestions = () => {
    const errors = {};
    const seenIds = [];
    questions.forEach((q, i) => {
      if (!q.question_id) {
        errors[`q_${i}_question_id`] = 'Veuillez sélectionner une question.';
      } else if (seenIds.includes(q.question_id)) {
        errors[`q_${i}_question_id`] = 'Cette question est déjà utilisée.';
      } else {
        seenIds.push(q.question_id);
      }
      if (!q.answer.trim())
        errors[`q_${i}_answer`] = 'La réponse est obligatoire.';
      else if (q.answer.trim().length < 2)
        errors[`q_${i}_answer`] = 'La réponse est trop courte.';
    });
    return errors;
  };

  const nextStep = () => {
    setError('');
    const errors = validatePassword();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFieldErrors({});
    setActiveStep(1);
  };

  const handleSubmit = async () => {
    setError('');
    const errors = validateQuestions();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-setup', {
        token,
        password,
        password_confirmation: passwordConfirm,
        questions: questions.map((q) => ({ question_id: q.question_id, answer: q.answer })),
      });
      setSuccess(res.data.message);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Alert severity="error" sx={{ maxWidth: 460, width: '100%' }}>
          Token manquant. Vérifiez votre lien email.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 580, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>

          {/* ── Header ── */}
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Computer sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5" fontWeight={600}>Configuration du compte</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>Parc Informatique</Typography>
          </Box>

          {/* ── Stepper ── */}
          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {/* ── Alertes ── */}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {/* ════════════ ÉTAPE 0 : MOT DE PASSE ════════════ */}
          {activeStep === 0 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choisissez un mot de passe sécurisé pour votre compte.
              </Typography>
              <TextField
                fullWidth label="Mot de passe" type="password" value={password} margin="normal" required
                onChange={(e) => { setPassword(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.password; return n; }); }}
                error={!!fieldErrors.password}
                helperText={fieldErrors.password || 'Minimum 8 caractères'}
              />
              <TextField
                fullWidth label="Confirmer le mot de passe" type="password" value={passwordConfirm} margin="normal" required
                onChange={(e) => { setPasswordConfirm(e.target.value); setFieldErrors((p) => { const n = { ...p }; delete n.passwordConfirm; return n; }); }}
                error={!!fieldErrors.passwordConfirm}
                helperText={fieldErrors.passwordConfirm}
              />
              <Button fullWidth variant="contained" size="large" sx={{ mt: 3, py: 1.3 }} onClick={nextStep}>
                Suivant
              </Button>
            </Box>
          )}

          {/* ════════════ ÉTAPE 1 : QUESTIONS ════════════ */}
          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Choisissez <strong>3 questions différentes</strong> et mémorisez vos réponses.
                Elles serviront à récupérer votre mot de passe.
              </Typography>
              <Alert severity="info" variant="outlined" sx={{ mb: 2, py: 0.5, fontSize: 13 }}>
                Les réponses ne sont pas sensibles à la casse.
              </Alert>

              {loadingQuestions ? (
                [0, 1, 2].map((i) => (
                  <Box key={i} sx={{ mb: 2.5 }}>
                    <Skeleton variant="rounded" height={16} width={100} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={56} sx={{ mb: 1 }} />
                    <Skeleton variant="rounded" height={56} />
                  </Box>
                ))
              ) : (
                questions.map((q, i) => (
                  <Box key={i} sx={{ mb: 2.5 }}>
                    <Divider sx={{ mb: 1.5 }}>
                      <Chip label={`Question ${i + 1}`} size="small" color="primary" variant="outlined" />
                    </Divider>

                    {/* ── Select question ── */}
                    <FormControl
                      fullWidth margin="dense" required
                      error={!!fieldErrors[`q_${i}_question_id`]}
                    >
                      <InputLabel>Choisir une question de sécurité</InputLabel>
                      <Select
                        value={q.question_id}
                        label="Choisir une question de sécurité"
                        onChange={(e) => handleQChange(i, 'question_id', e.target.value)}
                        MenuProps={{ PaperProps: { sx: { maxHeight: 320 } } }}
                      >
                        <MenuItem value="" disabled>
                          <em>— Sélectionner une question —</em>
                        </MenuItem>

                        {getAvailableOptions(i).map((opt) => (
                          <MenuItem key={opt.id} value={opt.id}>
                            {opt.question}
                          </MenuItem>
                        ))}

                        {/* Affiche la question déjà sélectionnée même si filtrée */}
                        {q.question_id && !getAvailableOptions(i).find((o) => o.id === q.question_id) && (
                          <MenuItem value={q.question_id}>
                            {availableQuestions.find((o) => o.id === q.question_id)?.question}
                          </MenuItem>
                        )}
                      </Select>
                      {fieldErrors[`q_${i}_question_id`] && (
                        <FormHelperText>{fieldErrors[`q_${i}_question_id`]}</FormHelperText>
                      )}
                    </FormControl>

                    {/* ── Réponse ── */}
                    <TextField
                      fullWidth label="Votre réponse" value={q.answer} margin="dense" required
                      disabled={!q.question_id}
                      onChange={(e) => handleQChange(i, 'answer', e.target.value)}
                      error={!!fieldErrors[`q_${i}_answer`]}
                      helperText={
                        fieldErrors[`q_${i}_answer`] ||
                        (!q.question_id ? 'Sélectionnez d\'abord une question' : '')
                      }
                    />
                  </Box>
                ))
              )}

              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="outlined" sx={{ flex: 1 }} onClick={() => { setActiveStep(0); setFieldErrors({}); }}>
                  Retour
                </Button>
                <Button
                  variant="contained" sx={{ flex: 1, py: 1.3 }}
                  onClick={handleSubmit}
                  disabled={loading || loadingQuestions}
                >
                  {loading ? <CircularProgress size={24} /> : 'Valider'}
                </Button>
              </Box>
            </Box>
          )}

          {/* ════════════ ÉTAPE 2 : TERMINÉ ════════════ */}
          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
              <Typography variant="h6" sx={{ mb: 1 }}>Compte configuré avec succès !</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Un administrateur doit maintenant activer votre compte.
                Vous recevrez une notification par email.
              </Typography>
              <Link component={RouterLink} to="/login" variant="button">
                Retour à la connexion
              </Link>
            </Box>
          )}

        </CardContent>
      </Card>
    </Box>
  );
}
