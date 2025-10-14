/**
 * Crop Management Routes for FarmTrak 360
 * Handles CRUD operations for crops
 */

const express = require('express');
const { body, param, validationResult } = require('express-validator');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requireFarmAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all crops for the authenticated user
 * GET /api/crops
 */
router.get('/', asyncHandler(async (req, res) => {
    const supabase = req.app.get('supabase');
    const { farm_id, limit = 50, offset = 0 } = req.query;

    try {
        let query = supabase
            .from('crops')
            .select(`
                *,
                farm:farms(name, location)
            `)
            .eq('is_active', true)
            .range(offset, offset + limit - 1);

        // Filter by farm if specified
        if (farm_id) {
            await requireFarmAccess(req, res, () => {});
            query = query.eq('farm_id', farm_id);
        } else {
            // Get user's farms and filter crops by those farms
            const { data: userFarms } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', req.user.id);

            if (userFarms && userFarms.length > 0) {
                const farmIds = userFarms.map(farm => farm.id);
                query = query.in('farm_id', farmIds);
            } else {
                return res.status(200).json({
                    crops: [],
                    count: 0,
                    total: 0
                });
            }
        }

        query = query.order('created_at', { ascending: false });

        const { data: crops, error, count } = await query;

        if (error) {
            throw new Error('Failed to fetch crops');
        }

        res.status(200).json({
            crops: crops || [],
            count: crops?.length || 0,
            total: count || 0,
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        throw new Error('Failed to retrieve crops');
    }
}));

/**
 * Create new crop
 * POST /api/crops
 */
router.post('/', [
    body('farm_id').isUUID().withMessage('Valid farm ID is required'),
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Crop name must be between 2 and 100 characters'),
    body('variety').optional().trim().isLength({ max: 100 }).withMessage('Variety must not exceed 100 characters'),
    body('area_hectares').isFloat({ min: 0.01 }).withMessage('Area must be greater than 0'),
    body('planted_date').isISO8601().withMessage('Valid planted date is required'),
    body('expected_harvest_date').optional().isISO8601().withMessage('Invalid harvest date format'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const cropData = req.body;
    cropData.is_active = true;

    const supabase = req.app.get('supabase');

    try {
        await requireFarmAccess(req, res, async () => {
            const { data: crop, error } = await supabase
                .from('crops')
                .insert(cropData)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to create crop record');
            }

            res.status(201).json({
                message: 'Crop record created successfully',
                crop
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to create crop record');
    }
}));

/**
 * Get specific crop by ID
 * GET /api/crops/:id
 */
router.get('/:id', [
    param('id').isUUID().withMessage('Invalid crop ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        const { data: crop, error } = await supabase
            .from('crops')
            .select(`
                *,
                farm:farms(name, location),
                activities:crop_activities(*)
            `)
            .eq('id', id)
            .single();

        if (error || !crop) {
            throw new ValidationError('Crop not found');
        }

        await requireFarmAccess(req, res, () => {
            res.status(200).json({ crop });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to retrieve crop');
    }
}));

/**
 * Update crop
 * PUT /api/crops/:id
 */
router.put('/:id', [
    param('id').isUUID().withMessage('Invalid crop ID'),
    body('name').optional().trim().isLength({ min: 2, max: 100 }).withMessage('Crop name must be between 2 and 100 characters'),
    body('variety').optional().trim().isLength({ max: 100 }).withMessage('Variety must not exceed 100 characters'),
    body('area_hectares').optional().isFloat({ min: 0.01 }).withMessage('Area must be greater than 0'),
    body('planted_date').optional().isISO8601().withMessage('Invalid planted date format'),
    body('expected_harvest_date').optional().isISO8601().withMessage('Invalid harvest date format'),
    body('actual_harvest_date').optional().isISO8601().withMessage('Invalid actual harvest date format'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    delete updateData.id;
    delete updateData.farm_id;
    delete updateData.created_at;

    updateData.updated_at = new Date().toISOString();

    const supabase = req.app.get('supabase');

    try {
        const { data: existingCrop } = await supabase
            .from('crops')
            .select('farm_id')
            .eq('id', id)
            .single();

        if (!existingCrop) {
            throw new ValidationError('Crop not found');
        }

        await requireFarmAccess(req, res, async () => {
            const { data: crop, error } = await supabase
                .from('crops')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to update crop');
            }

            res.status(200).json({
                message: 'Crop updated successfully',
                crop
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to update crop');
    }
}));

/**
 * Delete crop (soft delete)
 * DELETE /api/crops/:id
 */
router.delete('/:id', [
    param('id').isUUID().withMessage('Invalid crop ID')
], asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        const { data: existingCrop } = await supabase
            .from('crops')
            .select('farm_id')
            .eq('id', id)
            .single();

        if (!existingCrop) {
            throw new ValidationError('Crop not found');
        }

        await requireFarmAccess(req, res, async () => {
            const { data: crop, error } = await supabase
                .from('crops')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to delete crop');
            }

            res.status(200).json({
                message: 'Crop deleted successfully'
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to delete crop');
    }
}));

module.exports = router;
