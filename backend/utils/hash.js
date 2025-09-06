const crypto = require('crypto');
const fs = require('fs');

/**
 * Generate SHA-256 hash of a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<string>} SHA-256 hash in hexadecimal format
 */
async function generateHash(filePath) {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      hash.update(data);
    });

    stream.on('end', () => {
      const fileHash = hash.digest('hex');
      resolve(fileHash);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate SHA-256 hash of a string
 * @param {string} data - String data to hash
 * @returns {string} SHA-256 hash in hexadecimal format
 */
function generateStringHash(data) {
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Generate SHA-256 hash of a buffer
 * @param {Buffer} buffer - Buffer data to hash
 * @returns {string} SHA-256 hash in hexadecimal format
 */
function generateBufferHash(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Verify file integrity by comparing hashes
 * @param {string} filePath - Path to the file
 * @param {string} expectedHash - Expected hash value
 * @returns {Promise<Object>} Verification result
 */
async function verifyFileIntegrity(filePath, expectedHash) {
  try {
    const actualHash = await generateHash(filePath);
    const isValid = actualHash === expectedHash;

    return {
      valid: isValid,
      expectedHash,
      actualHash,
      filePath,
      verifiedAt: new Date().toISOString()
    };
  } catch (error) {
    return {
      valid: false,
      expectedHash,
      actualHash: null,
      filePath,
      error: error.message,
      verifiedAt: new Date().toISOString()
    };
  }
}

/**
 * Generate hash with salt for additional security
 * @param {string} data - Data to hash
 * @param {string} salt - Salt value
 * @returns {string} Salted hash in hexadecimal format
 */
function generateSaltedHash(data, salt) {
  return crypto.createHash('sha256').update(data + salt).digest('hex');
}

/**
 * Generate HMAC-SHA256 hash
 * @param {string} data - Data to hash
 * @param {string} secret - Secret key
 * @returns {string} HMAC-SHA256 hash in hexadecimal format
 */
function generateHMAC(data, secret) {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Generate multiple hash types for a file
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Object containing different hash types
 */
async function generateMultipleHashes(filePath) {
  return new Promise((resolve, reject) => {
    const hashes = {
      sha256: crypto.createHash('sha256'),
      sha1: crypto.createHash('sha1'),
      md5: crypto.createHash('md5')
    };

    const stream = fs.createReadStream(filePath);

    stream.on('data', (data) => {
      Object.values(hashes).forEach(hash => hash.update(data));
    });

    stream.on('end', () => {
      const result = {
        sha256: hashes.sha256.digest('hex'),
        sha1: hashes.sha1.digest('hex'),
        md5: hashes.md5.digest('hex'),
        filePath,
        generatedAt: new Date().toISOString()
      };
      resolve(result);
    });

    stream.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Generate hash of certificate metadata
 * @param {Object} metadata - Certificate metadata
 * @returns {string} SHA-256 hash of metadata
 */
function generateMetadataHash(metadata) {
  const metadataString = JSON.stringify(metadata, Object.keys(metadata).sort());
  return generateStringHash(metadataString);
}

/**
 * Validate hash format
 * @param {string} hash - Hash to validate
 * @param {string} algorithm - Hash algorithm (sha256, sha1, md5)
 * @returns {Object} Validation result
 */
function validateHashFormat(hash, algorithm = 'sha256') {
  const patterns = {
    sha256: /^[a-f0-9]{64}$/i,
    sha1: /^[a-f0-9]{40}$/i,
    md5: /^[a-f0-9]{32}$/i
  };

  const pattern = patterns[algorithm.toLowerCase()];
  const isValid = pattern ? pattern.test(hash) : false;

  return {
    valid: isValid,
    hash,
    algorithm,
    expectedLength: algorithm === 'sha256' ? 64 : algorithm === 'sha1' ? 40 : 32,
    actualLength: hash.length
  };
}

module.exports = {
  generateHash,
  generateStringHash,
  generateBufferHash,
  verifyFileIntegrity,
  generateSaltedHash,
  generateHMAC,
  generateMultipleHashes,
  generateMetadataHash,
  validateHashFormat
};
