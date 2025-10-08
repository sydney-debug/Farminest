const express = require('express');
const Joi = require('joi');
const { query } = require('../models/database');
const { authenticate, requireFarmer, requireVet, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const healthRecordSchema = Joi.object({
  animalId: Joi.number().required(),
  visitDate: Joi.date().required(),
  diagnosis: Joi.string().optional(),
  treatment: Joi.string().optional(),
  medications: Joi.string().optional(), // JSON string
  vaccination: Joi.boolean().optional(),
  nextCheckupDate: Joi.date().optional(),
  cost: Joi.number().positive().optional(),
  notes: Joi.string().optional()
});

// Get health records for farmer's animals
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { animal_id, limit = 50 } = req.query;

    let queryText = `
      SELECT hr.*, a.name as animal_name, a.type as animal_type, v.full_name as vet_name
      FROM health_records hr
      JOIN animals a ON hr.animal_id = a.id
      LEFT JOIN veterinarians vet ON hr.vet_id = vet.id
      LEFT JOIN users v ON vet.user_id = v.id
      WHERE a.farmer_id = $1`;
    let queryParams = [farmerId];
    let paramIndex = 2;

    if (animal_id) {
      queryText += ` AND hr.animal_id = $${paramIndex}`;
      queryParams.push(animal_id);
    }

    queryText += ` ORDER BY hr.visit_date DESC LIMIT $${paramIndex}`;
    queryParams.push(limit);

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get health records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create health record (farmers can create for their animals)
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { animalId, visitDate, diagnosis, treatment, medications, vaccination, nextCheckupDate, cost, notes } = value;
    const farmerId = req.user.id;

    // Verify animal belongs to farmer
    const animal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (animal.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Animal not found or access denied'
      });
    }

    const result = await query(
      `INSERT INTO health_records (animal_id, vet_id, visit_date, diagnosis, treatment, medications, vaccination, next_checkup_date, cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [animalId, req.user.id, visitDate, diagnosis, treatment, medications, vaccination, nextCheckupDate, cost, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Health record created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get health record by ID
router.get('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const recordId = req.params.id;

    const result = await query(
      `SELECT hr.*, a.name as animal_name, a.type as animal_type, v.full_name as vet_name
       FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       LEFT JOIN veterinarians vet ON hr.vet_id = vet.id
       LEFT JOIN users v ON vet.user_id = v.id
       WHERE hr.id = $1 AND a.farmer_id = $2`,
      [recordId, farmerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update health record
router.put('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = healthRecordSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { animalId, visitDate, diagnosis, treatment, medications, vaccination, nextCheckupDate, cost, notes } = value;
    const farmerId = req.user.id;
    const recordId = req.params.id;

    // Verify animal belongs to farmer and record exists
    const existingRecord = await query(
      `SELECT hr.id FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       WHERE hr.id = $1 AND a.farmer_id = $2`,
      [recordId, farmerId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    const result = await query(
      `UPDATE health_records
       SET animal_id = $1, visit_date = $2, diagnosis = $3, treatment = $4, medications = $5,
           vaccination = $6, next_checkup_date = $7, cost = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
       WHERE id = $10
       RETURNING *`,
      [animalId, visitDate, diagnosis, treatment, medications, vaccination, nextCheckupDate, cost, notes, recordId]
    );

    res.json({
      success: true,
      message: 'Health record updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete health record
router.delete('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const recordId = req.params.id;

    // Verify record belongs to farmer's animal
    const existingRecord = await query(
      `SELECT hr.id FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       WHERE hr.id = $1 AND a.farmer_id = $2`,
      [recordId, farmerId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Health record not found'
      });
    }

    await query('DELETE FROM health_records WHERE id = $1', [recordId]);

    res.json({
      success: true,
      message: 'Health record deleted successfully'
    });

  } catch (error) {
    console.error('Delete health record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get upcoming vaccinations and checkups
router.get('/alerts/upcoming', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await query(
      `SELECT hr.*, a.name as animal_name, a.type as animal_type
       FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       WHERE a.farmer_id = $1 AND (
         (hr.vaccination = true AND hr.next_checkup_date <= $2) OR
         (hr.next_checkup_date <= $2)
       )
       ORDER BY hr.next_checkup_date ASC`,
      [farmerId, nextWeek]
    );

    res.json({
      success: true,
      data: upcoming.rows
    });

  } catch (error) {
    console.error('Get upcoming health alerts error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
