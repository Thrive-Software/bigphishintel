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
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  ContentCopy as ContentCopyIcon,
  Check as CheckIcon,
} from '@mui/icons-material';

const MIN_PASSWORD_LENGTH = 6;
const GENERATED_PASSWORD_LENGTH = 16;
const PORTAL_URL = 'https://phishintel.thrive.uk.com/console';

// Excludes visually ambiguous characters (0/O, 1/l/I) so generated passwords
// can be read aloud or transcribed without confusion.
const PASSWORD_ALPHABET =
  'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*';

const generateSecurePassword = (length = GENERATED_PASSWORD_LENGTH) => {
  const alphabet = PASSWORD_ALPHABET;
  const buf = new Uint32Array(length);
  window.crypto.getRandomValues(buf);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += alphabet[buf[i] % alphabet.length];
  }
  return out;
};

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
  const [showPassword, setShowPassword] = useState(false);
  const [copied, setCopied] = useState(false);

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
      setForm({ ...blank, password: generateSecurePassword() });
    }
    setError('');
    setShowPassword(false);
    setCopied(false);
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((p) => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
    if (name === 'username' || name === 'password') setCopied(false);
  };

  const handleRegeneratePassword = () => {
    setForm((p) => ({ ...p, password: generateSecurePassword() }));
    setShowPassword(true);
    setCopied(false);
  };

  const handleCopyInfo = async () => {
    const snippet =
      `PhishIntel Portal: ${PORTAL_URL}\n` +
      `Username: ${form.username}\n` +
      `Password: ${form.password}`;
    try {
      await navigator.clipboard.writeText(snippet);
      setCopied(true);
    } catch (err) {
      setError('Could not copy to clipboard. Copy the password manually before closing.');
    }
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

  const canCopyInfo = !isEdit && form.username.trim() && form.password.length >= MIN_PASSWORD_LENGTH;

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
                  fullWidth required label="Initial password" name="password"
                  type={showPassword ? 'text' : 'password'}
                  value={form.password} onChange={handleChange}
                  helperText={`Auto-generated. At least ${MIN_PASSWORD_LENGTH} characters. Share this with the user securely.`}
                  autoComplete="new-password"
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                          <IconButton
                            onClick={() => setShowPassword((s) => !s)}
                            edge="end"
                            size="small"
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </Tooltip>
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ mt: 1 }}>
                  <Button size="small" onClick={handleRegeneratePassword}>
                    Regenerate password
                  </Button>
                </Box>
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
          {!isEdit && (
            <Button
              onClick={handleCopyInfo}
              disabled={!canCopyInfo}
              startIcon={copied ? <CheckIcon /> : <ContentCopyIcon />}
              sx={{ mr: 'auto' }}
            >
              {copied ? 'Copied' : 'Copy Info To Clipboard'}
            </Button>
          )}
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
