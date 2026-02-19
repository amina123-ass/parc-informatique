import { useState } from 'react';
import { useSearchParams, useLocation, Link as RouterLink } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Alert, CircularProgress, Link,
} from '@mui/material';
import { Computer } from '@mui/icons-material';
import api from '../../api/client';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const location = useLocation();
  const method = params.get('method') || 'email';
  const token = params.get('token') || '';
  const emailParam = params.get('email') || '';
  const questionsFromState = location.state?.questions || {};

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailReset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/reset/email', {
        token, password, password_confirmation: passwordConfirm,
      });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecurityReset = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const answersArray = Object.entries(answers).map(([id, answer]) => ({
      id: parseInt(id), answer,
    }));
    try {
      const res = await api.post('/auth/reset/security', {
        email: emailParam,
        answers: answersArray,
        password,
        password_confirmation: passwordConfirm,
      });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Computer sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5">Réinitialiser le mot de passe</Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {success && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>
              <Box sx={{ textAlign: 'center' }}>
                <Link component={RouterLink} to="/login">Retour à la connexion</Link>
              </Box>
            </Box>
          )}

          {!success && method === 'email' && (
            <form onSubmit={handleEmailReset}>
              <TextField fullWidth label="Nouveau mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Confirmer" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} margin="normal" required />
              <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, py: 1.3 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Réinitialiser'}
              </Button>
            </form>
          )}

          {!success && method === 'security' && (
            <form onSubmit={handleSecurityReset}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Répondez à vos questions de sécurité :
              </Typography>
              {Object.entries(questionsFromState).map(([id, question]) => (
                <TextField
                  key={id} fullWidth label={question} margin="dense" required
                  value={answers[id] || ''}
                  onChange={(e) => setAnswers({ ...answers, [id]: e.target.value })}
                />
              ))}
              <TextField fullWidth label="Nouveau mot de passe" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" required />
              <TextField fullWidth label="Confirmer" type="password" value={passwordConfirm} onChange={(e) => setPasswordConfirm(e.target.value)} margin="normal" required />
              <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, py: 1.3 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : 'Réinitialiser'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}