/**
 * Agrovet Routes for FarmTrak 360
 * Handles agricultural suppliers and inventory
 */

const express = require('express');
const router = express.Router();

/**
 * Get all agrovets
 * GET /api/agrovets
 */
router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');

        const { data: agrovets, error } = await supabase
            .from('agrovets')
            .select('*')
            .eq('is_verified', true)
            .order('rating', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch agrovets');
        }

        res.status(200).json({
            agrovets: agrovets || [],
            count: agrovets?.length || 0
        });

    } catch (error) {
        console.error('Error fetching agrovets:', error);
        res.status(500).json({
            error: 'Failed to fetch agrovets',
            message: error.message
        });
    }
});

/**
 * Get agrovet products
 * GET /api/agrovets/:id/products
 */
router.get('/:id/products', async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = req.app.get('supabase');

        const { data: products, error } = await supabase
            .from('agrovet_products')
            .select('*')
            .eq('agrovet_id', id)
            .eq('is_available', true)
            .order('name');

        if (error) {
            throw new Error('Failed to fetch products');
        }

        res.status(200).json({
            products: products || [],
            count: products?.length || 0
        });

    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({
            error: 'Failed to fetch products',
            message: error.message
        });
    }
});

module.exports = router;
