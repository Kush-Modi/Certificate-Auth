const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class ApiError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  const config = {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.message || `HTTP error! status: ${response.status}`,
        response.status,
        errorData
      );
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error.message || 'Network error occurred',
      0,
      null
    );
  }
};

// Certificate Issuing APIs
export const generateKeyPair = async (issuerId, issuerName) => {
  return apiRequest('/issue/issuer/generate-keys', {
    method: 'POST',
    body: JSON.stringify({ issuerId, issuerName }),
  });
};

export const issueCertificate = async (formData) => {
  return apiRequest('/issue/certificate', {
    method: 'POST',
    headers: {
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData,
  });
};

export const getIssuerPublicKey = async (issuerId) => {
  return apiRequest(`/issue/issuer/${issuerId}/public-key`);
};

// Certificate Verification APIs
export const verifyCertificate = async (formData) => {
  return apiRequest('/verify/certificate', {
    method: 'POST',
    headers: {
      // Don't set Content-Type for FormData, let browser set it with boundary
    },
    body: formData,
  });
};

export const verifyHash = async (hash) => {
  return apiRequest(`/verify/hash/${hash}`);
};

export const verifyTransaction = async (transactionHash) => {
  return apiRequest(`/verify/transaction/${transactionHash}`);
};

export const getVerificationStats = async () => {
  return apiRequest('/verify/stats');
};

// Health Check API
export const healthCheck = async () => {
  return apiRequest('/health');
};

// Utility functions
export const formatHash = (hash, length = 16) => {
  if (!hash) return 'N/A';
  return `${hash.substring(0, length)}...${hash.substring(hash.length - length)}`;
};

export const formatTransactionHash = (txHash, length = 16) => {
  if (!txHash) return 'N/A';
  return `${txHash.substring(0, length)}...${txHash.substring(txHash.length - length)}`;
};

export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch (err) {
      return false;
    } finally {
      document.body.removeChild(textArea);
    }
  }
};

export const downloadFile = (data, filename, type = 'application/json') => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export const generateQRCodeData = (certificateData) => {
  return {
    type: 'certificate',
    hash: certificateData.certificateHash,
    transactionHash: certificateData.transactionHash,
    issuerId: certificateData.issuerId,
    verificationUrl: certificateData.verificationUrl,
    timestamp: new Date().toISOString()
  };
};

export const validateHash = (hash) => {
  return /^[a-f0-9]{64}$/i.test(hash);
};

export const validateTransactionHash = (txHash) => {
  return /^0x[a-f0-9]{64}$/i.test(txHash);
};

export const validateIssuerId = (issuerId) => {
  return /^[a-zA-Z0-9-_]+$/.test(issuerId) && issuerId.length >= 3 && issuerId.length <= 50;
};

// Error handling utilities
export const getErrorMessage = (error) => {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isNetworkError = (error) => {
  return error instanceof ApiError && error.status === 0;
};

export const isServerError = (error) => {
  return error instanceof ApiError && error.status >= 500;
};

export const isClientError = (error) => {
  return error instanceof ApiError && error.status >= 400 && error.status < 500;
};

// API configuration
export const setApiBaseUrl = (url) => {
  // This would typically be used in a configuration context
  // For now, we'll use environment variables
  console.log('API Base URL:', API_BASE_URL);
};

export const getApiBaseUrl = () => {
  return API_BASE_URL;
};

// Request interceptors (for future use with authentication, etc.)
export const addRequestInterceptor = (interceptor) => {
  // Implementation for request interceptors
  console.log('Request interceptor added:', interceptor);
};

export const addResponseInterceptor = (interceptor) => {
  // Implementation for response interceptors
  console.log('Response interceptor added:', interceptor);
};

export default {
  generateKeyPair,
  issueCertificate,
  getIssuerPublicKey,
  verifyCertificate,
  verifyHash,
  verifyTransaction,
  getVerificationStats,
  healthCheck,
  formatHash,
  formatTransactionHash,
  copyToClipboard,
  downloadFile,
  generateQRCodeData,
  validateHash,
  validateTransactionHash,
  validateIssuerId,
  getErrorMessage,
  isNetworkError,
  isServerError,
  isClientError,
  setApiBaseUrl,
  getApiBaseUrl,
  addRequestInterceptor,
  addResponseInterceptor
};
