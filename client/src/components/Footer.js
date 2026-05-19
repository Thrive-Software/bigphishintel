import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import Container from '@mui/material/Container';

const Footer = () => {
    return (
        <Box component="footer" sx={{ backgroundColor: '#fafafa', textAlign: 'center', width: '100%' }}>
            <Container><Divider sx={{ ml: 2, mr: 4 }} /></Container>
            <Typography sx={{ p: 2 }} variant="body2" color="text.secondary">
                © CloudSec Network (CSN)
            </Typography>
        </Box>
    );
};

export default Footer;
