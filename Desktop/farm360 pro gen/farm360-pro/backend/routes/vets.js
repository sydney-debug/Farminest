const express = require('express');
const Joi = require('joi');
const { query } = require('../models/database');
const { authenticate, requireVet } = require('../middleware/auth');

const router = express.Router();

// Get all veterinarians (public endpoint for farmers to browse)
router.get('/', authenticate, async (req, res) => {
  try {
    const { specialization, location } = req.query;

    let queryText = `
      SELECT v.*, u.full_name, u.phone, u.email
      FROM veterinarians v
      JOIN users u ON v.user_id = u.id
      WHERE v.is_available = true`;
    let queryParams = [];
    let paramIndex = 1;

    if (specialization) {
      queryText += ` AND v.specialization ILIKE $${paramIndex}`;
      queryParams.push(`%${specialization}%`);
      paramIndex++;
    }

    queryText += ` ORDER BY v.rating DESC, v.created_at DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get veterinarians error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get veterinarian by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const vetId = req.params.id;

    const result = await query(
      `SELECT v.*, u.full_name, u.phone, u.email
       FROM veterinarians v
       JOIN users u ON v.user_id = u.id
       WHERE v.id = $1 AND v.is_available = true`,
      [vetId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Veterinarian not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get veterinarian error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get veterinarian dashboard (for vets only)
router.get('/dashboard/stats', authenticate, requireVet, async (req, res) => {
  try {
    const vetId = req.user.id; // This should be the veterinarian's user ID

    // Get assigned animals count
    const assignedAnimals = await query(
      `SELECT COUNT(DISTINCT a.id) as count FROM animals a
       JOIN pregnancies p ON a.id = p.animal_id
       WHERE p.assigned_vet_id = $1`,
      [vetId]
    );

    // Get recent health records
    const recentRecords = await query(
      `SELECT COUNT(*) as count FROM health_records hr
       WHERE hr.vet_id = $1 AND hr.visit_date >= $2`,
      [vetId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
    );

    // Get upcoming appointments (pregnancies due soon)
    const upcomingAppointments = await query(
      `SELECT COUNT(*) as count FROM pregnancies p
       WHERE p.assigned_vet_id = $1 AND p.due_date BETWEEN $2 AND $3`,
      [
        vetId,
        new Date(),
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      ]
    );

    res.json({
      success: true,
      data: {
        assignedAnimals: parseInt(assignedAnimals.rows[0].count),
        recentRecords: parseInt(recentRecords.rows[0].count),
        upcomingAppointments: parseInt(upcomingAppointments.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Get vet dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get veterinarian's assigned animals
router.get('/dashboard/animals', authenticate, requireVet, async (req, res) => {
  try {
    const vetId = req.user.id;

    const animals = await query(
      `SELECT DISTINCT a.*, u.full_name as farmer_name, u.phone as farmer_phone
       FROM animals a
       JOIN users u ON a.farmer_id = u.id
       JOIN pregnancies p ON a.id = p.animal_id
       WHERE p.assigned_vet_id = $1
       ORDER BY a.name`,
      [vetId]
    );

    res.json({
      success: true,
      data: animals.rows
    });

  } catch (error) {
    console.error('Get vet animals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get veterinarian's health records
router.get('/dashboard/records', authenticate, requireVet, async (req, res) => {
  try {
    const vetId = req.user.id;
    const { limit = 20 } = req.query;

    const records = await query(
      `SELECT hr.*, a.name as animal_name, a.type as animal_type, u.full_name as farmer_name
       FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       JOIN users u ON a.farmer_id = u.id
       WHERE hr.vet_id = $1
       ORDER BY hr.visit_date DESC LIMIT $2`,
      [vetId, limit]
    );

    res.json({
      success: true,
      data: records.rows
    });

  } catch (error) {
    console.error('Get vet records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
