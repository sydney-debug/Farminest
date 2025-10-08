const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../models/database');
const { authenticate, requireFarmer, requireOwnership } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const animalSchema = Joi.object({
  name: Joi.string().min(1).required(),
  type: Joi.string().min(1).required(),
  breed: Joi.string().optional(),
  dateOfBirth: Joi.date().optional(),
  weight: Joi.number().positive().optional(),
  gender: Joi.string().valid('male', 'female').optional(),
  tagNumber: Joi.string().optional()
});

// Get all animals for the authenticated farmer
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { type, status } = req.query;

    let queryText = `SELECT * FROM animals WHERE farmer_id = $1`;
    let queryParams = [farmerId];
    let paramIndex = 2;

    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
    }

    queryText += ` ORDER BY created_at DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single animal by ID
router.get('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const animalId = req.params.id;

    const result = await query(
      `SELECT * FROM animals WHERE id = $1 AND farmer_id = $2`,
      [animalId, farmerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new animal
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = animalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, type, breed, dateOfBirth, weight, gender, tagNumber } = value;
    const farmerId = req.user.id;

    const result = await query(
      `INSERT INTO animals (farmer_id, name, type, breed, date_of_birth, weight, gender, tag_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [farmerId, name, type, breed, dateOfBirth, weight, gender, tagNumber]
    );

    res.status(201).json({
      success: true,
      message: 'Animal created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create animal error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Tag number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update animal
router.put('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = animalSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, type, breed, dateOfBirth, weight, gender, tagNumber } = value;
    const farmerId = req.user.id;
    const animalId = req.params.id;

    // Check if animal exists and belongs to farmer
    const existingAnimal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (existingAnimal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    const result = await query(
      `UPDATE animals
       SET name = $1, type = $2, breed = $3, date_of_birth = $4, weight = $5, gender = $6, tag_number = $7, updated_at = CURRENT_TIMESTAMP
       WHERE id = $8 AND farmer_id = $9
       RETURNING *`,
      [name, type, breed, dateOfBirth, weight, gender, tagNumber, animalId, farmerId]
    );

    res.json({
      success: true,
      message: 'Animal updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update animal error:', error);
    if (error.code === '23505') { // Unique violation
      return res.status(400).json({
        success: false,
        message: 'Tag number already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete animal
router.delete('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const animalId = req.params.id;

    // Check if animal exists and belongs to farmer
    const existingAnimal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (existingAnimal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    // Delete animal (CASCADE will handle related records)
    await query(
      'DELETE FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    res.json({
      success: true,
      message: 'Animal deleted successfully'
    });

  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get calves for an animal
router.get('/:id/calves', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const animalId = req.params.id;

    // First check if animal belongs to farmer
    const animal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (animal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    const calves = await query(
      `SELECT c.*, a.name as mother_name FROM calves c
       JOIN animals a ON c.mother_id = a.id
       WHERE c.animal_id = $1
       ORDER BY c.date_born DESC`,
      [animalId]
    );

    res.json({
      success: true,
      data: calves.rows
    });

  } catch (error) {
    console.error('Get calves error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get pregnancies for an animal
router.get('/:id/pregnancies', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const animalId = req.params.id;

    // First check if animal belongs to farmer
    const animal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (animal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    const pregnancies = await query(
      `SELECT p.*, v.full_name as vet_name, v.clinic_name
       FROM pregnancies p
       LEFT JOIN veterinarians v ON p.assigned_vet_id = v.id
       WHERE p.animal_id = $1
       ORDER BY p.due_date DESC`,
      [animalId]
    );

    res.json({
      success: true,
      data: pregnancies.rows
    });

  } catch (error) {
    console.error('Get pregnancies error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Add pregnancy record
router.post('/:id/pregnancies', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const animalId = req.params.id;
    const { dueDate, assignedVetId, notes } = req.body;

    // First check if animal belongs to farmer
    const animal = await query(
      'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
      [animalId, farmerId]
    );

    if (animal.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Animal not found'
      });
    }

    const result = await query(
      `INSERT INTO pregnancies (animal_id, due_date, assigned_vet_id, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [animalId, dueDate, assignedVetId, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Pregnancy record added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Add pregnancy error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
