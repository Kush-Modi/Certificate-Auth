const { ethers } = require('ethers');

// Blockchain configuration
const BLOCKCHAIN_CONFIG = {
  // Polygon Mumbai Testnet
  polygon: {
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    name: 'Polygon Mumbai'
  },
  
  // Ethereum Sepolia Testnet
  ethereum: {
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    chainId: 11155111,
    name: 'Ethereum Sepolia'
  }
};

// Smart contract configuration
const CONTRACT_CONFIG = {
  // Certificate Registry Contract (placeholder)
  address: '0x0000000000000000000000000000000000000000', // Replace with actual contract address
  abi: [
    // Add contract ABI here
    'function storeHash(bytes32 hash, string memory issuerId) public',
    'function verifyHash(bytes32 hash) public view returns (bool)',
    'function getIssuer(bytes32 hash) public view returns (string memory)'
  ]
};

// Wallet configuration
const WALLET_CONFIG = {
  privateKey: process.env.PRIVATE_KEY || '', // Store in environment variables
  mnemonic: process.env.MNEMONIC || '' // Store in environment variables
};

class BlockchainService {
  constructor(network = 'polygon') {
    this.network = network;
    this.config = BLOCKCHAIN_CONFIG[network];
    this.provider = null;
    this.wallet = null;
    this.contract = null;
  }

  async initialize() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(this.config.rpcUrl);
      
      // Initialize wallet
      if (WALLET_CONFIG.privateKey) {
        this.wallet = new ethers.Wallet(WALLET_CONFIG.privateKey, this.provider);
      } else if (WALLET_CONFIG.mnemonic) {
        this.wallet = ethers.Wallet.fromMnemonic(WALLET_CONFIG.mnemonic).connect(this.provider);
      }
      
      // Initialize contract
      if (this.wallet && CONTRACT_CONFIG.address !== '0x0000000000000000000000000000000000000000') {
        this.contract = new ethers.Contract(
          CONTRACT_CONFIG.address,
          CONTRACT_CONFIG.abi,
          this.wallet
        );
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
  CONTRACT_CONFIG,
  WALLET_CONFIG
};
