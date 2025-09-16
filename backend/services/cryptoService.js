const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class CryptoService {
  constructor() {
    this.keyStoragePath = path.join(__dirname, '../storage/keys');
    this.ensureKeyStorageExists();
  }

  ensureKeyStorageExists() {
    if (!fs.existsSync(this.keyStoragePath)) {
      fs.mkdirSync(this.keyStoragePath, { recursive: true });
    }
  }

  /**
   * Generate a new RSA key pair for an issuer
   * @param {string} issuerId - Unique identifier for the issuer
   * @param {string} issuerName - Name of the issuer
   * @returns {Object} Key pair with public and private keys
   */
  async generateKeyPair(issuerId, issuerName) {
    try {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: {
          type: 'spki',
          format: 'pem'
        },
        privateKeyEncoding: {
          type: 'pkcs8',
          format: 'pem'
        }
      });

      // Store keys securely
      const keyData = {
        issuerId,
        issuerName,
        publicKey,
        privateKey,
        createdAt: new Date().toISOString(),
        algorithm: 'RSA-2048'
      };

      const keyFilePath = path.join(this.keyStoragePath, `${issuerId}.json`);
      fs.writeFileSync(keyFilePath, JSON.stringify(keyData, null, 2));

      console.log(`✅ Key pair generated for issuer: ${issuerId}`);
      
      return {
        issuerId,
        issuerName,
        publicKey,
        keyGeneratedAt: keyData.createdAt
      };
    } catch (error) {
      console.error('❌ Error generating key pair:', error);
      throw new Error('Failed to generate key pair');
    }
  }

  /**
   * Get public key for an issuer
   * @param {string} issuerId - Unique identifier for the issuer
   * @returns {string} Public key in PEM format
   */
  async getPublicKey(issuerId) {
    try {
      const keyFilePath = path.join(this.keyStoragePath, `${issuerId}.json`);
      
      if (!fs.existsSync(keyFilePath)) {
        throw new Error(`No key pair found for issuer: ${issuerId}`);
      }

      const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      return keyData.publicKey;
    } catch (error) {
      console.error('❌ Error getting public key:', error);
      throw new Error(`Failed to get public key for issuer: ${issuerId}`);
    }
  }

  /**
   * Get private key for an issuer
   * @param {string} issuerId - Unique identifier for the issuer
   * @returns {string} Private key in PEM format
   */
  async getPrivateKey(issuerId) {
    try {
      const keyFilePath = path.join(this.keyStoragePath, `${issuerId}.json`);
      
      if (!fs.existsSync(keyFilePath)) {
        throw new Error(`No key pair found for issuer: ${issuerId}`);
      }

      const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
      return keyData.privateKey;
    } catch (error) {
      console.error('❌ Error getting private key:', error);
      throw new Error(`Failed to get private key for issuer: ${issuerId}`);
    }
  }

  /**
   * Sign data with issuer's private key
   * @param {string} data - Data to be signed
   * @param {string} issuerId - Unique identifier for the issuer
   * @returns {string} Digital signature in base64 format
   */
  async signData(data, issuerId) {
    try {
      const privateKey = await this.getPrivateKey(issuerId);
      
      const sign = crypto.createSign('SHA256');
      sign.update(data);
      sign.end();
      
      const signature = sign.sign(privateKey, 'base64');
      
      console.log(`✅ Data signed with issuer key: ${issuerId}`);
      return signature;
    } catch (error) {
      console.error('❌ Error signing data:', error);
      throw new Error('Failed to sign data');
    }
  }

  /**
   * Verify digital signature
   * @param {string} data - Original data
   * @param {string} signature - Digital signature in base64 format
   * @param {string} issuerId - Unique identifier for the issuer
   * @returns {Object} Verification result
   */
  async verifySignature(data, signature, issuerId) {
    try {
      const publicKey = await this.getPublicKey(issuerId);
      
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();
      
      const isValid = verify.verify(publicKey, signature, 'base64');
      
      return {
        valid: isValid,
        issuerId,
        algorithm: 'RSA-SHA256',
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error verifying signature:', error);
      return {
        valid: false,
        issuerId,
        error: error.message,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Verify digital signature with provided public key
   * @param {string} data - Original data
   * @param {string} signature - Base64 signature
   * @param {string} publicKeyPem - PEM public key
   * @returns {Object} Verification result
   */
  async verifySignatureWithPublicKey(data, signature, publicKeyPem) {
    try {
      const verify = crypto.createVerify('SHA256');
      verify.update(data);
      verify.end();
      const isValid = verify.verify(publicKeyPem, signature, 'base64');
      return {
        valid: isValid,
        algorithm: 'RSA-SHA256',
        verifiedAt: new Date().toISOString()
      };
    } catch (error) {
      return {
        valid: false,
        error: error.message,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * List all available issuers
   * @returns {Array} List of issuer information
   */
  async listIssuers() {
    try {
      const files = fs.readdirSync(this.keyStoragePath);
      const issuers = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const keyFilePath = path.join(this.keyStoragePath, file);
          const keyData = JSON.parse(fs.readFileSync(keyFilePath, 'utf8'));
          
          issuers.push({
            issuerId: keyData.issuerId,
            issuerName: keyData.issuerName,
            createdAt: keyData.createdAt,
            algorithm: keyData.algorithm
          });
        }
      }

      return issuers;
    } catch (error) {
      console.error('❌ Error listing issuers:', error);
      return [];
    }
  }

  /**
   * Delete issuer key pair
   * @param {string} issuerId - Unique identifier for the issuer
   * @returns {boolean} Success status
   */
  async deleteIssuer(issuerId) {
    try {
      const keyFilePath = path.join(this.keyStoragePath, `${issuerId}.json`);
      
      if (fs.existsSync(keyFilePath)) {
        fs.unlinkSync(keyFilePath);
        console.log(`✅ Key pair deleted for issuer: ${issuerId}`);
        return true;
      } else {
        console.log(`⚠️ No key pair found for issuer: ${issuerId}`);
        return false;
      }
    } catch (error) {
      console.error('❌ Error deleting issuer:', error);
      return false;
    }
  }
}

module.exports = new CryptoService();
