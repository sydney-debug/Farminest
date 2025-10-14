/**
 * Contact Management Routes for FarmTrak 360
 * Handles contact management and messaging
 */

const express = require('express');
const router = express.Router();

/**
 * Get user's contacts
 * GET /api/contact
 */
router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');
        const { type, limit = 50, offset = 0 } = req.query;

        let query = supabase
            .from('contacts')
            .select('*')
            .eq('user_id', req.user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (type) {
            query = query.eq('contact_type', type);
        }

        const { data: contacts, error } = await query;

        if (error) {
            throw new Error('Failed to fetch contacts');
        }

        res.status(200).json({
            contacts: contacts || [],
            count: contacts?.length || 0,
            filters: { type },
            pagination: { limit: parseInt(limit), offset: parseInt(offset) }
        });

    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({
            error: 'Failed to fetch contacts',
            message: error.message
        });
    }
});

/**
 * Create new contact
 * POST /api/contact
 */
router.post('/', async (req, res) => {
    try {
        const { name, contact_type, phone, email, address, notes } = req.body;

        if (!name || !contact_type) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'name and contact_type are required'
            });
        }

        const supabase = req.app.get('supabase');

        const { data: contact, error } = await supabase
            .from('contacts')
            .insert({
                user_id: req.user.id,
                name,
                contact_type,
                phone,
                email,
                address,
                notes
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to create contact');
        }

        res.status(201).json({
            message: 'Contact created successfully',
            contact
        });

    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({
            error: 'Failed to create contact',
            message: error.message
        });
    }
});

/**
 * Update contact
 * PUT /api/contact/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Remove fields that shouldn't be updated directly
        delete updateData.id;
        delete updateData.user_id;
        delete updateData.created_at;

        // Add updated timestamp
        updateData.updated_at = new Date().toISOString();

        const supabase = req.app.get('supabase');

        const { data: contact, error } = await supabase
            .from('contacts')
            .update(updateData)
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to update contact');
        }

        if (!contact) {
            return res.status(404).json({
                error: 'Contact not found',
                message: 'Contact not found or you do not have permission to update it'
            });
        }

        res.status(200).json({
            message: 'Contact updated successfully',
            contact
        });

    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({
            error: 'Failed to update contact',
            message: error.message
        });
    }
});

/**
 * Delete contact
 * DELETE /api/contact/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const supabase = req.app.get('supabase');

        const { data: contact, error } = await supabase
            .from('contacts')
            .update({
                is_active: false,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .eq('user_id', req.user.id)
            .select()
            .single();

        if (error) {
            throw new Error('Failed to delete contact');
        }

        if (!contact) {
            return res.status(404).json({
                error: 'Contact not found',
                message: 'Contact not found or you do not have permission to delete it'
            });
        }

        res.status(200).json({
            message: 'Contact deleted successfully'
        });

    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({
            error: 'Failed to delete contact',
            message: error.message
        });
    }
});

module.exports = router;
