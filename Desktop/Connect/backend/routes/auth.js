/**
 * Authentication Routes for FarmTrak 360
 * Handles user registration, login, and profile management
 */

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

/**
 * User registration endpoint
 * POST /api/auth/register
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('full_name').trim().isLength({ min: 2 }).withMessage('Full name is required'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('farm_role').optional().isIn(['farmer', 'vet', 'agrovet', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password, full_name, phone, farm_role = 'farmer' } = req.body;

    // Get Supabase client from app
    const supabase = req.app.get('supabase');

    try {
        // Check if user already exists
        const { data: existingUser } = await supabase
            .from('user_profiles')
            .select('id')
            .eq('email', email)
            .single();

        if (existingUser) {
            throw new ValidationError('User already exists with this email');
        }

        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name,
                    phone,
                    farm_role
                }
            }
        });

        if (authError) {
            throw new ValidationError(authError.message);
        }

        // The user profile will be created automatically by the database trigger
        // But we need to update it with additional information
        if (authData.user) {
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                    full_name,
                    phone,
                    farm_role,
                    avatar_url: null
                })
                .eq('id', authData.user.id);

            if (updateError) {
                console.error('Error updating user profile:', updateError);
            }
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: authData.user.id, email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: authData.user.id,
                email: authData.user.email,
                full_name,
                phone,
                farm_role
            },
            token,
            requiresEmailConfirmation: !authData.session // If no session, email confirmation needed
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Registration failed');
    }
}));

/**
 * User login endpoint
 * POST /api/auth/login
 */
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { email, password } = req.body;

    // Get Supabase client from app
    const supabase = req.app.get('supabase');

    try {
        // Sign in with Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (authError) {
            throw new ValidationError('Invalid email or password');
        }

        // Get user profile
        const { data: user, error: userError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', authData.user.id)
            .single();

        if (userError || !user) {
            throw new ValidationError('User profile not found');
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                farm_role: user.farm_role,
                avatar_url: user.avatar_url
            },
            token
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Login failed');
    }
}));

/**
 * Get current user profile
 * GET /api/auth/profile
 */
router.get('/profile', authenticateToken, asyncHandler(async (req, res) => {
    res.status(200).json({
        user: {
            id: req.user.id,
            email: req.user.email,
            full_name: req.user.full_name,
            phone: req.user.phone,
            farm_role: req.user.farm_role,
            avatar_url: req.user.avatar_url,
            created_at: req.user.created_at,
            updated_at: req.user.updated_at
        }
    });
}));

/**
 * Update user profile
 * PUT /api/auth/profile
 */
router.put('/profile', authenticateToken, [
    body('full_name').optional().trim().isLength({ min: 2 }).withMessage('Full name must be at least 2 characters'),
    body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('farm_role').optional().isIn(['farmer', 'vet', 'agrovet', 'admin']).withMessage('Invalid role')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { full_name, phone, farm_role } = req.body;

    // Get Supabase client from app
    const supabase = req.app.get('supabase');

    try {
        // Update user profile
        const { data: updatedUser, error } = await supabase
            .from('user_profiles')
            .update({
                ...(full_name && { full_name }),
                ...(phone && { phone }),
                ...(farm_role && { farm_role }),
                updated_at: new Date().toISOString()
            })
            .eq('id', req.user.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update profile');
        }

        res.status(200).json({
            message: 'Profile updated successfully',
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                phone: updatedUser.phone,
                farm_role: updatedUser.farm_role,
                avatar_url: updatedUser.avatar_url,
                updated_at: updatedUser.updated_at
            }
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Profile update failed');
    }
}));

/**
 * Change password
 * POST /api/auth/change-password
 */
router.post('/change-password', authenticateToken, [
    body('current_password').notEmpty().withMessage('Current password is required'),
    body('new_password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { current_password, new_password } = req.body;

    // Get Supabase client from app
    const supabase = req.app.get('supabase');

    try {
        // Update password in Supabase Auth
        const { error } = await supabase.auth.updateUser({
            password: new_password
        });

        if (error) {
            throw new ValidationError('Failed to update password');
        }

        res.status(200).json({
            message: 'Password changed successfully'
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Password change failed');
    }
}));

/**
 * Logout endpoint (client-side token removal)
 * POST /api/auth/logout
 */
router.post('/logout', (req, res) => {
    res.status(200).json({
        message: 'Logout successful'
    });
});

/**
 * Refresh token endpoint
 * POST /api/auth/refresh
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
    try {
        // Generate new token
        const token = jwt.sign(
            { userId: req.user.id, email: req.user.email },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.status(200).json({
            message: 'Token refreshed successfully',
            token
        });

    } catch (error) {
        throw new Error('Token refresh failed');
    }
}));

module.exports = router;
