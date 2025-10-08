// Farm360 Pro - API Configuration

// API Configuration - Update these URLs for your deployment
const API_CONFIG = {
  // For local development (when running backend locally)
  development: {
    baseUrl: 'http://localhost:5000/api',
    wsUrl: 'ws://localhost:5000'
  },

  // For production (when backend is deployed)
  production: {
    // Update this with your deployed backend URL
    baseUrl: 'https://your-backend-url.com/api',
    wsUrl: 'wss://your-backend-url.com'
  }
};

// Determine environment
const isProduction = window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

// Export configuration
const config = isProduction ? API_CONFIG.production : API_CONFIG.development;

export { config as API_CONFIG };

// Also export for direct use
export const API_BASE_URL = config.baseUrl;
