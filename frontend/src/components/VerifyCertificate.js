import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Divider,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  CloudUpload,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  Security,
  Blockchain,
  Fingerprint,
  Verified
} from '@mui/icons-material';
import { verifyCertificate, verifyHash, verifyTransaction } from '../utils/api';

const VerifyCertificate = () => {
  const [certificateFile, setCertificateFile] = useState(null);
  const [verificationHash, setVerificationHash] = useState('');
  const [transactionHash, setTransactionHash] = useState('');
  const [verificationMethod, setVerificationMethod] = useState('file');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      setError(null);
    }
  };

  const handleVerifyByFile = async () => {
    if (!certificateFile) {
      setError('Please upload a certificate file');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('certificate', certificateFile);

      const response = await verifyCertificate(formData);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to verify certificate');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByHash = async () => {
    if (!verificationHash) {
      setError('Please enter a certificate hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyHash(verificationHash);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to verify hash');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyByTransaction = async () => {
    if (!transactionHash) {
      setError('Please enter a transaction hash');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await verifyTransaction(transactionHash);
      setResult(response);
    } catch (err) {
      setError(err.message || 'Failed to verify transaction');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCertificateFile(null);
    setVerificationHash('');
    setTransactionHash('');
    setResult(null);
    setError(null);
  };

  const getVerificationIcon = (valid) => {
    if (valid === true) return <CheckCircle color="success" />;
    if (valid === false) return <Error color="error" />;
    return <Warning color="warning" />;
  };

  const getVerificationColor = (valid) => {
    if (valid === true) return 'success';
    if (valid === false) return 'error';
    return 'warning';
  };

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          🔍 Verify Certificate
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Verify the authenticity of digital certificates using multiple verification methods
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Verification Methods */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Method 1: File Upload */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: verificationMethod === 'file' ? 2 : 1,
                borderColor: verificationMethod === 'file' ? 'primary.main' : 'divider'
              }}
              onClick={() => setVerificationMethod('file')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <CloudUpload color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">File Upload</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Upload the certificate file for complete verification
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Method 2: Hash Verification */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: verificationMethod === 'hash' ? 2 : 1,
                borderColor: verificationMethod === 'hash' ? 'primary.main' : 'divider'
              }}
              onClick={() => setVerificationMethod('hash')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Fingerprint color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Hash Verification</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Verify using certificate hash value
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Method 3: Transaction Verification */}
          <Grid item xs={12} md={4}>
            <Card 
              sx={{ 
                height: '100%',
                cursor: 'pointer',
                border: verificationMethod === 'transaction' ? 2 : 1,
                borderColor: verificationMethod === 'transaction' ? 'primary.main' : 'divider'
              }}
              onClick={() => setVerificationMethod('transaction')}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Blockchain color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Transaction Hash</Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Verify using blockchain transaction hash
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Verification Forms */}
        {verificationMethod === 'file' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 Upload Certificate File
              </Typography>
              
              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  mb: 3,
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => document.getElementById('verify-upload').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {certificateFile ? certificateFile.name : 'Click to upload certificate'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports PDF, JPEG, PNG files (max 10MB)
                </Typography>
                <input
                  id="verify-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </Box>

              {certificateFile && (
                <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={`${certificateFile.name} (${(certificateFile.size / 1024 / 1024).toFixed(2)} MB)`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}

              <Button
                variant="contained"
                onClick={handleVerifyByFile}
                disabled={loading || !certificateFile}
                startIcon={loading ? <CircularProgress size={20} /> : <Verified />}
                fullWidth
              >
                {loading ? 'Verifying Certificate...' : 'Verify Certificate'}
              </Button>
            </CardContent>
          </Card>
        )}

        {verificationMethod === 'hash' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔑 Enter Certificate Hash
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <input
                  type="text"
                  placeholder="Enter 64-character certificate hash..."
                  value={verificationHash}
                  onChange={(e) => setVerificationHash(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'monospace'
                  }}
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleVerifyByHash}
                disabled={loading || !verificationHash}
                startIcon={loading ? <CircularProgress size={20} /> : <Verified />}
                fullWidth
              >
                {loading ? 'Verifying Hash...' : 'Verify Hash'}
              </Button>
            </CardContent>
          </Card>
        )}

        {verificationMethod === 'transaction' && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⛓️ Enter Transaction Hash
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <input
                  type="text"
                  placeholder="Enter 66-character transaction hash (0x...)..."
                  value={transactionHash}
                  onChange={(e) => setTransactionHash(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid #e0e0e0',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontFamily: 'monospace'
                  }}
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleVerifyByTransaction}
                disabled={loading || !transactionHash}
                startIcon={loading ? <CircularProgress size={20} /> : <Verified />}
                fullWidth
              >
                {loading ? 'Verifying Transaction...' : 'Verify Transaction'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Verification Results */}
        {result && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                {getVerificationIcon(result.valid)}
                <Typography variant="h5" sx={{ ml: 1 }}>
                  Verification {result.valid ? 'Successful' : 'Failed'}
                </Typography>
              </Box>

              <Alert 
                severity={getVerificationColor(result.valid)} 
                sx={{ mb: 3 }}
              >
                {result.message}
              </Alert>

              <Divider sx={{ my: 3 }} />

              <Typography variant="h6" gutterBottom>
                Verification Details
              </Typography>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Certificate Hash:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {result.verificationDetails?.certificateHash?.substring(0, 16)}...
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Transaction Hash:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {result.verificationDetails?.transactionHash?.substring(0, 16)}...
                    </Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Issuer ID:</Typography>
                    <Typography variant="body2">{result.verificationDetails?.issuerId || 'N/A'}</Typography>
                  </Box>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">Verified At:</Typography>
                    <Typography variant="body2">
                      {new Date(result.verificationDetails?.verificationTimestamp).toLocaleString()}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>

              {/* Security Layer Verification */}
              <Accordion>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Security sx={{ mr: 1 }} />
                    <Typography variant="h6">Security Layer Verification</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List>
                    <ListItem>
                      <ListItemIcon>
                        {getVerificationIcon(result.verificationDetails?.blockchainVerified)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Blockchain Verification"
                        secondary={result.verificationDetails?.blockchainVerified ? 
                          "Hash found on blockchain" : "Hash not found on blockchain"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {getVerificationIcon(result.verificationDetails?.signatureVerified)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Digital Signature Verification"
                        secondary={result.verificationDetails?.signatureVerified ? 
                          "Signature is valid" : "Signature verification failed"}
                      />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        {getVerificationIcon(result.verificationDetails?.hasEmbeddedData)}
                      </ListItemIcon>
                      <ListItemText
                        primary="Steganographic Data"
                        secondary={result.verificationDetails?.hasEmbeddedData ? 
                          "Embedded data found" : "No embedded data found"}
                      />
                    </ListItem>
                  </List>
                </AccordionDetails>
              </Accordion>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  fullWidth
                >
                  Verify Another Certificate
                </Button>
                <Button
                  variant="contained"
                  href="/"
                  fullWidth
                >
                  Issue New Certificate
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card sx={{ mt: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Info sx={{ mr: 1 }} />
              <Typography variant="h6">
                Verification Process
              </Typography>
            </Box>
            <Typography variant="body2">
              Our system verifies certificates using three security layers:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li><strong>Blockchain:</strong> Checks if hash exists on immutable blockchain</li>
              <li><strong>Cryptography:</strong> Verifies digital signature with issuer's public key</li>
              <li><strong>Steganography:</strong> Extracts hidden verification data from certificate</li>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
};

export default VerifyCertificate;
