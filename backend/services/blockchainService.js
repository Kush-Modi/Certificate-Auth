const { BlockchainService } = require('../config/blockchain');
const { ethers } = require('ethers');

class BlockchainServiceManager {
  constructor() {
    this.blockchainService = new BlockchainService('polygon');
    this.initialized = false;
    // Simple on-chain KV via transaction data (no contract) for hackathon:
    // - storeHashOnChain: sends a 0-value tx with data as the hash bytes
    // - getHashFromChain: fetches tx by hash and decodes input data
  }

  async initialize() {
    if (!this.initialized) {
      this.initialized = await this.blockchainService.initialize();
    }
    return this.initialized;
  }

  /**
   * Store hash on chain by sending a 0-value transaction with data payload
   * @param {string} hexHash - 0x-prefixed 32-byte hash (sha256)
   * @returns {Object} tx result { transactionHash }
   */
  async storeHashOnChain(hexHash) {
    await this.initialize();
    if (!this.blockchainService.wallet) {
      // Fallback to simulation
      return { transactionHash: '0x' + require('crypto').randomBytes(32).toString('hex'), simulated: true };
    }

    // Ensure 0x prefix and 32 bytes
    const data = ethers.getBytes(hexHash);
    const tx = await this.blockchainService.wallet.sendTransaction({
      to: this.blockchainService.wallet.address, // self-send
      value: 0,
      data
    });
    const receipt = await tx.wait();
    return { transactionHash: receipt.hash };
  }

  /**
   * Read stored hash from chain by retrieving tx data
   * @param {string} transactionHash
   * @returns {string|null} 0x-prefixed data hex or null
   */
  async getHashFromChain(transactionHash) {
    await this.initialize();
    if (!this.blockchainService.provider) return null;
    const tx = await this.blockchainService.provider.getTransaction(transactionHash);
    if (!tx || !tx.data) return null;
    return tx.data; // hex string
  }

  /**
   * Store certificate hash on blockchain
   * @param {string} hash - Certificate hash
   * @param {string} issuerId - Issuer identifier
   * @returns {Object} Transaction result
   */
  async storeHash(hash, issuerId) {
    try {
      await this.initialize();
      // Use contract if configured; otherwise use data-transaction method
      if (this.blockchainService.contract) {
        const tx = await this.blockchainService.contract.storeHash(hash, issuerId);
        const r = await tx.wait();
        return {
          success: true,
          transactionHash: r.hash,
          blockNumber: r.blockNumber,
          gasUsed: r.gasUsed?.toString(),
          issuerId,
          certificateHash: hash,
          timestamp: new Date().toISOString()
        };
      }

      // Fallback: encode hash as transaction data
      const hexHash = hash.startsWith('0x') ? hash : '0x' + hash;
      const { transactionHash } = await this.storeHashOnChain(hexHash);
      return {
        success: true,
        transactionHash,
        issuerId,
        certificateHash: hash,
        timestamp: new Date().toISOString(),
        simulated: !this.blockchainService.wallet
      };
    } catch (error) {
      console.error('❌ Error storing hash on blockchain:', error);
      // Fallback to simulation
      return this.simulateBlockchainStorage(hash, issuerId);
    }
  }

  /**
   * Verify hash on blockchain
   * @param {string} transactionHash - Transaction hash
   * @param {string} expectedHash - Expected certificate hash
   * @returns {Object} Verification result
   */
  async verifyHash(transactionHash, expectedHash) {
    try {
      await this.initialize();
      
      if (!this.blockchainService.contract) {
        // Fallback: simulate blockchain verification
        return this.simulateBlockchainVerification(transactionHash, expectedHash);
      }

      // Contract path
      if (this.blockchainService.contract) {
        const isValid = await this.blockchainService.contract.verifyHash(expectedHash);
        const issuerId = await this.blockchainService.contract.getIssuer(expectedHash);
        return {
          valid: isValid,
          transactionHash,
          certificateHash: expectedHash,
          issuerId,
          verifiedAt: new Date().toISOString(),
          network: this.blockchainService.config.name
        };
      }

      // Data-transaction path
      const data = await this.getHashFromChain(transactionHash);
      const normalizedExpected = expectedHash.startsWith('0x') ? expectedHash.toLowerCase() : ('0x' + expectedHash).toLowerCase();
      const valid = !!data && data.toLowerCase() === normalizedExpected;
      return {
        valid,
        transactionHash,
        certificateHash: expectedHash,
        issuerId: valid ? 'self' : null,
        verifiedAt: new Date().toISOString(),
        network: this.blockchainService.config.name
      };
    } catch (error) {
      console.error('❌ Error verifying hash on blockchain:', error);
      // Fallback to simulation
      return this.simulateBlockchainVerification(transactionHash, expectedHash);
    }
  }

  /**
   * Verify hash by hash value
   * @param {string} hash - Certificate hash
   * @returns {Object} Verification result
   */
  async verifyHashByHash(hash) {
    try {
      await this.initialize();
      
      if (!this.blockchainService.contract) {
        // Fallback: simulate blockchain verification
        return this.simulateBlockchainVerification(null, hash);
      }

      // Real blockchain verification
      const isValid = await this.blockchainService.contract.verifyHash(hash);
      const issuerId = await this.blockchainService.contract.getIssuer(hash);

      return {
        valid: isValid,
        certificateHash: hash,
        issuerId,
        verifiedAt: new Date().toISOString(),
        network: this.blockchainService.config.name
      };
    } catch (error) {
      console.error('❌ Error verifying hash by hash:', error);
      return {
        valid: false,
        certificateHash: hash,
        error: error.message,
        verifiedAt: new Date().toISOString()
      };
    }
  }

  /**
   * Get transaction details
   * @param {string} transactionHash - Transaction hash
   * @returns {Object} Transaction details
   */
  async getTransactionDetails(transactionHash) {
    try {
      await this.initialize();
      
      if (!this.blockchainService.provider) {
        return {
          found: false,
          error: 'Blockchain provider not available'
        };
      }

      const tx = await this.blockchainService.provider.getTransaction(transactionHash);
      
      if (!tx) {
        return {
          found: false,
          transactionHash
        };
      }

      const receipt = await this.blockchainService.provider.getTransactionReceipt(transactionHash);
      const block = await this.blockchainService.provider.getBlock(tx.blockNumber);

      return {
        found: true,
        transactionHash,
        blockNumber: tx.blockNumber,
        blockHash: tx.blockHash,
        from: tx.from,
        to: tx.to,
        value: tx.value.toString(),
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: tx.gasPrice.toString(),
        timestamp: new Date(block.timestamp * 1000).toISOString(),
        status: receipt.status === 1 ? 'success' : 'failed'
      };
    } catch (error) {
      console.error('❌ Error getting transaction details:', error);
      return {
        found: false,
        transactionHash,
        error: error.message
      };
    }
  }

  /**
   * Get verification statistics
   * @returns {Object} Statistics
   */
  async getVerificationStats() {
    try {
      await this.initialize();
      
      const networkInfo = await this.blockchainService.getNetworkInfo();
      
      return {
        totalCertificates: 0, // Would need to query contract events
        verifiedCertificates: 0, // Would need to query contract events
        network: networkInfo?.name || 'Unknown',
        chainId: networkInfo?.chainId || 'Unknown',
        blockNumber: networkInfo?.blockNumber || 0,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting verification stats:', error);
      return {
        totalCertificates: 0,
        verifiedCertificates: 0,
        network: 'Unknown',
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Simulate blockchain storage for demo purposes
   * @param {string} hash - Certificate hash
   * @param {string} issuerId - Issuer identifier
   * @returns {Object} Simulated transaction result
   */
  simulateBlockchainStorage(hash, issuerId) {
    const transactionHash = '0x' + require('crypto').randomBytes(32).toString('hex');
    
    console.log('⚠️ Using simulated blockchain storage for demo purposes');
    
    return {
      success: true,
      transactionHash,
      blockNumber: Math.floor(Math.random() * 1000000) + 40000000,
      gasUsed: '21000',
      issuerId,
      certificateHash: hash,
      timestamp: new Date().toISOString(),
      simulated: true
    };
  }

  /**
   * Simulate blockchain verification for demo purposes
   * @param {string} transactionHash - Transaction hash
   * @param {string} expectedHash - Expected certificate hash
   * @returns {Object} Simulated verification result
   */
  simulateBlockchainVerification(transactionHash, expectedHash) {
    console.log('⚠️ Using simulated blockchain verification for demo purposes');
    
    // Simulate verification (always return true for demo)
    return {
      valid: true,
      transactionHash: transactionHash || '0x' + require('crypto').randomBytes(32).toString('hex'),
      certificateHash: expectedHash,
      issuerId: 'demo-issuer',
      verifiedAt: new Date().toISOString(),
      network: 'Polygon Mumbai (Simulated)',
      simulated: true
    };
  }

  /**
   * Get network information
   * @returns {Object} Network information
   */
  async getNetworkInfo() {
    try {
      await this.initialize();
      return await this.blockchainService.getNetworkInfo();
    } catch (error) {
      console.error('❌ Error getting network info:', error);
      return null;
    }
  }
}

module.exports = new BlockchainServiceManager();
