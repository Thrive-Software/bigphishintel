// DeleteTemplate.js
import React, { useState } from 'react';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import DeleteIcon from '@mui/icons-material/HighlightOff';
import { useTemplates } from '../../hooks/useTemplates'; // Import the hook

const DeleteTemplate = ({ template, onDeleteSuccess }) => {
    const [open, setOpen] = useState(false);

    const { deleteTemplate } = useTemplates(); // Destructure deleteTemplate from the hook

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const handleDelete = async () => {
        // Call the API to delete the template
        const response = await deleteTemplate(template._id);
        if (response.success) {
            onDeleteSuccess();  // Trigger the notification and state update callback
        }
        handleClose();
    };

    return (
        <>
            <IconButton color="error" onClick={handleClickOpen}>
                <DeleteIcon />
            </IconButton>
            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Confirm Delete</DialogTitle>
                <DialogContent>
                    <Typography>{`Are you sure you want to delete the template "${template.name}"?`}</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">Cancel</Button>
                    <Button onClick={handleDelete} color="error">Delete</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default DeleteTemplate;
