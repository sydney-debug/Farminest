/**
 * Veterinary Routes for FarmTrak 360
 * Handles veterinary services and appointments
 */

const express = require('express');
const router = express.Router();

/**
 * Get all veterinarians
 * GET /api/vets
 */
router.get('/', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');

        const { data: vets, error } = await supabase
            .from('veterinarians')
            .select('*')
            .eq('is_verified', true)
            .order('rating', { ascending: false });

        if (error) {
            throw new Error('Failed to fetch veterinarians');
        }

        res.status(200).json({
            veterinarians: vets || [],
            count: vets?.length || 0
        });

    } catch (error) {
        console.error('Error fetching veterinarians:', error);
        res.status(500).json({
            error: 'Failed to fetch veterinarians',
            message: error.message
        });
    }
});

/**
 * Book appointment with veterinarian
 * POST /api/vets/appointments
 */
router.post('/appointments', async (req, res) => {
    try {
        const { vet_id, appointment_date, appointment_type, notes } = req.body;

        if (!vet_id || !appointment_date || !appointment_type) {
            return res.status(400).json({
                error: 'Missing required fields',
                message: 'vet_id, appointment_date, and appointment_type are required'
            });
        }

        const supabase = req.app.get('supabase');

        const { data: appointment, error } = await supabase
            .from('appointments')
            .insert({
                user_id: req.user.id,
                vet_id,
                appointment_date,
                appointment_type,
                notes,
                status: 'scheduled'
            })
            .select()
            .single();

        if (error) {
            throw new Error('Failed to book appointment');
        }

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });

    } catch (error) {
        console.error('Error booking appointment:', error);
        res.status(500).json({
            error: 'Failed to book appointment',
            message: error.message
        });
    }
});

/**
 * Get user's appointments
 * GET /api/vets/appointments
 */
router.get('/appointments', async (req, res) => {
    try {
        const supabase = req.app.get('supabase');

        const { data: appointments, error } = await supabase
            .from('appointments')
            .select(`
                *,
                veterinarian:veterinarians(*)
            `)
            .eq('user_id', req.user.id)
            .order('appointment_date', { ascending: true });

        if (error) {
            throw new Error('Failed to fetch appointments');
        }

        res.status(200).json({
            appointments: appointments || [],
            count: appointments?.length || 0
        });

    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({
            error: 'Failed to fetch appointments',
            message: error.message
        });
    }
});

module.exports = router;
