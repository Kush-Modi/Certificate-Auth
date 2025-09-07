const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cryptoService = require('../services/cryptoService');
const stegoService = require('../services/stegoService');
const blockchainService = require('../services/blockchainService');
const { generateHash } = require('../utils/hash');

const router = express.Router();

// Configure multer for certificate verification uploads
const verifyBase = path.join(__dirname, '..', 'uploads', 'verification');
fs.mkdirSync(verifyBase, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, verifyBase);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'verify-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG, and PDF files are allowed.'));
    }
  }
});

// Verify certificate by file upload
router.post('/certificate', upload.single('certificate'), async (req, res) => {
  try {
    const certificateFile = req.file;

    if (!certificateFile) {
      return res.status(400).json({ 
        error: 'No certificate file provided' 
      });
    }

    // Step 1: Generate hash of uploaded certificate
    const certificateHash = await generateHash(certificateFile.path);
    console.log('📋 Certificate hash generated:', certificateHash);

    // Step 2: Extract embedded data via steganography
    const embeddedData = await stegoService.extractData(certificateFile.path);
    console.log('🕵️ Embedded data extracted:', embeddedData);

    if (!embeddedData) {
      return res.json({
        success: false,
        valid: false,
        message: 'No embedded verification data found in certificate',
        verificationDetails: {
          certificateHash,
          hasEmbeddedData: false,
          blockchainVerified: false,
          signatureVerified: false
        }
      });
    }

    // Step 3: Verify blockchain hash
    const blockchainVerification = await blockchainService.verifyHash(
      embeddedData.transactionHash,
      certificateHash
    );
    console.log('⛓️ Blockchain verification result:', blockchainVerification);

    // Step 4: Verify digital signature
    const signatureVerification = await cryptoService.verifySignature(
      certificateHash,
      embeddedData.signature,
      embeddedData.issuerId
    );
    console.log('🔐 Signature verification result:', signatureVerification);

    // Step 5: Determine overall validity
    const isValid = blockchainVerification.valid && signatureVerification.valid;

    res.json({
      success: true,
      valid: isValid,
      message: isValid ? 'Certificate is valid and authentic' : 'Certificate verification failed',
      verificationDetails: {
        certificateHash,
        transactionHash: embeddedData.transactionHash,
        issuerId: embeddedData.issuerId,
        issuedAt: embeddedData.timestamp,
        blockchainVerified: blockchainVerification.valid,
        signatureVerified: signatureVerification.valid,
        hasEmbeddedData: true,
        verificationTimestamp: new Date().toISOString()
      },
      blockchainDetails: blockchainVerification,
      signatureDetails: signatureVerification
    });

  } catch (error) {
    console.error('❌ Error verifying certificate:', error);
    res.status(500).json({ 
      error: 'Failed to verify certificate',
      message: error.message 
    });
  }
});

// Verify certificate by hash
router.get('/hash/:hash', async (req, res) => {
  try {
    const { hash } = req.params;

    if (!hash || hash.length !== 64) {
      return res.status(400).json({ 
        error: 'Invalid hash format. Hash must be 64 characters long.' 
      });
    }

    // Verify hash on blockchain
    const blockchainVerification = await blockchainService.verifyHashByHash(hash);

    res.json({
      success: true,
      valid: blockchainVerification.valid,
      message: blockchainVerification.valid ? 'Hash found on blockchain' : 'Hash not found on blockchain',
      verificationDetails: {
        certificateHash: hash,
        blockchainVerified: blockchainVerification.valid,
        verificationTimestamp: new Date().toISOString()
      },
      blockchainDetails: blockchainVerification
    });

  } catch (error) {
    console.error('❌ Error verifying hash:', error);
    res.status(500).json({ 
      error: 'Failed to verify hash',
      message: error.message 
    });
  }
});

// Verify certificate by transaction hash
router.get('/transaction/:txHash', async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash || txHash.length !== 66 || !txHash.startsWith('0x')) {
      return res.status(400).json({ 
        error: 'Invalid transaction hash format.' 
      });
    }

    // Get transaction details from blockchain
    const transactionDetails = await blockchainService.getTransactionDetails(txHash);

    res.json({
      success: true,
      valid: transactionDetails.found,
      message: transactionDetails.found ? 'Transaction found on blockchain' : 'Transaction not found on blockchain',
      verificationDetails: {
        transactionHash: txHash,
        blockchainVerified: transactionDetails.found,
        verificationTimestamp: new Date().toISOString()
      },
      transactionDetails
    });

  } catch (error) {
    console.error('❌ Error verifying transaction:', error);
    res.status(500).json({ 
      error: 'Failed to verify transaction',
      message: error.message 
    });
  }
});

// Get verification statistics
router.get('/stats', async (req, res) => {
  try {
    const stats = await blockchainService.getVerificationStats();
    
    res.json({
      success: true,
      stats: {
        totalCertificates: stats.totalCertificates || 0,
        verifiedCertificates: stats.verifiedCertificates || 0,
        blockchainNetwork: stats.network || 'Unknown',
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Error getting verification stats:', error);
    res.status(500).json({ 
      error: 'Failed to get verification statistics',
      message: error.message 
    });
  }
});

module.exports = router;
