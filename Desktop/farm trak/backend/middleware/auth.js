/**
 * Authentication Middleware for FarmTrak 360
 * Handles JWT token verification and user authentication
 */

const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided'
            });
        }

        // Verify JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded || !decoded.userId) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
        }

        // Get user from database
        const { data: user, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'User not found'
            });
        }

        // Add user to request object
        req.user = user;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Token expired'
            });
        }

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Invalid token'
            });
        }

        console.error('Authentication error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Authentication failed'
        });
    }
};

/**
 * Middleware to check if user has specific role
 */
const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        if (!roles.includes(req.user.farm_role)) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'Insufficient permissions'
            });
        }

        next();
    };
};

/**
 * Middleware to check if user owns the resource or has admin access
 */
const requireOwnershipOrAdmin = (resourceUserIdField = 'user_id') => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        // Admin can access any resource
        if (req.user.farm_role === 'admin') {
            return next();
        }

        // Check if user owns the resource
        const resourceUserId = req.body[resourceUserIdField] || req.params[resourceUserIdField];

        if (req.user.id !== resourceUserId) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only access your own resources'
            });
        }

        next();
    };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            if (decoded && decoded.userId) {
                const { data: user } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('id', decoded.userId)
                    .single();

                if (user) {
                    req.user = user;
                }
            }
        }

        next();
    } catch (error) {
        // Ignore auth errors for optional auth
        next();
    }
};

/**
 * Middleware to check if user can access farm resources
 */
const requireFarmAccess = async (req, res, next) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'Authentication required'
            });
        }

        const farmId = req.params.farmId || req.body.farm_id;

        if (!farmId) {
            return res.status(400).json({
                error: 'Bad request',
                message: 'Farm ID is required'
            });
        }

        // Check if user owns the farm or is an admin
        if (req.user.farm_role === 'admin') {
            return next();
        }

        const { data: farm, error } = await supabase
            .from('farms')
            .select('owner_id')
            .eq('id', farmId)
            .single();

        if (error || !farm) {
            return res.status(404).json({
                error: 'Not found',
                message: 'Farm not found'
            });
        }

        if (farm.owner_id !== req.user.id) {
            return res.status(403).json({
                error: 'Access denied',
                message: 'You can only access resources from your own farms'
            });
        }

        next();

    } catch (error) {
        console.error('Farm access check error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: 'Failed to verify farm access'
        });
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireOwnershipOrAdmin,
    optionalAuth,
    requireFarmAccess
};
