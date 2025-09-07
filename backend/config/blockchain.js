const { ethers } = require('ethers');

// Load env
require('dotenv').config();

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  // Polygon Mumbai Testnet (preferred)
  polygon: {
    rpcUrl: process.env.MUMBAI_RPC_URL || 'https://polygon-mumbai.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 80001,
    name: 'Polygon Mumbai'
  },
  // Ethereum Sepolia Testnet (optional)
  ethereum: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 11155111,
    name: 'Ethereum Sepolia'
  }
};

// Wallet configuration
const WALLET_CONFIG = {
  privateKey: process.env.PRIVATE_KEY || '', // NEVER hardcode; set via env
  mnemonic: process.env.MNEMONIC || ''
};

class BlockchainService {
  constructor(network = 'polygon') {
    this.network = network;
    this.config = BLOCKCHAIN_CONFIG[network];
    this.provider = null;
    this.wallet = null;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);

      // Initialize wallet if provided
      if (WALLET_CONFIG.privateKey) {
        this.wallet = new ethers.Wallet(WALLET_CONFIG.privateKey, this.provider);
      } else if (WALLET_CONFIG.mnemonic) {
        this.wallet = ethers.Wallet.fromPhrase(WALLET_CONFIG.mnemonic).connect(this.provider);
      } else {
        console.warn('⚠️ No PRIVATE_KEY or MNEMONIC set. Read-only blockchain operations only.');
      }

      console.log(`✅ Blockchain service initialized for ${this.config.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize blockchain service:', error);
      return false;
    }
  }

  async getNetworkInfo() {
    if (!this.provider) return null;

    try {
      const network = await this.provider.getNetwork();
      const blockNumber = await this.provider.getBlockNumber();

      return {
        name: network.name,
        chainId: network.chainId.toString(),
        blockNumber,
        rpcUrl: this.config.rpcUrl
      };
    } catch (error) {
      console.error('Error getting network info:', error);
      return null;
    }
  }
}

module.exports = {
  BlockchainService,
  BLOCKCHAIN_CONFIG,
  WALLET_CONFIG
};
