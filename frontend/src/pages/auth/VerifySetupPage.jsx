import { useState } from 'react';
import { useSearchParams, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress,
  Stepper, Step, StepLabel, Link,
} from '@mui/material';
import { Computer } from '@mui/icons-material';
import api from '../../api/client';

const STEPS = ['Mot de passe', 'Questions de sécurité', 'Terminé'];

export default function VerifySetupPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [activeStep, setActiveStep] = useState(0);
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [questions, setQuestions] = useState([
    { question: '', answer: '' },
    { question: '', answer: '' },
    { question: '', answer: '' },
  ]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQChange = (idx, field, value) => {
    const updated = [...questions];
    updated[idx][field] = value;
    setQuestions(updated);
  };

  const nextStep = () => {
    if (activeStep === 0) {
      if (password.length < 8) { setError('Le mot de passe doit contenir au moins 8 caractères.'); return; }
      if (password !== passwordConfirm) { setError('Les mots de passe ne correspondent pas.'); return; }
      setError('');
      setActiveStep(1);
    }
  };

  const handleSubmit = async () => {
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/verify-setup', {
        token,
        password,
        password_confirmation: passwordConfirm,
        questions,
      });
      setSuccess(res.data.message);
      setActiveStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
        <Alert severity="error">Token manquant. Vérifiez votre lien email.</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 560, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Computer sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5">Configuration du compte</Typography>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
            {STEPS.map((label) => (
              <Step key={label}><StepLabel>{label}</StepLabel></Step>
            ))}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

          {activeStep === 0 && (
            <Box>
              <TextField fullWidth label="Mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Confirmer le mot de passe" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} margin="normal" required />
              <Button fullWidth variant="contained" sx={{ mt: 2, py: 1.3 }} onClick={nextStep}>Suivant</Button>
            </Box>
          )}

          {activeStep === 1 && (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Choisissez 3 questions de sécurité pour la récupération de votre mot de passe.
              </Typography>
              {questions.map((q, i) => (
                <Box key={i} sx={{ mb: 2 }}>
                  <TextField
                    fullWidth label={`Question ${i + 1}`} value={q.question}
                    onChange={(e) => handleQChange(i, 'question', e.target.value)}
                    margin="dense" required
                    placeholder="Ex: Nom de votre premier animal ?"
                  />
                  <TextField
                    fullWidth label={`Réponse ${i + 1}`} value={q.answer}
                    onChange={(e) => handleQChange(i, 'answer', e.target.value)}
                    margin="dense" required
                  />
                </Box>
              ))}
              <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                <Button variant="outlined" onClick={() => setActiveStep(0)} sx={{ flex: 1 }}>Retour</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={loading} sx={{ flex: 1, py: 1.3 }}>
                  {loading ? <CircularProgress size={24} /> : 'Valider'}
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 2 && (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                Votre compte a été configuré avec succès. Un administrateur doit maintenant activer votre compte.
              </Typography>
              <Link component={RouterLink} to="/login">Retour à la connexion</Link>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}