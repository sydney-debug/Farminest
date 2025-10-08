const express = require('express');
const Joi = require('joi');
const { query } = require('../models/database');
const { authenticate, requireFarmer } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const produceSchema = Joi.object({
  name: Joi.string().min(1).required(),
  type: Joi.string().min(1).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().min(1).required(),
  harvestDate: Joi.date().optional(),
  expiryDate: Joi.date().optional(),
  qualityGrade: Joi.string().optional(),
  storageLocation: Joi.string().optional(),
  cropId: Joi.number().optional(),
  animalId: Joi.number().optional(),
  notes: Joi.string().optional()
});

const saleSchema = Joi.object({
  customerId: Joi.number().required(),
  productName: Joi.string().min(1).required(),
  quantity: Joi.number().positive().required(),
  unitPrice: Joi.number().positive().required(),
  produceId: Joi.number().optional(),
  saleDate: Joi.date().optional(),
  notes: Joi.string().optional()
});

// Get all produce for the authenticated farmer
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { type } = req.query;

    let queryText = `
      SELECT p.*, c.name as crop_name, a.name as animal_name
      FROM produce p
      LEFT JOIN crops c ON p.crop_id = c.id
      LEFT JOIN animals a ON p.animal_id = a.id
      WHERE p.farmer_id = $1`;
    let queryParams = [farmerId];

    if (type) {
      queryText += ` AND p.type = $2`;
      queryParams.push(type);
    }

    queryText += ` ORDER BY p.harvest_date DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get produce error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new produce record
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = produceSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const {
      name, type, quantity, unit, harvestDate, expiryDate,
      qualityGrade, storageLocation, cropId, animalId, notes
    } = value;
    const farmerId = req.user.id;

    // Validate that crop or animal belongs to farmer if provided
    if (cropId) {
      const crop = await query(
        'SELECT id FROM crops WHERE id = $1 AND farmer_id = $2',
        [cropId, farmerId]
      );
      if (crop.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid crop ID'
        });
      }
    }

    if (animalId) {
      const animal = await query(
        'SELECT id FROM animals WHERE id = $1 AND farmer_id = $2',
        [animalId, farmerId]
      );
      if (animal.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid animal ID'
        });
      }
    }

    const result = await query(
      `INSERT INTO produce (farmer_id, name, type, quantity, unit, harvest_date, expiry_date, quality_grade, storage_location, crop_id, animal_id, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [farmerId, name, type, quantity, unit, harvestDate, expiryDate, qualityGrade, storageLocation, cropId, animalId, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Produce record created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create produce error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get produce statistics
router.get('/stats/summary', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get produce by type
    const produceByType = await query(
      `SELECT type, SUM(quantity) as total_quantity, unit FROM produce
       WHERE farmer_id = $1 GROUP BY type, unit ORDER BY total_quantity DESC`,
      [farmerId]
    );

    // Get monthly produce for the last 6 months
    const monthlyProduce = await query(
      `SELECT
        DATE_TRUNC('month', harvest_date) as month,
        SUM(quantity) as total_quantity,
        COUNT(*) as record_count
       FROM produce
       WHERE farmer_id = $1 AND harvest_date >= $2
       GROUP BY DATE_TRUNC('month', harvest_date)
       ORDER BY month DESC LIMIT 6`,
      [farmerId, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)]
    );

    // Get expiring produce (next 7 days)
    const expiringProduce = await query(
      `SELECT * FROM produce
       WHERE farmer_id = $1 AND expiry_date BETWEEN $2 AND $3
       ORDER BY expiry_date ASC`,
      [farmerId, new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    );

    res.json({
      success: true,
      data: {
        byType: produceByType.rows,
        monthly: monthlyProduce.rows,
        expiring: expiringProduce.rows
      }
    });

  } catch (error) {
    console.error('Produce stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
