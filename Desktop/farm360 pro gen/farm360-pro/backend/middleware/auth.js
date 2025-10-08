const jwt = require('jsonwebtoken');
const { query } = require('../models/database');

// JWT secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Generate JWT token
const generateToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

// Verify JWT token
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid token');
  }
};

// Middleware to authenticate requests
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = verifyToken(token);

    // Get user from database to ensure they still exist and are active
    const user = await query(
      'SELECT id, email, full_name, user_type FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token is valid but user no longer exists.'
      });
    }

    req.user = user.rows[0];
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid token.'
    });
  }
};

// Middleware to check if user is a farmer
const requireFarmer = (req, res, next) => {
  if (req.user.user_type !== 'farmer') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Farmer role required.'
    });
  }
  next();
};

// Middleware to check if user is a vet
const requireVet = (req, res, next) => {
  if (req.user.user_type !== 'vet') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Veterinarian role required.'
    });
  }
  next();
};

// Middleware to check if user owns the resource or is admin
const requireOwnership = (resourceUserIdField = 'farmer_id') => {
  return (req, res, next) => {
    if (req.user.user_type === 'vet') {
      // Vets can access any resource
      return next();
    }

    if (req.user.id !== req.body[resourceUserIdField] && req.user.id !== req.params[resourceUserIdField]) {
      // Check if the field exists in body or params
      const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

      if (req.user.id !== resourceUserId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own resources.'
        });
      }
    }

    next();
  };
};

module.exports = {
  generateToken,
  verifyToken,
  authenticate,
  requireFarmer,
  requireVet,
  requireOwnership
};
