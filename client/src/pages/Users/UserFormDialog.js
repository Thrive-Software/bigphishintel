import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
  Box,
} from '@mui/material';

const MIN_PASSWORD_LENGTH = 6;

const blank = {
  firstName: '',
  lastName: '',
  username: '',
  email: '',
  password: '',
  role: 'user',
  accountLocked: false,
};

const UserFormDialog = ({ open, onClose, onSubmit, user }) => {
  const isEdit = !!user;
  const isRoot = !!user?.isRoot;
  const [form, setForm] = useState(blank);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    if (user) {
      setForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        email: user.email || '',
        password: '',
        role: user.role || 'user',
        accountLocked: !!user.accountLocked,
      });
    } else {
      setForm(blank);
    }
    setError('');
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required.';
    if (!isEdit && !form.username.trim()) return 'Username is required.';
    if (!isEdit && form.password.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
    }
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const v = validate();
    if (v) { setError(v); return; }
    setError('');
    setSubmitting(true);
    try {
      const payload = isEdit
        ? {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            role: form.role,
            accountLocked: form.accountLocked,
          }
        : {
            firstName: form.firstName,
            lastName: form.lastName,
            username: form.username,
            email: form.email,
            password: form.password,
            role: form.role,
            accountLocked: form.accountLocked,
          };
      await onSubmit(payload);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Save failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={handleSubmit}>
        <DialogTitle>{isEdit ? `Edit ${user?.username}` : 'Create User'}</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {isRoot && (
            <Alert severity="info" sx={{ mb: 2 }}>
              This is the root administrator. Role and lock status cannot be changed.
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required label="First name" name="firstName"
                value={form.firstName} onChange={handleChange} autoComplete="given-name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Last name" name="lastName"
                value={form.lastName} onChange={handleChange} autoComplete="family-name"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth required={!isEdit} label="Username" name="username"
                value={form.username} onChange={handleChange}
                disabled={isEdit}
                helperText={isEdit ? 'Username cannot be changed' : ''}
                autoComplete="username"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth label="Email" name="email" type="email"
                value={form.email} onChange={handleChange} autoComplete="email"
              />
            </Grid>
            {!isEdit && (
              <Grid item xs={12}>
                <TextField
                  fullWidth required label="Initial password" name="password" type="password"
                  value={form.password} onChange={handleChange}
                  helperText={`At least ${MIN_PASSWORD_LENGTH} characters. Share this with the user securely.`}
                  autoComplete="new-password"
                />
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="role-label">Role</InputLabel>
                <Select
                  labelId="role-label"
                  name="role"
                  label="Role"
                  value={form.role}
                  onChange={handleChange}
                  disabled={isRoot}
                >
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="admin">Admin</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ display: 'flex', alignItems: 'center' }}>
              <FormControlLabel
                control={
                  <Switch
                    name="accountLocked"
                    checked={form.accountLocked}
                    onChange={handleChange}
                    disabled={isRoot}
                  />
                }
                label="Account locked"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? <CircularProgress size={20} /> : (isEdit ? 'Save changes' : 'Create user')}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
};

export default UserFormDialog;
