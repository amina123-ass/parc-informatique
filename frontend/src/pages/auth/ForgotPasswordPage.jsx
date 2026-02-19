import { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box, Card, CardContent, TextField, Button, Typography, Link, Alert,
  ToggleButtonGroup, ToggleButton, CircularProgress,
} from '@mui/material';
import { Email, QuestionAnswer, Computer } from '@mui/icons-material';
import api from '../../api/client';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [method, setMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError(''); setMessage(''); setLoading(true);
    try {
      const res = await api.post('/auth/forgot/email', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  const handleSecuritySubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await api.post('/auth/forgot/security', { email });
      setQuestions(res.data.questions);
      // Navigate to reset page with questions
      navigate('/reset?method=security&email=' + encodeURIComponent(email), {
        state: { questions: res.data.questions },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.default', p: 2 }}>
      <Card sx={{ maxWidth: 460, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 3 }}>
            <Box sx={{ width: 56, height: 56, borderRadius: 3, bgcolor: 'primary.main', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
              <Computer sx={{ color: 'white', fontSize: 30 }} />
            </Box>
            <Typography variant="h5">Mot de passe oublié</Typography>
          </Box>

          <ToggleButtonGroup
            value={method} exclusive fullWidth sx={{ mb: 3 }}
            onChange={(_, v) => { if (v) { setMethod(v); setError(''); setMessage(''); } }}
          >
            <ToggleButton value="email"><Email sx={{ mr: 1 }} /> Par email</ToggleButton>
            <ToggleButton value="security"><QuestionAnswer sx={{ mr: 1 }} /> Questions</ToggleButton>
          </ToggleButtonGroup>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}

          <form onSubmit={method === 'email' ? handleEmailSubmit : handleSecuritySubmit}>
            <TextField
              fullWidth label="Email" type="email" value={email}
              onChange={(e) => setEmail(e.target.value)} required margin="normal"
            />
            <Button fullWidth type="submit" variant="contained" size="large" sx={{ mt: 2, py: 1.3 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : method === 'email' ? 'Envoyer le lien' : 'Récupérer les questions'}
            </Button>
          </form>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link component={RouterLink} to="/login" variant="body2">Retour à la connexion</Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}