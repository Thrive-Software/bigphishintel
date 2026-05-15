import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';

const MIN_PASSWORD_LENGTH = 6;

const ResetPasswordDialog = ({ open, username, onClose, onSubmit }) => {
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) { setPw(''); setConfirm(''); setError(''); }
  }, [open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (pw.length < MIN_PASSWORD_LENGTH) {
      setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (pw !== confirm) {
      setError('Passwords do not match.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await onSubmit(pw);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Reset failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>Reset password</DialogTitle>
        <DialogContent dividers>
          {username && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Setting a new password for <strong>{username}</strong>. They will need to use this password on next login.
            </Typography>
          )}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <TextField
            autoFocus margin="normal" fullWidth type="password"
            label="New password" value={pw} onChange={(e) => setPw(e.target.value)}
            helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
            autoComplete="new-password"
          />
          <TextField
            margin="normal" fullWidth type="password"
            label="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : 'Reset password'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default ResetPasswordDialog;
