const express = require('express');
const Joi = require('joi');
const { query } = require('../models/database');
const { authenticate, requireFarmer } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const feedSchema = Joi.object({
  animalId: Joi.number().required(),
  feedType: Joi.string().min(1).required(),
  quantity: Joi.number().positive().required(),
  unit: Joi.string().default('kg'),
  feedingTime: Joi.string().optional(),
  date: Joi.date().default(() => new Date()),
  supplements: Joi.string().optional(), // JSON string
  cost: Joi.number().positive().optional(),
  notes: Joi.string().optional()
});

// Get feed records for farmer's animals
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { animal_id, date_from, date_to } = req.query;

    let queryText = `
      SELECT f.*, a.name as animal_name, a.type as animal_type
      FROM feeds f
      JOIN animals a ON f.animal_id = a.id
      WHERE a.farmer_id = $1`;
    let queryParams = [farmerId];
    let paramIndex = 2;

    if (animal_id) {
      queryText += ` AND f.animal_id = $${paramIndex}`;
      queryParams.push(animal_id);
      paramIndex++;
    }

    if (date_from) {
      queryText += ` AND f.date >= $${paramIndex}`;
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      queryText += ` AND f.date <= $${paramIndex}`;
      queryParams.push(date_to);
    }

    queryText += ` ORDER BY f.date DESC, f.feeding_time DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get feed records error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create feed record
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = feedSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { animalId, feedType, quantity, unit, feedingTime, date, supplements, cost, notes } = value;
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
      `INSERT INTO feeds (animal_id, feed_type, quantity, unit, feeding_time, date, supplements, cost, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [animalId, feedType, quantity, unit, feedingTime, date, supplements, cost, notes]
    );

    res.status(201).json({
      success: true,
      message: 'Feed record created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create feed record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get feed record by ID
router.get('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const feedId = req.params.id;

    const result = await query(
      `SELECT f.*, a.name as animal_name, a.type as animal_type
       FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE f.id = $1 AND a.farmer_id = $2`,
      [feedId, farmerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feed record not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Get feed record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update feed record
router.put('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = feedSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { animalId, feedType, quantity, unit, feedingTime, date, supplements, cost, notes } = value;
    const farmerId = req.user.id;
    const feedId = req.params.id;

    // Verify animal belongs to farmer and record exists
    const existingRecord = await query(
      `SELECT f.id FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE f.id = $1 AND a.farmer_id = $2`,
      [feedId, farmerId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feed record not found'
      });
    }

    const result = await query(
      `UPDATE feeds
       SET animal_id = $1, feed_type = $2, quantity = $3, unit = $4, feeding_time = $5,
           date = $6, supplements = $7, cost = $8, notes = $9
       WHERE id = $10
       RETURNING *`,
      [animalId, feedType, quantity, unit, feedingTime, date, supplements, cost, notes, feedId]
    );

    res.json({
      success: true,
      message: 'Feed record updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update feed record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete feed record
router.delete('/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const feedId = req.params.id;

    // Verify record belongs to farmer's animal
    const existingRecord = await query(
      `SELECT f.id FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE f.id = $1 AND a.farmer_id = $2`,
      [feedId, farmerId]
    );

    if (existingRecord.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Feed record not found'
      });
    }

    await query('DELETE FROM feeds WHERE id = $1', [feedId]);

    res.json({
      success: true,
      message: 'Feed record deleted successfully'
    });

  } catch (error) {
    console.error('Delete feed record error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get feed statistics
router.get('/stats/summary', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { days = 30 } = req.query;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    // Get total feed cost for period
    const totalCost = await query(
      `SELECT SUM(cost) as total_cost FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE a.farmer_id = $1 AND f.date >= $2`,
      [farmerId, startDate]
    );

    // Get feed by type
    const feedByType = await query(
      `SELECT f.feed_type, SUM(f.quantity) as total_quantity, f.unit, SUM(f.cost) as total_cost
       FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE a.farmer_id = $1 AND f.date >= $2
       GROUP BY f.feed_type, f.unit
       ORDER BY total_cost DESC`,
      [farmerId, startDate]
    );

    // Get daily feed summary for the last 7 days
    const dailyFeed = await query(
      `SELECT DATE(f.date) as feed_date, SUM(f.quantity) as total_quantity, COUNT(DISTINCT f.animal_id) as animals_fed
       FROM feeds f
       JOIN animals a ON f.animal_id = a.id
       WHERE a.farmer_id = $1 AND f.date >= $2
       GROUP BY DATE(f.date)
       ORDER BY feed_date DESC`,
      [farmerId, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)]
    );

    res.json({
      success: true,
      data: {
        totalCost: parseFloat(totalCost.rows[0].total_cost || 0),
        feedByType: feedByType.rows,
        dailyFeed: dailyFeed.rows
      }
    });

  } catch (error) {
    console.error('Get feed stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
