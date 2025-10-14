/**
 * Location Services Routes for FarmTrak 360
 * Handles GPS tracking and mapping features
 */

const express = require('express');
const router = express.Router();

/**
 * Get locations for user's assets
 * GET /api/location
 */
router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { asset_type, asset_id, limit = 100, offset = 0 } = req.query;

        let query = supabase
            .from('locations')
            .select('*')
            .order('recorded_at', { ascending: false })
            .range(offset, offset + limit - 1);

        // Filter by asset type if specified
        if (asset_type) {
            query = query.eq('asset_type', asset_type);
        }

        // Filter by specific asset if specified
        if (asset_id) {
            query = query.eq('asset_id', asset_id);
        }

        const { data: locations, error } = await query;

        if (error) {
            throw new Error('Failed to fetch locations');
        }

        res.status(200).json({
            locations: locations || [],
            count: locations?.length || 0,
            filters: { asset_type, asset_id },
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        console.error('Error fetching locations:', error);
        res.status(500).json({
            error: 'Failed to fetch locations',
            message: error.message
        });
    }
});

/**
 * Record new location
 * POST /api/location
 */
router.post('/', async (req, res) => {
    try {
        const { asset_type, asset_id, latitude, longitude, accuracy, notes } = req.body;

        if (!asset_type || !asset_id || latitude === undefined || longitude === undefined) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'asset_type, asset_id, latitude, and longitude are required'
            });
        }

        const supabase = req.app.get('supabase');

        const { data: location, error } = await supabase
            .from('locations')
            .insert({
                asset_type,
                asset_id,
                latitude,
                longitude,
                accuracy,
                notes
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to record location');
        }

        res.status(201).json({
            message: 'Location recorded successfully',
            location
        });

    } catch (error) {
        console.error('Error recording location:', error);
        res.status(500).json({
            error: 'Failed to record location',
            message: error.message
        });
    }
});

/**
 * Get farm locations
 * GET /api/location/farms
 */
router.get('/farms', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');

        const { data: farms, error } = await supabase
            .from('farms')
            .select('id, name, location, latitude, longitude, area_hectares')
            .not('latitude', 'is', null)
            .not('longitude', 'is', null)
            .eq('owner_id', req.user.id);

        if (error) {
            throw new Error('Failed to fetch farm locations');
        }

        res.status(200).json({
            farms: farms || [],
            count: farms?.length || 0
        });

    } catch (error) {
        console.error('Error fetching farm locations:', error);
        res.status(500).json({
            error: 'Failed to fetch farm locations',
            message: error.message
        });
    }
});

/**
 * Get livestock locations
 * GET /api/location/livestock
 */
router.get('/livestock', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');

        // Get livestock with location data
        const { data: livestock, error } = await supabase
            .from('livestock')
            .select(`
                id,
                tag_number,
                name,
                species,
                locations (
                    latitude,
                    longitude,
                    recorded_at,
                    accuracy
                )
            `)
            .eq('is_active', true)
            .order('locations(recorded_at)', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch livestock locations');
        }

        res.status(200).json({
            livestock: livestock || [],
            count: livestock?.length || 0
        });

    } catch (error) {
        console.error('Error fetching livestock locations:', error);
        res.status(500).json({
            error: 'Failed to fetch livestock locations',
            message: error.message
        });
    }
});

module.exports = router;
