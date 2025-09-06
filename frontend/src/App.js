import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, AppBar, Toolbar, Typography, Container, Box, Button, Paper } from '@mui/material';
import IssueCertificate from './components/IssueCertificate';
import VerifyCertificate from './components/VerifyCertificate';
import QRScanner from './components/QRScanner';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
  },
});

function App() {
  const [activeTab, setActiveTab] = useState('issue');

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Box sx={{ flexGrow: 1 }}>
          <AppBar position="static" elevation={2}>
            <Toolbar>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
                🔐 Hybrid Certificate Authentication System
              </Typography>
              <Button color="inherit" component={Link} to="/">
                Home
              </Button>
              <Button color="inherit" component={Link} to="/verify">
                Verify
              </Button>
              <Button color="inherit" component={Link} to="/scanner">
                QR Scanner
              </Button>
            </Toolbar>
          </AppBar>

          <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                Certificate Authentication & Verification
              </Typography>
              <Typography variant="h6" component="h2" gutterBottom align="center" color="text.secondary">
                Secure, Tamper-proof Digital Certificates using Blockchain + Cryptography + Steganography
              </Typography>
            </Paper>

            <Routes>
              <Route path="/" element={<IssueCertificate />} />
              <Route path="/verify" element={<VerifyCertificate />} />
              <Route path="/scanner" element={<QRScanner />} />
            </Routes>

            <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
              <Typography variant="body2" color="text.secondary" align="center">
                Built with ❤️ by{' '}
                <a 
                  href="https://github.com/Kush-Modi" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ color: 'inherit', textDecoration: 'none' }}
                >
                  Kush Modi
                </a>
                {' '}for a more secure digital world
              </Typography>
            </Box>
          </Container>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;
