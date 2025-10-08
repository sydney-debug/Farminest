const express = require('express');
const { query } = require('../models/database');
const { authenticate, requireFarmer } = require('../middleware/auth');

const router = express.Router();

// Get dashboard overview for farmers
router.get('/overview', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get total animals count
    const totalAnimals = await query(
      'SELECT COUNT(*) as count FROM animals WHERE farmer_id = $1 AND status = $2',
      [farmerId, 'active']
    );

    // Get total crops count
    const totalCrops = await query(
      'SELECT COUNT(*) as count FROM crops WHERE farmer_id = $1',
      [farmerId]
    );

    // Get produce yield (total quantity of produce this month)
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    const monthlyProduce = await query(
      `SELECT SUM(quantity) as total_yield FROM produce
       WHERE farmer_id = $1 AND harvest_date >= $2 AND harvest_date <= $3`,
      [farmerId, startOfMonth, endOfMonth]
    );

    // Get active vet cases (animals with recent health records)
    const activeVetCases = await query(
      `SELECT COUNT(DISTINCT hr.animal_id) as count
       FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       WHERE a.farmer_id = $1 AND hr.visit_date >= $2`,
      [farmerId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] // Last 30 days
    );

    // Get total sales this month
    const monthlySales = await query(
      `SELECT SUM(total_amount) as total FROM sales
       WHERE farmer_id = $1 AND sale_date >= $2 AND sale_date <= $3`,
      [farmerId, startOfMonth, endOfMonth]
    );

    // Get outstanding debts (pending payments)
    const outstandingDebts = await query(
      `SELECT SUM(amount_pending) as total FROM sales
       WHERE farmer_id = $1 AND payment_status != $2`,
      [farmerId, 'paid']
    );

    // Get recent activities (last 5)
    const recentActivities = await query(
      `SELECT
        'animal_added' as type, a.name as description, a.created_at as date
       FROM animals a WHERE a.farmer_id = $1
       UNION ALL
       SELECT
        'sale_recorded' as type, CONCAT('Sold ', s.product_name) as description, s.created_at as date
       FROM sales s WHERE s.farmer_id = $1
       UNION ALL
       SELECT
        'health_check' as type, CONCAT('Health check for ', a.name) as description, hr.visit_date as date
       FROM health_records hr
       JOIN animals a ON hr.animal_id = a.id
       WHERE a.farmer_id = $1
       ORDER BY date DESC LIMIT 5`,
      [farmerId]
    );

    const dashboardData = {
      totalAnimals: parseInt(totalAnimals.rows[0].count),
      totalCrops: parseInt(totalCrops.rows[0].count),
      monthlyProduce: parseFloat(monthlyProduce.rows[0].total_yield || 0),
      activeVetCases: parseInt(activeVetCases.rows[0].count),
      monthlySales: parseFloat(monthlySales.rows[0].total || 0),
      outstandingDebts: parseFloat(outstandingDebts.rows[0].total || 0),
      recentActivities: recentActivities.rows
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get animal statistics for dashboard
router.get('/animal-stats', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get animals by type
    const animalsByType = await query(
      `SELECT type, COUNT(*) as count FROM animals
       WHERE farmer_id = $1 AND status = $2 GROUP BY type`,
      [farmerId, 'active']
    );

    // Get animals by gender
    const animalsByGender = await query(
      `SELECT gender, COUNT(*) as count FROM animals
       WHERE farmer_id = $1 AND status = $2 GROUP BY gender`,
      [farmerId, 'active']
    );

    // Get pregnant animals
    const pregnantAnimals = await query(
      `SELECT COUNT(*) as count FROM pregnancies p
       JOIN animals a ON p.animal_id = a.id
       WHERE a.farmer_id = $1 AND p.delivery_status = $2`,
      [farmerId, 'pending']
    );

    // Get recent births (last 30 days)
    const recentBirths = await query(
      `SELECT COUNT(*) as count FROM calves c
       JOIN animals a ON c.animal_id = a.id
       WHERE a.farmer_id = $1 AND c.date_born >= $2`,
      [farmerId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
    );

    res.json({
      success: true,
      data: {
        byType: animalsByType.rows,
        byGender: animalsByGender.rows,
        pregnant: parseInt(pregnantAnimals.rows[0].count),
        recentBirths: parseInt(recentBirths.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Animal stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get crop statistics for dashboard
router.get('/crop-stats', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get crops by status
    const cropsByStatus = await query(
      `SELECT status, COUNT(*) as count FROM crops
       WHERE farmer_id = $1 GROUP BY status`,
      [farmerId]
    );

    // Get crops by type
    const cropsByType = await query(
      `SELECT type, COUNT(*) as count FROM crops
       WHERE farmer_id = $1 GROUP BY type`,
      [farmerId]
    );

    // Get upcoming harvests (next 30 days)
    const upcomingHarvests = await query(
      `SELECT COUNT(*) as count FROM crops
       WHERE farmer_id = $1 AND expected_harvest_date BETWEEN $2 AND $3`,
      [
        farmerId,
        new Date(),
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      ]
    );

    res.json({
      success: true,
      data: {
        byStatus: cropsByStatus.rows,
        byType: cropsByType.rows,
        upcomingHarvests: parseInt(upcomingHarvests.rows[0].count)
      }
    });

  } catch (error) {
    console.error('Crop stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sales and financial summary
router.get('/financial-summary', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get monthly sales for the last 6 months
    const monthlySales = await query(
      `SELECT
        DATE_TRUNC('month', sale_date) as month,
        SUM(total_amount) as total_sales,
        SUM(amount_paid) as total_paid,
        SUM(amount_pending) as total_pending
       FROM sales
       WHERE farmer_id = $1 AND sale_date >= $2
       GROUP BY DATE_TRUNC('month', sale_date)
       ORDER BY month DESC LIMIT 6`,
      [farmerId, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)]
    );

    // Get top customers by total purchases
    const topCustomers = await query(
      `SELECT
        c.name,
        c.id,
        SUM(s.total_amount) as total_purchases,
        SUM(s.amount_pending) as total_debt
       FROM customers c
       JOIN sales s ON c.id = s.customer_id
       WHERE s.farmer_id = $1
       GROUP BY c.id, c.name
       ORDER BY total_purchases DESC LIMIT 5`,
      [farmerId]
    );

    // Get produce sales breakdown
    const produceBreakdown = await query(
      `SELECT
        p.type,
        SUM(s.total_amount) as total_revenue,
        SUM(s.quantity) as total_quantity
       FROM sales s
       JOIN produce p ON s.produce_id = p.id
       WHERE s.farmer_id = $1 AND s.sale_date >= $2
       GROUP BY p.type
       ORDER BY total_revenue DESC`,
      [farmerId, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)]
    );

    res.json({
      success: true,
      data: {
        monthlySales: monthlySales.rows,
        topCustomers: topCustomers.rows,
        produceBreakdown: produceBreakdown.rows
      }
    });

  } catch (error) {
    console.error('Financial summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
