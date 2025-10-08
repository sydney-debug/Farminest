const express = require('express');
const Joi = require('joi');
const { query } = require('../models/database');
const { authenticate, requireFarmer } = require('../middleware/auth');

const router = express.Router();

// Validation schema
const cropSchema = Joi.object({
  name: Joi.string().min(1).required(),
  type: Joi.string().min(1).required(),
  plantingDate: Joi.date().required(),
  expectedHarvestDate: Joi.date().optional(),
  area: Joi.number().positive().optional(),
  notes: Joi.string().optional()
});

// Get all crops for the authenticated farmer
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { status, type } = req.query;

    let queryText = `SELECT * FROM crops WHERE farmer_id = $1`;
    let queryParams = [farmerId];
    let paramIndex = 2;

    if (status) {
      queryText += ` AND status = $${paramIndex}`;
      queryParams.push(status);
      paramIndex++;
    }

    if (type) {
      queryText += ` AND type = $${paramIndex}`;
      queryParams.push(type);
    }

    queryText += ` ORDER BY planting_date DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get crops error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single crop by ID
router.get('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const cropId = req.params.id;

    const result = await query(
      `SELECT * FROM crops WHERE id = $1 AND farmer_id = $2`,
      [cropId, farmerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new crop
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = cropSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, type, plantingDate, expectedHarvestDate, area, notes } = value;
    const farmerId = req.user.id;

    const result = await query(
      `INSERT INTO crops (farmer_id, name, type, planting_date, expected_harvest_date, area, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [farmerId, name, type, plantingDate, expectedHarvestDate, area, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Crop created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update crop
router.put('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = cropSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, type, plantingDate, expectedHarvestDate, area, notes } = value;
    const farmerId = req.user.id;
    const cropId = req.params.id;

    // Check if crop exists and belongs to farmer
    const existingCrop = await query(
      'SELECT id FROM crops WHERE id = $1 AND farmer_id = $2',
      [cropId, farmerId]
    );

    if (existingCrop.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const result = await query(
      `UPDATE crops
       SET name = $1, type = $2, planting_date = $3, expected_harvest_date = $4, area = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7 AND farmer_id = $8
       RETURNING *`,
      [name, type, plantingDate, expectedHarvestDate, area, notes, cropId, farmerId]
    );

    res.json({
      success: true,
      message: 'Crop updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete crop
router.delete('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const cropId = req.params.id;

    // Check if crop exists and belongs to farmer
    const existingCrop = await query(
      'SELECT id FROM crops WHERE id = $1 AND farmer_id = $2',
      [cropId, farmerId]
    );

    if (existingCrop.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    await query(
      'DELETE FROM crops WHERE id = $1 AND farmer_id = $2',
      [cropId, farmerId]
    );

    res.json({
      success: true,
      message: 'Crop deleted successfully'
    });

  } catch (error) {
    console.error('Delete crop error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update crop status
router.patch('/:id/status', authenticate, requireFarmer, async (req, res) => {
  try {
    const { status } = req.body;
    const farmerId = req.user.id;
    const cropId = req.params.id;

    // Validate status
    const validStatuses = ['planted', 'growing', 'harvested', 'failed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: planted, growing, harvested, failed'
      });
    }

    // Check if crop exists and belongs to farmer
    const existingCrop = await query(
      'SELECT id FROM crops WHERE id = $1 AND farmer_id = $2',
      [cropId, farmerId]
    );

    if (existingCrop.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    const result = await query(
      `UPDATE crops SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 AND farmer_id = $3 RETURNING *`,
      [status, cropId, farmerId]
    );

    res.json({
      success: true,
      message: 'Crop status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update crop status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get crop progress and yields
router.get('/:id/yields', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const cropId = req.params.id;

    // Check if crop exists and belongs to farmer
    const crop = await query(
      'SELECT id FROM crops WHERE id = $1 AND farmer_id = $2',
      [cropId, farmerId]
    );

    if (crop.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Crop not found'
      });
    }

    // Get produce from this crop
    const yields = await query(
      `SELECT * FROM produce WHERE crop_id = $1 ORDER BY harvest_date DESC`,
      [cropId]
    );

    // Calculate total yield
    const totalYield = await query(
      `SELECT SUM(quantity) as total_quantity, unit FROM produce WHERE crop_id = $1 GROUP BY unit`,
      [cropId]
    );

    res.json({
      success: true,
      data: {
        yields: yields.rows,
        totalYield: totalYield.rows
      }
    });

  } catch (error) {
    console.error('Get crop yields error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
