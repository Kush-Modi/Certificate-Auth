import React, { useState, useRef, useEffect } from 'react';
import {
  Paper,
  Typography,
  Box,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  QrCodeScanner,
  CheckCircle,
  Error,
  Info,
  Download,
  Share
} from '@mui/icons-material';
import { verifyHash, verifyTransaction } from '../utils/api';

const QRScanner = () => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    return () => {
      // Cleanup camera stream on component unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startScanning = async () => {
    try {
      setError(null);
      setScanResult(null);
      setVerificationResult(null);
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setScanning(true);
      }
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      console.error('Camera access error:', err);
    }
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      const context = canvas.getContext('2d');
      
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      // In a real implementation, you would use a QR code library like qrcode-reader
      // to decode the QR code from the canvas image
      // For now, we'll simulate QR code detection
      simulateQRDetection();
    }
  };

  const simulateQRDetection = () => {
    // Simulate QR code detection
    const mockQRData = {
      type: 'certificate',
      hash: 'a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
      transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      issuerId: 'demo-issuer',
      verificationUrl: 'https://example.com/verify/a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456'
    };
    
    setScanResult(mockQRData);
    stopScanning();
    setShowResult(true);
  };

  const handleVerifyQR = async () => {
    if (!scanResult) return;

    setLoading(true);
    setError(null);

    try {
      let response;
      
      if (scanResult.hash) {
        response = await verifyHash(scanResult.hash);
      } else if (scanResult.transactionHash) {
        response = await verifyTransaction(scanResult.transactionHash);
      } else {
        throw new Error('Invalid QR code data');
      }

      setVerificationResult(response);
    } catch (err) {
      setError(err.message || 'Failed to verify QR code data');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseResult = () => {
    setShowResult(false);
    setScanResult(null);
    setVerificationResult(null);
    setError(null);
  };

  const generateQRCode = () => {
    // In a real implementation, you would generate a QR code
    // For demo purposes, we'll show a placeholder
    const qrData = {
      type: 'certificate',
      hash: 'demo-hash-1234567890abcdef',
      transactionHash: '0xdemo1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
      issuerId: 'demo-issuer',
      verificationUrl: 'https://example.com/verify/demo-hash-1234567890abcdef'
    };

    setScanResult(qrData);
    setShowResult(true);
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
          📱 QR Code Scanner
        </Typography>
        
        <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
          Scan QR codes to quickly verify certificates or generate QR codes for issued certificates
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Scanner Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  📷 Scan QR Code
                </Typography>
                
                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  {!scanning ? (
                    <Box
                      sx={{
                        border: '2px dashed #ccc',
                        borderRadius: 2,
                        p: 4,
                        backgroundColor: '#f5f5f5',
                        minHeight: 200,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        Click to start scanning
                      </Typography>
                    </Box>
                  ) : (
                    <Box sx={{ position: 'relative' }}>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        style={{
                          width: '100%',
                          maxWidth: 300,
                          height: 'auto',
                          borderRadius: 8
                        }}
                      />
                      <canvas
                        ref={canvasRef}
                        style={{ display: 'none' }}
                      />
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          width: 200,
                          height: 200,
                          border: '2px solid #1976d2',
                          borderRadius: 2,
                          pointerEvents: 'none'
                        }}
                      />
                    </Box>
                  )}
                </Box>

                <Box sx={{ display: 'flex', gap: 2 }}>
                  {!scanning ? (
                    <Button
                      variant="contained"
                      onClick={startScanning}
                      startIcon={<QrCodeScanner />}
                      fullWidth
                    >
                      Start Scanning
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="contained"
                        onClick={captureFrame}
                        startIcon={<QrCodeScanner />}
                        fullWidth
                      >
                        Capture QR Code
                      </Button>
                      <Button
                        variant="outlined"
                        onClick={stopScanning}
                        fullWidth
                      >
                        Stop
                      </Button>
                    </>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Generator Section */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  🎯 Generate QR Code
                </Typography>
                
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Generate a QR code for demo purposes or for issued certificates
                </Typography>

                <Box sx={{ textAlign: 'center', mb: 3 }}>
                  <Box
                    sx={{
                      border: '2px dashed #ccc',
                      borderRadius: 2,
                      p: 4,
                      backgroundColor: '#f5f5f5',
                      minHeight: 200,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <QrCodeScanner sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="body1" color="text.secondary">
                      QR Code will appear here
                    </Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  onClick={generateQRCode}
                  startIcon={<QrCodeScanner />}
                  fullWidth
                >
                  Generate Demo QR Code
                </Button>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Info Card */}
        <Card sx={{ mt: 3, backgroundColor: 'info.light', color: 'info.contrastText' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Info sx={{ mr: 1 }} />
              <Typography variant="h6">
                QR Code Features
              </Typography>
            </Box>
            <Typography variant="body2">
              QR codes can contain various types of verification data:
            </Typography>
            <Box component="ul" sx={{ mt: 1, pl: 2 }}>
              <li><strong>Certificate Hash:</strong> Direct hash verification</li>
              <li><strong>Transaction Hash:</strong> Blockchain transaction verification</li>
              <li><strong>Verification URL:</strong> Link to online verification</li>
              <li><strong>Issuer Information:</strong> Certificate issuer details</li>
            </Box>
          </CardContent>
        </Card>
      </Paper>

      {/* QR Code Result Dialog */}
      <Dialog open={showResult} onClose={handleCloseResult} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <QrCodeScanner sx={{ mr: 1 }} />
            QR Code Data
          </Box>
        </DialogTitle>
        <DialogContent>
          {scanResult && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scanned Data:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Chip
                    label={`Type: ${scanResult.type}`}
                    color="primary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Chip
                    label={`Issuer: ${scanResult.issuerId}`}
                    color="secondary"
                    variant="outlined"
                    sx={{ mb: 1 }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Hash: {scanResult.hash}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="body2" color="text.secondary">
                    Transaction: {scanResult.transactionHash}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', my: 3 }}>
              <CircularProgress />
            </Box>
          )}

          {verificationResult && (
            <Box>
              <Typography variant="h6" gutterBottom>
                Verification Result:
              </Typography>
              <Alert 
                severity={verificationResult.valid ? 'success' : 'error'}
                sx={{ mb: 2 }}
              >
                {verificationResult.message}
              </Alert>
              <Typography variant="body2" color="text.secondary">
                Verified at: {new Date(verificationResult.verificationDetails?.verificationTimestamp).toLocaleString()}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseResult}>
            Close
          </Button>
          {scanResult && !verificationResult && (
            <Button
              variant="contained"
              onClick={handleVerifyQR}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <CheckCircle />}
            >
              {loading ? 'Verifying...' : 'Verify'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QRScanner;
