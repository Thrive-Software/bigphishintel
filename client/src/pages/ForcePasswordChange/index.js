import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import CssBaseline from '@mui/material/CssBaseline';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import LockResetIcon from '@mui/icons-material/LockReset';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { changePassword } from '../../services/userService';
import { logout } from '../../utils/tokenManager';

const MIN_PASSWORD_LENGTH = 6;
const defaultTheme = createTheme();

export default function ForcePasswordChange() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [values, setValues] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setValues((prev) => ({ ...prev, [name]: value }));
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (values.newPassword !== values.confirmPassword) {
            setError('New password and confirmation do not match.');
            return;
        }
        if (values.newPassword.length < MIN_PASSWORD_LENGTH) {
            setError(`New password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
            return;
        }
        if (values.newPassword === values.currentPassword) {
            setError('New password must be different from the current one.');
            return;
        }
        setLoading(true);
        try {
            const res = await changePassword(values.currentPassword, values.newPassword);
            if (res.success) {
                navigate('/console/dashboard', { replace: true });
            }
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ThemeProvider theme={defaultTheme}>
            <Container component="main" maxWidth="xs">
                <CssBaseline />
                <Box
                    sx={{
                        marginTop: 8,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                    }}>
                    <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
                        <LockResetIcon />
                    </Avatar>
                    <Typography component="h1" variant="h5">
                        Set a new password
                    </Typography>
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        align="center"
                        sx={{ mt: 1, mb: 2 }}>
                        For security, please update your password before continuing.
                    </Typography>
                    {error && (
                        <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
                            {error}
                        </Alert>
                    )}
                    <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2, width: '100%' }}>
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="currentPassword"
                            label="Current password"
                            type="password"
                            id="currentPassword"
                            autoComplete="current-password"
                            autoFocus
                            value={values.currentPassword}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="newPassword"
                            label="New password"
                            type="password"
                            id="newPassword"
                            autoComplete="new-password"
                            helperText={`At least ${MIN_PASSWORD_LENGTH} characters`}
                            value={values.newPassword}
                            onChange={handleChange}
                        />
                        <TextField
                            margin="normal"
                            required
                            fullWidth
                            name="confirmPassword"
                            label="Confirm new password"
                            type="password"
                            id="confirmPassword"
                            autoComplete="new-password"
                            value={values.confirmPassword}
                            onChange={handleChange}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            sx={{ mt: 3, mb: 1 }}
                            disabled={loading}>
                            {loading ? <CircularProgress size={22} /> : 'Update password'}
                        </Button>
                        <Button
                            fullWidth
                            variant="text"
                            color="secondary"
                            onClick={logout}>
                            Cancel and sign out
                        </Button>
                    </Box>
                </Box>
            </Container>
        </ThemeProvider>
    );
}
