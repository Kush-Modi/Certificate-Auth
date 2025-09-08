import React, { useState } from 'react';
import {
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Divider,
  Chip
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Info } from '@mui/icons-material';
import { issueCertificate, generateKeyPair } from '../utils/api';
import QRCode from 'qrcode';

const IssueCertificate = () => {
  const [formData, setFormData] = useState({
    issuerId: '',
    issuerName: '',
    recipientName: '',
    certificateType: '',
    description: ''
  });
  const [certificateFile, setCertificateFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [activeStep, setActiveStep] = useState(0);
  const [keyPairGenerated, setKeyPairGenerated] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [noiseDefense, setNoiseDefense] = useState(true);

  const steps = [
    'Generate Key Pair',
    'Upload Certificate',
    'Issue Certificate',
    'Complete'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setCertificateFile(file);
      setError(null);
    }
  };

  const handleGenerateKeyPair = async () => {
    if (!formData.issuerId || !formData.issuerName) {
      setError('Please fill in Issuer ID and Issuer Name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await generateKeyPair(formData.issuerId, formData.issuerName);
      if (response.success) {
        setKeyPairGenerated(true);
        setActiveStep(1);
        setResult({
          type: 'success',
          message: 'Key pair generated successfully!',
          data: response
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to generate key pair');
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCertificate = async () => {
    if (!certificateFile) {
      setError('Please upload a certificate file');
      return;
    }

    if (!formData.recipientName || !formData.certificateType) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('certificate', certificateFile);
      formDataToSend.append('issuerId', formData.issuerId);
      formDataToSend.append('issuerName', formData.issuerName);
      formDataToSend.append('recipientName', formData.recipientName);
      formDataToSend.append('certificateType', formData.certificateType);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('noiseDefense', String(noiseDefense));

      const response = await issueCertificate(formDataToSend);
      if (response.success) {
        setActiveStep(3);
        setResult({
          type: 'success',
          message: 'Certificate issued successfully!',
          data: response.data
        });
        // Build QR content and render
        const qrContent = JSON.stringify({
          tx: response.data.transactionHash,
          hash: response.data.certificateHash,
          url: response.data.verificationUrl
        });
        try {
          const dataUrl = await QRCode.toDataURL(qrContent, { width: 256 });
          setQrDataUrl(dataUrl);
        } catch (e) {
          // ignore QR failures in demo
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to issue certificate');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      issuerId: '',
      issuerName: '',
      recipientName: '',
      certificateType: '',
      description: ''
    });
    setCertificateFile(null);
    setResult(null);
    setError(null);
    setActiveStep(0);
    setKeyPairGenerated(false);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          📋 Issue Certificate
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Create tamper-proof digital certificates using blockchain, cryptography, and steganography
        </Typography>

        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {result && (
          <Alert severity={result.type} sx={{ mb: 3 }}>
            {result.message}
          </Alert>
        )}

        {/* Step 1: Generate Key Pair */}
        {activeStep === 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                🔐 Step 1: Generate Issuer Key Pair
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate a unique public-private key pair for digital signature verification
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Issuer ID"
                  name="issuerId"
                  value={formData.issuerId}
                  onChange={handleInputChange}
                  placeholder="e.g., university-001"
                  required
                />
                <TextField
                  fullWidth
                  label="Issuer Name"
                  name="issuerName"
                  value={formData.issuerName}
                  onChange={handleInputChange}
                  placeholder="e.g., MIT University"
                  required
                />
              </Box>

              <Button
                variant="contained"
                onClick={handleGenerateKeyPair}
                disabled={loading || !formData.issuerId || !formData.issuerName}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                fullWidth
              >
                {loading ? 'Generating Key Pair...' : 'Generate Key Pair'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Upload Certificate */}
        {activeStep === 1 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📄 Step 2: Upload Certificate
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Upload the certificate file (PDF, JPEG, PNG) to be secured
              </Typography>

              <Box
                sx={{
                  border: '2px dashed #ccc',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'action.hover'
                  }
                }}
                onClick={() => document.getElementById('certificate-upload').click()}
              >
                <CloudUpload sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  {certificateFile ? certificateFile.name : 'Click to upload certificate'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Supports PDF, JPEG, PNG files (max 10MB)
                </Typography>
                <input
                  id="certificate-upload"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </Box>

              {certificateFile && (
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
                  <Chip
                    label={`${certificateFile.name} (${(certificateFile.size / 1024 / 1024).toFixed(2)} MB)`}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
              )}

              <Button
                variant="contained"
                onClick={() => setActiveStep(2)}
                disabled={!certificateFile}
                fullWidth
                sx={{ mt: 3 }}
              >
                Continue to Certificate Details
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Certificate Details */}
        {activeStep === 2 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                📝 Step 3: Certificate Details
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Provide details about the certificate and recipient
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  name="recipientName"
                  value={formData.recipientName}
                  onChange={handleInputChange}
                  placeholder="e.g., John Doe"
                  required
                />
                <TextField
                  fullWidth
                  label="Certificate Type"
                  name="certificateType"
                  value={formData.certificateType}
                  onChange={handleInputChange}
                  placeholder="e.g., Bachelor's Degree"
                  required
                />
              </Box>

              <TextField
                fullWidth
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
                placeholder="Additional details about the certificate..."
                sx={{ mb: 3 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <input
                  id="noise-defense"
                  type="checkbox"
                  checked={noiseDefense}
                  onChange={(e) => setNoiseDefense(e.target.checked)}
                />
                <label htmlFor="noise-defense">Noise Defense Enabled</label>
              </Box>

              <Button
                variant="contained"
                onClick={handleIssueCertificate}
                disabled={loading || !formData.recipientName || !formData.certificateType}
                startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
                fullWidth
              >
                {loading ? 'Issuing Certificate...' : 'Issue Certificate'}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 4: Success */}
        {activeStep === 3 && result && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center" color="success.main">
                ✅ Certificate Issued Successfully!
              </Typography>
              
              <Divider sx={{ my: 3 }} />
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Certificate Details:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Certificate Hash:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {result.data.certificateHash.substring(0, 16)}...
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Transaction Hash:</Typography>
                    <Typography variant="body2" fontFamily="monospace">
                      {result.data.transactionHash.substring(0, 16)}...
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Issuer:</Typography>
                    <Typography variant="body2">{result.data.issuerId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Recipient:</Typography>
                    <Typography variant="body2">{result.data.recipientName}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Type:</Typography>
                    <Typography variant="body2">{result.data.certificateType}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" color="text.secondary">Issued At:</Typography>
                    <Typography variant="body2">
                      {new Date(result.data.issuedAt).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  fullWidth
                >
                  Issue Another Certificate
                </Button>
                <Button
                  variant="contained"
                  href="/verify"
                  fullWidth
                >
                  Verify Certificate
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
                How It Works
              </Typography>
            </Box>
            <Typography variant="body2">
              Your certificate will be secured using three layers of protection:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li><strong>Blockchain:</strong> Hash stored immutably on blockchain</li>
              <li><strong>Cryptography:</strong> Digitally signed with your private key</li>
              <li><strong>Steganography:</strong> Verification data hidden within the certificate</li>
            </Box>
          </CardContent>
        </Card>
      </Paper>
    </Box>
  );
};

export default IssueCertificate;
