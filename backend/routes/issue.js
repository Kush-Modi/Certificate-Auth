const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cryptoService = require('../services/cryptoService');
const stegoService = require('../services/stegoService');
const blockchainService = require('../services/blockchainService');
const { generateHash, generateCombinedHash } = require('../utils/hash');

const router = express.Router();

// Ensure upload directories exist
const uploadBase = path.join(__dirname, '..', 'uploads', 'certificates');
fs.mkdirSync(uploadBase, { recursive: true });

// Configure multer for certificate uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadBase);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cert-' + uniqueSuffix + path.extname(file.originalname));
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

// Issue certificate endpoint
router.post('/certificate', upload.single('certificate'), async (req, res) => {
  try {
    const { issuerId, issuerName, recipientName, certificateType, issuerNameSelected } = req.body;
    const noiseDefense = String(req.body.noiseDefense || 'false') === 'true';
    const certificateFile = req.file;

    if (!certificateFile) {
      return res.status(400).json({ 
        error: 'No certificate file provided' 
      });
    }

    if (!issuerId || !issuerName || !recipientName || !certificateType) {
      return res.status(400).json({ 
        error: 'Missing required fields: issuerId, issuerName, recipientName, certificateType' 
      });
    }

    // Step 0: Load selected authority (simulation)
    const fs = require('fs');
    const path = require('path');
    const registryPath = path.join(__dirname, '..', 'storage', 'registry.json');
    let authority = null;
    if (issuerNameSelected) {
      try {
        const list = JSON.parse(fs.readFileSync(registryPath, 'utf8'));
        authority = list.find(a => a.name === issuerNameSelected) || null;
      } catch (e) {
        // ignore, optional
      }
    }

    // Step 1: Generate hash of the certificate
    const certificateHash = await generateHash(certificateFile.path);
    console.log('📋 Certificate hash generated:', certificateHash);

    // Step 2: Create digital signature (sign file hash)
    // If authority name is chosen, use its issuerId aliasing
    const signerId = authority ? authority.name : issuerId;
    const signature = await cryptoService.signData(certificateHash, signerId);
    console.log('🔐 Digital signature created');

    // Step 3: Store combined hash on blockchain (fileHash + signatureHash)
    const combinedHash = generateCombinedHash(certificateHash, signature);
    const blockchainResult = await blockchainService.storeHash(combinedHash, issuerId);
    console.log('⛓️ Hash stored on blockchain:', blockchainResult.transactionHash);

    // Step 4: Embed data via steganography (PNG/JPEG) or placeholder for PDF
    const payload = {
      transactionHash: blockchainResult.transactionHash,
      signature: signature,
      certificateHash,
      combinedHash,
      issuerId: signerId,
      timestamp: new Date().toISOString()
    };

    const isPdf = certificateFile.mimetype === 'application/pdf' || path.extname(certificateFile.originalname).toLowerCase() === '.pdf';
    let embeddedFilePath;
    if (isPdf) {
      embeddedFilePath = await stegoService.embedDataInPDF(certificateFile.path, payload);
    } else {
      embeddedFilePath = await stegoService.embedData(certificateFile.path, payload, { noiseDefense });
    }
    console.log('🕵️ Data embedded via steganography');

    // Step 5: Generate QR code (optional)
    const qrCodeData = {
      transactionHash: blockchainResult.transactionHash,
      certificateHash: certificateHash,
      combinedHash,
      issuerId: signerId,
      verificationUrl: `${req.protocol}://${req.get('host')}/api/verify/${certificateHash}`
    };

    res.json({
      success: true,
      message: 'Certificate issued successfully',
      data: {
        certificateHash,
        transactionHash: blockchainResult.transactionHash,
        signature,
        combinedHash,
        issuerId: signerId,
        recipientName,
        certificateType,
        issuedAt: new Date().toISOString(),
        verificationUrl: qrCodeData.verificationUrl,
        qrCodeData,
        embeddedFilePath,
        noiseDefense
      }
    });

  } catch (error) {
    console.error('❌ Error issuing certificate:', error);
    res.status(500).json({ 
      error: 'Failed to issue certificate',
      message: error.message 
    });
  }
});

// Get issuer public key endpoint
router.get('/issuer/:issuerId/public-key', async (req, res) => {
  try {
    const { issuerId } = req.params;
    const publicKey = await cryptoService.getPublicKey(issuerId);
    
    res.json({
      success: true,
      issuerId,
      publicKey
    });
  } catch (error) {
    console.error('❌ Error getting public key:', error);
    res.status(500).json({ 
      error: 'Failed to get public key',
      message: error.message 
    });
  }
});

// Generate new issuer key pair endpoint
router.post('/issuer/generate-keys', async (req, res) => {
  try {
    const { issuerId, issuerName } = req.body;
    
    if (!issuerId || !issuerName) {
      return res.status(400).json({ 
        error: 'Missing required fields: issuerId, issuerName' 
      });
    }

    const keyPair = await cryptoService.generateKeyPair(issuerId, issuerName);
    
    res.json({
      success: true,
      message: 'Key pair generated successfully',
      issuerId,
      publicKey: keyPair.publicKey,
      // Note: Private key should be stored securely and not returned
      keyGeneratedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error generating key pair:', error);
    res.status(500).json({ 
      error: 'Failed to generate key pair',
      message: error.message 
    });
  }
});

module.exports = router;
