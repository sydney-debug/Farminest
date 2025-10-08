const express = require('express');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { query, transaction } = require('../models/database');
const { generateToken, authenticate } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  fullName: Joi.string().min(2).required(),
  phone: Joi.string().optional(),
  userType: Joi.string().valid('farmer', 'vet').required(),
  clinicName: Joi.string().when('userType', {
    is: 'vet',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  specialization: Joi.string().when('userType', {
    is: 'vet',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  licenseNumber: Joi.string().when('userType', {
    is: 'vet',
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  address: Joi.string().optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      email,
      password,
      fullName,
      phone,
      userType,
      clinicName,
      specialization,
      licenseNumber,
      address
    } = value;

    // Check if user already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Start transaction
    const result = await transaction(async (client) => {
      // Create user
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, full_name, phone, user_type)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id`,
        [email, passwordHash, fullName, phone, userType]
      );

      const userId = userResult.rows[0].id;

      // If vet, create veterinarian record
      if (userType === 'vet') {
        await client.query(
          `INSERT INTO veterinarians (user_id, clinic_name, specialization, license_number, address)
           VALUES ($1, $2, $3, $4, $5)`,
          [userId, clinicName, specialization, licenseNumber, address]
        );
      }

      return userId;
    });

    // Generate token
    const token = generateToken({
      userId: result,
      email,
      userType
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: result,
        email,
        fullName,
        userType
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = value;

    // Get user with password hash
    const user = await query(
      'SELECT id, email, password_hash, full_name, user_type FROM users WHERE email = $1',
      [email]
    );

    if (user.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const userData = user.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken({
      userId: userData.id,
      email: userData.email,
      userType: userData.user_type
    });

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: userData.id,
        email: userData.email,
        fullName: userData.full_name,
        userType: userData.user_type
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get current user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    let profileData = {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      userType: req.user.user_type,
      phone: req.user.phone
    };

    // If vet, get additional vet information
    if (req.user.user_type === 'vet') {
      const vetData = await query(
        `SELECT clinic_name, specialization, license_number, address, rating, is_available
         FROM veterinarians WHERE user_id = $1`,
        [req.user.id]
      );

      if (vetData.rows.length > 0) {
        profileData = { ...profileData, ...vetData.rows[0] };
      }
    }

    res.json({
      success: true,
      user: profileData
    });

  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { fullName, phone, clinicName, specialization, licenseNumber, address } = req.body;

    // Update basic user info
    await query(
      'UPDATE users SET full_name = $1, phone = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [fullName, phone, req.user.id]
    );

    // If vet, update veterinarian info
    if (req.user.user_type === 'vet') {
      await query(
        `UPDATE veterinarians
         SET clinic_name = $1, specialization = $2, license_number = $3, address = $4, updated_at = CURRENT_TIMESTAMP
         WHERE user_id = $5`,
        [clinicName, specialization, licenseNumber, address, req.user.id]
      );
    }

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
