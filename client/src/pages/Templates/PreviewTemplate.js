// PreviewTemplate.js
import React, { useState, useMemo } from 'react';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import PreviewIcon from '@mui/icons-material/Visibility';
import DOMPurify from 'dompurify';

const PreviewTemplate = ({ template }) => {
    const [open, setOpen] = useState(false);

    const handleClickOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    const sanitizedHtml = useMemo(
        () => DOMPurify.sanitize(template.htmlContent || ''),
        [template.htmlContent],
    );

    return (
        <>
            <IconButton color="primary" onClick={handleClickOpen}>
                <PreviewIcon />
            </IconButton>
            <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
                <DialogTitle>{`Subject: ${template.subject}`}</DialogTitle>
                <Divider sx={{ mx: 3 }} />
                <DialogContent>
                    <Typography variant="body1" dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PreviewTemplate;
