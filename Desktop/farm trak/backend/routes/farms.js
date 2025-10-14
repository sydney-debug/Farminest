/**
 * Farm Management Routes for FarmTrak 360
 * Handles CRUD operations for farms
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requireFarmAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all farms for the authenticated user
 * GET /api/farms
 */
router.get('/', asyncHandler(async (req, res) => {
    const supabase = req.app.get('supabase');

    try {
        const { data: farms, error } = await supabase
            .from('farms')
            .select(`
                *,
                livestock:livestock(count),
                crops:crops(count)
            `)
            .eq('owner_id', req.user.id)
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch farms');
        }

        res.status(200).json({
            farms: farms || [],
            count: farms?.length || 0
        });

    } catch (error) {
        throw new Error('Failed to retrieve farms');
    }
}));

/**
 * Create a new farm
 * POST /api/farms
 */
router.post('/', [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Farm name must be between 2 and 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('area_hectares').optional().isFloat({ min: 0.01 }).withMessage('Area must be greater than 0'),
    body('farm_type').optional().isIn(['crop', 'livestock', 'mixed']).withMessage('Invalid farm type'),
    body('established_date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('contact_email').optional().isEmail().normalizeEmail().withMessage('Valid email is required')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const {
        name,
        description,
        location,
        latitude,
        longitude,
        area_hectares,
        farm_type = 'mixed',
        established_date,
        contact_phone,
        contact_email
    } = req.body;

    const supabase = req.app.get('supabase');

    try {
        const { data: farm, error } = await supabase
            .from('farms')
            .insert({
                owner_id: req.user.id,
                name,
                description,
                location,
                latitude,
                longitude,
                area_hectares,
                farm_type,
                established_date,
                contact_phone,
                contact_email,
                is_active: true
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                throw new ValidationError('A farm with this name already exists');
            }
            throw new Error('Failed to create farm');
        }

        res.status(201).json({
            message: 'Farm created successfully',
            farm
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to create farm');
    }
}));

/**
 * Get a specific farm by ID
 * GET /api/farms/:id
 */
router.get('/:id', [
    param('id').isUUID().withMessage('Invalid farm ID')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        // First check if user has access to this farm
        await requireFarmAccess(req, res, async () => {
            const { data: farm, error } = await supabase
                .from('farms')
                .select(`
                    *,
                    livestock:livestock(count),
                    crops:crops(count)
                `)
                .eq('id', id)
                .single();

            if (error || !farm) {
                throw new ValidationError('Farm not found');
            }

            res.status(200).json({ farm });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to retrieve farm');
    }
}));

/**
 * Update a farm
 * PUT /api/farms/:id
 */
router.put('/:id', [
    param('id').isUUID().withMessage('Invalid farm ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Farm name must be between 2 and 100 characters'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('latitude').optional().isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
    body('longitude').optional().isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
    body('area_hectares').optional().isFloat({ min: 0.01 }).withMessage('Area must be greater than 0'),
    body('farm_type').optional().isIn(['crop', 'livestock', 'mixed']).withMessage('Invalid farm type'),
    body('established_date').optional().isISO8601().withMessage('Invalid date format'),
    body('contact_phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
    body('contact_email').optional().isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('is_active').optional().isBoolean().withMessage('is_active must be a boolean')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    delete updateData.id;
    delete updateData.owner_id;
    delete updateData.created_at;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const supabase = req.app.get('supabase');

    try {
        // First check if user has access to this farm
        await requireFarmAccess(req, res, async () => {
            const { data: farm, error } = await supabase
                .from('farms')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new ValidationError('A farm with this name already exists');
                }
                throw new Error('Failed to update farm');
            }

            if (!farm) {
                throw new ValidationError('Farm not found');
            }

            res.status(200).json({
                message: 'Farm updated successfully',
                farm
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to update farm');
    }
}));

/**
 * Delete a farm (soft delete by setting is_active to false)
 * DELETE /api/farms/:id
 */
router.delete('/:id', [
    param('id').isUUID().withMessage('Invalid farm ID')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        // First check if user has access to this farm
        await requireFarmAccess(req, res, async () => {
            const { data: farm, error } = await supabase
                .from('farms')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to delete farm');
            }

            if (!farm) {
                throw new ValidationError('Farm not found');
            }

            res.status(200).json({
                message: 'Farm deleted successfully'
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to delete farm');
    }
}));

/**
 * Get farm statistics
 * GET /api/farms/:id/stats
 */
router.get('/:id/stats', [
    param('id').isUUID().withMessage('Invalid farm ID')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        // First check if user has access to this farm
        await requireFarmAccess(req, res, async () => {
            // Get livestock count
            const { data: livestock } = await supabase
                .from('livestock')
                .select('id', { count: 'exact' })
                .eq('farm_id', id)
                .eq('is_active', true);

            // Get crops count
            const { data: crops } = await supabase
                .from('crops')
                .select('id', { count: 'exact' })
                .eq('farm_id', id)
                .eq('is_active', true);

            // Get total area from crops
            const { data: cropAreas } = await supabase
                .from('crops')
                .select('area_hectares')
                .eq('farm_id', id)
                .eq('is_active', true)
                .not('area_hectares', 'is', null);

            const totalCropArea = cropAreas?.reduce((sum, crop) => sum + (crop.area_hectares || 0), 0) || 0;

            res.status(200).json({
                stats: {
                    livestock_count: livestock?.length || 0,
                    crops_count: crops?.length || 0,
                    total_crop_area_hectares: totalCropArea,
                    utilization_percentage: totalCropArea > 0 ? (totalCropArea / farm.area_hectares * 100).toFixed(1) : 0
                }
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to retrieve farm statistics');
    }
}));

module.exports = router;
