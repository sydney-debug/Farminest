/**
 * Livestock Management Routes for FarmTrak 360
 * Handles CRUD operations for livestock
 */

const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const { asyncHandler, ValidationError } = require('../middleware/errorHandler');
const { requireFarmAccess } = require('../middleware/auth');

const router = express.Router();

/**
 * Get all livestock for the authenticated user
 * GET /api/livestock
 */
router.get('/', [
    query('farm_id').optional().isUUID().withMessage('Invalid farm ID'),
    query('species').optional().isIn(['cattle', 'sheep', 'pigs', 'poultry', 'goats', 'horses']).withMessage('Invalid species'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { farm_id, species, limit = 50, offset = 0 } = req.query;
    const supabase = req.app.get('supabase');

    try {
        let query = supabase
            .from('livestock')
            .select(`
                *,
                farm:farms(name, location),
                health_records:livestock_health(count)
            `)
            .eq('is_active', true)
            .range(offset, offset + limit - 1);

        // Filter by farm if specified
        if (farm_id) {
            // Check if user has access to this farm
            await requireFarmAccess(req, res, () => {});
            query = query.eq('farm_id', farm_id);
        } else {
            // Get user's farms and filter livestock by those farms
            const { data: userFarms } = await supabase
                .from('farms')
                .select('id')
                .eq('owner_id', req.user.id);

            if (userFarms && userFarms.length > 0) {
                const farmIds = userFarms.map(farm => farm.id);
                query = query.in('farm_id', farmIds);
            } else {
                // User has no farms, return empty result
                return res.status(200).json({
                    livestock: [],
                    count: 0,
                    total: 0
                });
            }
        }

        // Filter by species if specified
        if (species) {
            query = query.eq('species', species);
        }

        query = query.order('created_at', { ascending: false });

        const { data: livestock, error, count } = await query;

        if (error) {
            throw new Error('Failed to fetch livestock');
        }

        res.status(200).json({
            livestock: livestock || [],
            count: livestock?.length || 0,
            total: count || 0,
            filters: { farm_id, species },
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        throw new Error('Failed to retrieve livestock');
    }
}));

/**
 * Create new livestock
 * POST /api/livestock
 */
router.post('/', [
    body('farm_id').isUUID().withMessage('Valid farm ID is required'),
    body('tag_number').trim().isLength({ min: 1, max: 50 }).withMessage('Tag number is required'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('species').isIn(['cattle', 'sheep', 'pigs', 'poultry', 'goats', 'horses']).withMessage('Valid species is required'),
    body('breed').optional().trim().isLength({ max: 100 }).withMessage('Breed must not exceed 100 characters'),
    body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('birth_date').optional().isBefore().withMessage('Birth date cannot be in the future'),
    body('purchase_date').optional().isBefore().withMessage('Purchase date cannot be in the future'),
    body('purchase_price').optional().isFloat({ min: 0 }).withMessage('Purchase price must be non-negative'),
    body('current_weight').optional().isFloat({ min: 0 }).withMessage('Current weight must be non-negative'),
    body('color').optional().trim().isLength({ max: 100 }).withMessage('Color must not exceed 100 characters'),
    body('markings').optional().trim().isLength({ max: 500 }).withMessage('Markings must not exceed 500 characters'),
    body('mother_tag').optional().trim().isLength({ max: 50 }).withMessage('Mother tag must not exceed 50 characters'),
    body('father_tag').optional().trim().isLength({ max: 50 }).withMessage('Father tag must not exceed 50 characters'),
    body('health_status').optional().isIn(['healthy', 'sick', 'under_treatment']).withMessage('Invalid health status'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const livestockData = req.body;
    livestockData.is_active = true;

    const supabase = req.app.get('supabase');

    try {
        // Check if user has access to the specified farm
        await requireFarmAccess(req, res, async () => {
            // Check if tag number already exists
            const { data: existingLivestock } = await supabase
                .from('livestock')
                .select('id')
                .eq('tag_number', livestockData.tag_number)
                .single();

            if (existingLivestock) {
                throw new ValidationError('Tag number already exists');
            }

            const { data: livestock, error } = await supabase
                .from('livestock')
                .insert(livestockData)
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    throw new ValidationError('Tag number already exists');
                }
                throw new Error('Failed to create livestock record');
            }

            res.status(201).json({
                message: 'Livestock record created successfully',
                livestock
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to create livestock record');
    }
}));

/**
 * Get specific livestock by ID
 * GET /api/livestock/:id
 */
router.get('/:id', [
    param('id').isUUID().withMessage('Invalid livestock ID')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        const { data: livestock, error } = await supabase
            .from('livestock')
            .select(`
                *,
                farm:farms(name, location),
                health_records:livestock_health(*)
            `)
            .eq('id', id)
            .single();

        if (error || !livestock) {
            throw new ValidationError('Livestock not found');
        }

        // Check if user has access to this livestock's farm
        await requireFarmAccess(req, res, () => {
            res.status(200).json({ livestock });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to retrieve livestock');
    }
}));

/**
 * Update livestock
 * PUT /api/livestock/:id
 */
router.put('/:id', [
    param('id').isUUID().withMessage('Invalid livestock ID'),
    body('name').optional().trim().isLength({ max: 100 }).withMessage('Name must not exceed 100 characters'),
    body('species').optional().isIn(['cattle', 'sheep', 'pigs', 'poultry', 'goats', 'horses']).withMessage('Valid species is required'),
    body('breed').optional().trim().isLength({ max: 100 }).withMessage('Breed must not exceed 100 characters'),
    body('gender').optional().isIn(['male', 'female']).withMessage('Gender must be male or female'),
    body('birth_date').optional().isBefore().withMessage('Birth date cannot be in the future'),
    body('purchase_date').optional().isBefore().withMessage('Purchase date cannot be in the future'),
    body('purchase_price').optional().isFloat({ min: 0 }).withMessage('Purchase price must be non-negative'),
    body('current_weight').optional().isFloat({ min: 0 }).withMessage('Current weight must be non-negative'),
    body('color').optional().trim().isLength({ max: 100 }).withMessage('Color must not exceed 100 characters'),
    body('markings').optional().trim().isLength({ max: 500 }).withMessage('Markings must not exceed 500 characters'),
    body('mother_tag').optional().trim().isLength({ max: 50 }).withMessage('Mother tag must not exceed 50 characters'),
    body('father_tag').optional().trim().isLength({ max: 50 }).withMessage('Father tag must not exceed 50 characters'),
    body('health_status').optional().isIn(['healthy', 'sick', 'under_treatment']).withMessage('Invalid health status'),
    body('location').optional().trim().isLength({ max: 200 }).withMessage('Location must not exceed 200 characters'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const updateData = req.body;

    // Remove fields that shouldn't be updated
    delete updateData.id;
    delete updateData.farm_id;
    delete updateData.tag_number;
    delete updateData.created_at;

    // Add updated timestamp
    updateData.updated_at = new Date().toISOString();

    const supabase = req.app.get('supabase');

    try {
        // First check if livestock exists and user has access
        const { data: existingLivestock } = await supabase
            .from('livestock')
            .select('farm_id')
            .eq('id', id)
            .single();

        if (!existingLivestock) {
            throw new ValidationError('Livestock not found');
        }

        // Check farm access
        await requireFarmAccess(req, res, async () => {
            const { data: livestock, error } = await supabase
                .from('livestock')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to update livestock');
            }

            res.status(200).json({
                message: 'Livestock updated successfully',
                livestock
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to update livestock');
    }
}));

/**
 * Delete livestock (soft delete)
 * DELETE /api/livestock/:id
 */
router.delete('/:id', [
    param('id').isUUID().withMessage('Invalid livestock ID')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const supabase = req.app.get('supabase');

    try {
        // First check if livestock exists and user has access
        const { data: existingLivestock } = await supabase
            .from('livestock')
            .select('farm_id')
            .eq('id', id)
            .single();

        if (!existingLivestock) {
            throw new ValidationError('Livestock not found');
        }

        // Check farm access
        await requireFarmAccess(req, res, async () => {
            const { data: livestock, error } = await supabase
                .from('livestock')
                .update({
                    is_active: false,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) {
                throw new Error('Failed to delete livestock');
            }

            res.status(200).json({
                message: 'Livestock deleted successfully'
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to delete livestock');
    }
}));

/**
 * Add health record for livestock
 * POST /api/livestock/:id/health
 */
router.post('/:id/health', [
    param('id').isUUID().withMessage('Invalid livestock ID'),
    body('date').isISO8601().withMessage('Valid date is required'),
    body('condition').trim().isLength({ min: 1, max: 200 }).withMessage('Condition is required'),
    body('treatment').optional().trim().isLength({ max: 500 }).withMessage('Treatment must not exceed 500 characters'),
    body('medication').optional().trim().isLength({ max: 200 }).withMessage('Medication must not exceed 200 characters'),
    body('dosage').optional().trim().isLength({ max: 100 }).withMessage('Dosage must not exceed 100 characters'),
    body('cost').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative'),
    body('notes').optional().trim().isLength({ max: 1000 }).withMessage('Notes must not exceed 1000 characters'),
    body('next_checkup').optional().isISO8601().withMessage('Invalid next checkup date')
], asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        throw new ValidationError('Validation failed', errors.array());
    }

    const { id } = req.params;
    const healthData = req.body;

    const supabase = req.app.get('supabase');

    try {
        // First check if livestock exists and user has access
        const { data: livestock } = await supabase
            .from('livestock')
            .select('farm_id')
            .eq('id', id)
            .single();

        if (!livestock) {
            throw new ValidationError('Livestock not found');
        }

        // Check farm access
        await requireFarmAccess(req, res, async () => {
            const { data: healthRecord, error } = await supabase
                .from('livestock_health')
                .insert({
                    livestock_id: id,
                    vet_id: req.user.id,
                    ...healthData
                })
                .select()
                .single();

            if (error) {
                throw new Error('Failed to add health record');
            }

            res.status(201).json({
                message: 'Health record added successfully',
                health_record: healthRecord
            });
        });

    } catch (error) {
        if (error instanceof ValidationError) {
            throw error;
        }
        throw new Error('Failed to add health record');
    }
}));

/**
 * Get livestock statistics by species
 * GET /api/livestock/stats
 */
router.get('/stats/species', asyncHandler(async (req, res) => {
    const supabase = req.app.get('supabase');

    try {
        // Get user's farm IDs
        const { data: userFarms } = await supabase
            .from('farms')
            .select('id')
            .eq('owner_id', req.user.id);

        if (!userFarms || userFarms.length === 0) {
            return res.status(200).json({
                stats: {},
                total: 0
            });
        }

        const farmIds = userFarms.map(farm => farm.id);

        const { data: stats, error } = await supabase
            .from('livestock')
            .select('species')
            .in('farm_id', farmIds)
            .eq('is_active', true);

        if (error) {
            throw new Error('Failed to fetch livestock statistics');
        }

        // Count by species
        const speciesCount = {};
        let total = 0;

        stats?.forEach(item => {
            speciesCount[item.species] = (speciesCount[item.species] || 0) + 1;
            total++;
        });

        res.status(200).json({
            stats: speciesCount,
            total
        });

    } catch (error) {
        throw new Error('Failed to retrieve livestock statistics');
    }
}));

module.exports = router;
