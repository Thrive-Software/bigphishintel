import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Container from '@mui/material/Container';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import Sidebar from '../../components/Sidebar';
import Footer from '../../components/Footer';
import { useNavigate, useParams } from 'react-router-dom';
import { useSenderProfiles } from '../../hooks/useSenderProfiles';

const CreateSenderProfile = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);
    const {
        createSenderProfile,
        updateSenderProfile,
        fetchSenderProfile,
        loading,
        error,
    } = useSenderProfiles();
    const [senderName, setSenderName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [host, setHost] = useState('');
    const [port, setPort] = useState('');
    const [secure, setSecure] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fromAddress, setFromAddress] = useState('');
    const [replyTo, setReplyTo] = useState('');
    const [loadError, setLoadError] = useState(null);

    useEffect(() => {
        if (!isEditMode) return;
        let cancelled = false;
        (async () => {
            const response = await fetchSenderProfile(id);
            if (cancelled) return;
            if (response.success) {
                const p = response.data;
                setSenderName(p.senderName || '');
                setEmail(p.email || '');
                setHost(p.host || '');
                setPort(p.port != null ? String(p.port) : '');
                setSecure(Boolean(p.secure));
                setFromAddress(p.fromAddress || '');
                setReplyTo(p.replyTo || '');
            } else {
                setLoadError(response.message || 'Failed to load sender profile');
            }
        })();
        return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, isEditMode]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            senderName,
            email,
            host,
            port: Number(port),
            secure,
            fromAddress,
            replyTo,
        };
        // Only send password if the user typed one. On edit, omitting it keeps the stored value.
        if (password.length > 0) {
            payload.password = password;
        } else if (!isEditMode) {
            payload.password = '';
        }

        const response = isEditMode
            ? await updateSenderProfile(id, payload)
            : await createSenderProfile(payload);

        if (response.success) {
            navigate('/console/sender-profile');
        } else {
            console.error('Error saving sender profile:', response.message);
        }
    };

    const pageTitle = isEditMode ? 'Edit Sender Profile' : 'Create a New Sender Profile';
    const pageSubtitle = isEditMode
        ? 'Update the fields below. Leave the password blank to keep the existing one.'
        : 'Fill in the details below to create a new sender profile.';
    const submitLabel = isEditMode ? 'Save Changes' : 'Create Sender Profile';
    const passwordHelper = isEditMode
        ? 'Leave blank to keep the existing password. Enter a new value to replace it.'
        : 'This field may be left blank if authentication is not required.';

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: "#fafafa" }}>
            <Sidebar />
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                <Container maxWidth="lg" sx={{ flexGrow: 1, mt: '110px', mb: 2 }}>
                    <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid sx={{ pl: 2, pb: 2 }} xs={12}>
                            <Typography
                                sx={{
                                    mb: 1,
                                    fontWeight: 500,
                                    background: 'linear-gradient(45deg, #1976d2, #42a5f5)',
                                    backgroundClip: 'text',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontSize: { xs: '1rem', md: '1.5rem' }
                                }}
                                variant="h4"
                                color="primary"
                            >
                                {pageTitle}
                            </Typography>
                            <Typography sx={{ fontSize: 13 }} color="text.secondary">
                                {pageSubtitle}
                            </Typography>
                        </Grid>
                    </Grid>

                    <form onSubmit={handleSubmit}>
                        <Grid container spacing={3}>
                            {/* Sender Name */}
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Sender Name"
                                    variant="outlined"
                                    value={senderName}
                                    onChange={(e) => setSenderName(e.target.value)}
                                    required
                                    helperText="Enter the name of the sender."
                                    sx={{
                                        '& .MuiInputLabel-root': {
                                            '& .MuiInputLabel-asterisk': {
                                                color: 'error.main',
                                            },
                                        },
                                    }}
                                />
                            </Grid>


                            {/* Host and Port in one row */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Host"
                                    variant="outlined"
                                    value={host}
                                    onChange={(e) => setHost(e.target.value)}
                                    required
                                    helperText="Enter the SMTP host (e.g., smtp.example.com)."
                                    sx={{
                                        '& .MuiInputLabel-root': {
                                            '& .MuiInputLabel-asterisk': {
                                                color: 'error.main',
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Port"
                                    variant="outlined"
                                    value={port}
                                    onChange={(e) => setPort(e.target.value)}
                                    required
                                    type="number"
                                    helperText="Enter the port number (e.g., 465 for SSL, 587 for TLS)."
                                    sx={{
                                        '& .MuiInputLabel-root': {
                                            '& .MuiInputLabel-asterisk': {
                                                color: 'error.main',
                                            },
                                        },
                                    }}
                                />
                            </Grid>

                            {/* Email and Password in one row */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Email or Username (optional)"
                                    variant="outlined"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    helperText="This field may be left blank if authentication is not required."
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label={isEditMode ? 'Password (leave blank to keep existing)' : 'Password (optional)'}
                                    variant="outlined"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder={isEditMode ? '••••••••' : ''}
                                    helperText={passwordHelper}
                                    autoComplete="new-password"
                                    InputProps={{
                                        endAdornment: (
                                            <InputAdornment position="end">
                                                <IconButton
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    edge="end"
                                                    size="small"
                                                >
                                                    {showPassword ? <VisibilityOff /> : <Visibility />}
                                                </IconButton>
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>

                            {/* From Address and Reply-To in one row */}
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="From Address (optional)"
                                    variant="outlined"
                                    value={fromAddress}
                                    onChange={(e) => setFromAddress(e.target.value)}
                                    helperText="Address to appear in the From header. Falls back to the auth email if left blank."
                                    type="email"
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="Reply-To (optional)"
                                    variant="outlined"
                                    value={replyTo}
                                    onChange={(e) => setReplyTo(e.target.value)}
                                    helperText="Address recipients reply to. Leave blank to use the From address."
                                    type="email"
                                />
                            </Grid>

                            {/* Secure Checkbox */}
                            <Grid item xs={12}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={secure}
                                            onChange={(e) => setSecure(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label="Use Secure Connection (SSL/TLS)"
                                />
                            </Grid>

                            {/* Submit Button */}
                            <Grid item xs={12}>
                                <Button type="submit" variant="contained" color="primary" disabled={loading}>
                                    {loading ? <CircularProgress size={24} /> : submitLabel}
                                </Button>
                            </Grid>

                            {/* Error Message */}
                            {(error || loadError) && (
                                <Grid item xs={12}>
                                    <Alert severity="error">{error || loadError}</Alert>
                                </Grid>
                            )}
                        </Grid>
                    </form>
                </Container>
                <Footer />
            </Box>
        </Box>
    );
};

export default CreateSenderProfile;
