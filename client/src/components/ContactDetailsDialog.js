import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Grid,
    Card,
    TextField,
    Autocomplete,
    Alert,
    CircularProgress
} from '@mui/material';
import { Person, Group, Add, Edit as EditIcon } from '@mui/icons-material';
import { COUNTRIES } from '../utils/constants';
import {
    dialogPaperProps,
    gradientHeaderStyles,
    contactAvatarStyles,
    cardStyles,
    sectionHeaderStyles,
    fieldLabelStyles,
    fieldValueStyles
} from '../utils/styles';

const emptyForm = {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    role: '',
    country: ''
};

const ContactDetailsDialog = ({ open, onClose, contact, onSaveContact }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editedContact, setEditedContact] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [saveError, setSaveError] = useState('');
    const [saving, setSaving] = useState(false);

    // Reset edit state whenever the dialog is opened or the contact changes
    useEffect(() => {
        if (open && contact) {
            setEditedContact({
                firstName: contact.firstName || '',
                lastName: contact.lastName || '',
                email: contact.email || '',
                phoneNumber: contact.phoneNumber || '',
                role: contact.role || '',
                country: contact.country || ''
            });
        }
        if (!open) {
            setIsEditing(false);
            setFormErrors({});
            setSaveError('');
            setSaving(false);
        }
    }, [open, contact]);

    if (!contact) return null;

    const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    const validate = () => {
        const errors = {};
        if (!editedContact.firstName.trim()) {
            errors.firstName = 'First name is required';
        }
        if (!editedContact.email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(editedContact.email)) {
            errors.email = 'Please enter a valid email address';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleFieldChange = (e) => {
        const { name, value } = e.target;
        setEditedContact((prev) => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors((prev) => ({ ...prev, [name]: '' }));
        }
    };

    const handleStartEdit = () => {
        setSaveError('');
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setFormErrors({});
        setSaveError('');
        setEditedContact({
            firstName: contact.firstName || '',
            lastName: contact.lastName || '',
            email: contact.email || '',
            phoneNumber: contact.phoneNumber || '',
            role: contact.role || '',
            country: contact.country || ''
        });
    };

    const handleSave = async () => {
        if (!validate()) return;
        if (!onSaveContact) return;

        setSaving(true);
        setSaveError('');
        const result = await onSaveContact(contact._id, editedContact);
        setSaving(false);

        if (result?.success) {
            setIsEditing(false);
        } else {
            setSaveError(result?.message || 'Failed to update contact');
        }
    };

    const displayName = isEditing
        ? `${editedContact.firstName || ''} ${editedContact.lastName || ''}`.trim() || 'Unnamed Contact'
        : `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || 'Unnamed Contact';

    const avatarInitials = isEditing
        ? `${editedContact.firstName?.charAt(0) || ''}${editedContact.lastName?.charAt(0) || ''}`.toUpperCase()
        : `${contact.firstName?.charAt(0) || ''}${contact.lastName?.charAt(0) || ''}`.toUpperCase();

    const renderField = (label, name, value, options = {}) => {
        if (!isEditing) {
            return (
                <Box sx={{ mb: options.lastInGroup ? 0 : 2 }}>
                    <Typography variant="caption" sx={fieldLabelStyles}>
                        {label}
                    </Typography>
                    <Typography variant="body1" sx={fieldValueStyles}>
                        {value || options.emptyText || 'Not provided'}
                    </Typography>
                </Box>
            );
        }

        return (
            <Box sx={{ mb: options.lastInGroup ? 0 : 2 }}>
                <Typography variant="caption" sx={fieldLabelStyles}>
                    {label}{options.required ? ' *' : ''}
                </Typography>
                <TextField
                    margin="dense"
                    name={name}
                    placeholder={options.placeholder || ''}
                    type={options.type || 'text'}
                    fullWidth
                    variant="outlined"
                    size="small"
                    value={editedContact[name]}
                    onChange={handleFieldChange}
                    error={!!formErrors[name]}
                    helperText={formErrors[name] || ''}
                    sx={{ mt: 1 }}
                />
            </Box>
        );
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            fullWidth
            maxWidth="md"
            PaperProps={dialogPaperProps}
        >
            <DialogTitle sx={gradientHeaderStyles}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Person sx={{ fontSize: 28 }} />
                    <Typography variant="h6">
                        {isEditing ? 'Edit Contact' : 'Contact Details'}
                    </Typography>
                </Box>
            </DialogTitle>
            <DialogContent sx={{ p: 3 }}>
                <Box>
                    {/* Contact Avatar and Name */}
                    <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                        mb: 3,
                        p: 2,
                        bgcolor: 'grey.50',
                        borderRadius: 2
                    }}>
                        <Box sx={contactAvatarStyles}>
                            {avatarInitials}
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                {displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {(isEditing ? editedContact.email : contact.email) || 'No email provided'}
                            </Typography>
                        </Box>
                    </Box>

                    {saveError && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {saveError}
                        </Alert>
                    )}

                    <Grid container spacing={3}>
                        {/* Basic Information Card */}
                        <Grid item xs={12} md={6}>
                            <Card sx={cardStyles}>
                                <Typography variant="h6" gutterBottom sx={sectionHeaderStyles}>
                                    <Person fontSize="small" />
                                    Basic Information
                                </Typography>
                                <Box sx={{ mt: 2 }}>
                                    {renderField('FIRST NAME', 'firstName', contact.firstName, {
                                        required: true,
                                        placeholder: 'Enter first name',
                                        emptyText: 'Not provided'
                                    })}
                                    {renderField('LAST NAME', 'lastName', contact.lastName, {
                                        placeholder: 'Enter last name',
                                        emptyText: 'Not provided'
                                    })}
                                    {renderField('EMAIL ADDRESS', 'email', contact.email, {
                                        required: true,
                                        type: 'email',
                                        placeholder: 'Enter email address',
                                        emptyText: 'Not provided'
                                    })}
                                    {renderField('PHONE NUMBER', 'phoneNumber', contact.phoneNumber, {
                                        placeholder: 'Enter phone number',
                                        emptyText: 'Not provided'
                                    })}
                                    {renderField('ROLE', 'role', contact.role, {
                                        placeholder: 'Enter job role',
                                        emptyText: 'Not specified'
                                    })}
                                    {isEditing ? (
                                        <Box>
                                            <Typography variant="caption" sx={fieldLabelStyles}>
                                                COUNTRY
                                            </Typography>
                                            <Autocomplete
                                                options={COUNTRIES}
                                                value={editedContact.country}
                                                onChange={(event, newValue) => {
                                                    setEditedContact((prev) => ({
                                                        ...prev,
                                                        country: newValue || ''
                                                    }));
                                                }}
                                                renderInput={(params) => (
                                                    <TextField
                                                        {...params}
                                                        margin="dense"
                                                        placeholder="Select or type country"
                                                        variant="outlined"
                                                        size="small"
                                                        sx={{ mt: 1 }}
                                                    />
                                                )}
                                                freeSolo
                                                autoHighlight
                                                filterOptions={(options, { inputValue }) =>
                                                    options.filter((option) =>
                                                        option.toLowerCase().includes(inputValue.toLowerCase())
                                                    )
                                                }
                                            />
                                        </Box>
                                    ) : (
                                        <Box>
                                            <Typography variant="caption" sx={fieldLabelStyles}>
                                                COUNTRY
                                            </Typography>
                                            <Typography variant="body1" sx={fieldValueStyles}>
                                                {contact.country || 'Not specified'}
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Card>
                        </Grid>

                        {/* Metadata Card */}
                        <Grid item xs={12} md={6}>
                            <Card sx={{ ...cardStyles, height: 'fit-content' }}>
                                <Typography variant="h6" gutterBottom sx={sectionHeaderStyles}>
                                    <Group fontSize="small" />
                                    Additional Information
                                </Typography>
                                {contact.metadata && Object.keys(contact.metadata).length > 0 ? (
                                    <Box sx={{ mt: 2 }}>
                                        {Object.entries(contact.metadata).map(([key, value]) => (
                                            <Box key={key} sx={{ mb: 2 }}>
                                                <Typography variant="caption" sx={fieldLabelStyles}>
                                                    {key.toUpperCase().replace(/_/g, ' ')}
                                                </Typography>
                                                <Typography variant="body1" sx={fieldValueStyles}>
                                                    {value || 'Not provided'}
                                                </Typography>
                                            </Box>
                                        ))}
                                    </Box>
                                ) : (
                                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2, fontStyle: 'italic' }}>
                                        No additional information available
                                    </Typography>
                                )}
                            </Card>
                        </Grid>

                        {/* Timestamps Card */}
                        <Grid item xs={12}>
                            <Card sx={cardStyles}>
                                <Typography variant="h6" gutterBottom sx={sectionHeaderStyles}>
                                    <Add fontSize="small" />
                                    Timestamps
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 2 }}>
                                    <Grid item xs={12} md={6}>
                                        <Box>
                                            <Typography variant="caption" sx={fieldLabelStyles}>
                                                CREATED
                                            </Typography>
                                            <Typography variant="body1" sx={fieldValueStyles}>
                                                {contact.createdAt ? new Date(contact.createdAt).toLocaleString() : 'Unknown'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Box>
                                            <Typography variant="caption" sx={fieldLabelStyles}>
                                                LAST UPDATED
                                            </Typography>
                                            <Typography variant="body1" sx={fieldValueStyles}>
                                                {contact.updatedAt ? new Date(contact.updatedAt).toLocaleString() : 'Unknown'}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Card>
                        </Grid>
                    </Grid>
                </Box>
            </DialogContent>
            <DialogActions sx={{ p: 3, pt: 0 }}>
                {isEditing ? (
                    <>
                        <Button
                            onClick={handleCancelEdit}
                            variant="outlined"
                            disabled={saving}
                            sx={{ borderRadius: 2, px: 3, py: 1 }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSave}
                            variant="contained"
                            disabled={saving}
                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
                            sx={{ borderRadius: 2, px: 3, py: 1 }}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </>
                ) : (
                    <>
                        {onSaveContact && (
                            <Button
                                onClick={handleStartEdit}
                                variant="outlined"
                                startIcon={<EditIcon />}
                                sx={{ borderRadius: 2, px: 3, py: 1 }}
                            >
                                Edit
                            </Button>
                        )}
                        <Button
                            onClick={onClose}
                            variant="contained"
                            sx={{ borderRadius: 2, px: 3, py: 1 }}
                        >
                            Close
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ContactDetailsDialog;
