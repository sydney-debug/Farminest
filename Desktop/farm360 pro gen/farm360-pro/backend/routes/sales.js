const express = require('express');
const Joi = require('joi');
const { query, transaction } = require('../models/database');
const { authenticate, requireFarmer } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const customerSchema = Joi.object({
  name: Joi.string().min(1).required(),
  contact: Joi.string().optional(),
  email: Joi.string().email().optional(),
  address: Joi.string().optional(),
  locationCoordinates: Joi.string().optional()
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

// Customer Management Routes

// Get all customers
router.get('/customers', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    const customers = await query(
      `SELECT c.*, COUNT(s.id) as total_transactions,
       SUM(s.total_amount) as total_purchases,
       SUM(s.amount_pending) as total_debt
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id AND s.farmer_id = $1
       WHERE c.farmer_id = $1
       GROUP BY c.id
       ORDER BY c.created_at DESC`,
      [farmerId]
    );

    res.json({
      success: true,
      data: customers.rows
    });

  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get single customer
router.get('/customers/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const customerId = req.params.id;

    const customer = await query(
      `SELECT c.*, COUNT(s.id) as total_transactions,
       SUM(s.total_amount) as total_purchases,
       SUM(s.amount_pending) as total_debt
       FROM customers c
       LEFT JOIN sales s ON c.id = s.customer_id AND s.farmer_id = $1
       WHERE c.id = $2 AND c.farmer_id = $1
       GROUP BY c.id`,
      [farmerId, customerId]
    );

    if (customer.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer.rows[0]
    });

  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new customer
router.post('/customers', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, contact, email, address, locationCoordinates } = value;
    const farmerId = req.user.id;

    const result = await query(
      `INSERT INTO customers (farmer_id, name, contact, email, address, location_coordinates)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [farmerId, name, contact, email, address, locationCoordinates]
    );

    res.status(201).json({
      success: true,
      message: 'Customer created successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update customer
router.put('/customers/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = customerSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { name, contact, email, address, locationCoordinates } = value;
    const farmerId = req.user.id;
    const customerId = req.params.id;

    const result = await query(
      `UPDATE customers
       SET name = $1, contact = $2, email = $3, address = $4, location_coordinates = $5, updated_at = CURRENT_TIMESTAMP
       WHERE id = $6 AND farmer_id = $7
       RETURNING *`,
      [name, contact, email, address, locationCoordinates, customerId, farmerId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Delete customer
router.delete('/customers/:id', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const customerId = req.params.id;

    // Check if customer has any sales
    const salesCount = await query(
      'SELECT COUNT(*) as count FROM sales WHERE customer_id = $1 AND farmer_id = $2',
      [customerId, farmerId]
    );

    if (parseInt(salesCount.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete customer with existing sales records'
      });
    }

    const result = await query(
      'DELETE FROM customers WHERE id = $1 AND farmer_id = $2',
      [customerId, farmerId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      message: 'Customer deleted successfully'
    });

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Sales Management Routes

// Get all sales
router.get('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { customer_id, payment_status } = req.query;

    let queryText = `
      SELECT s.*, c.name as customer_name, p.name as produce_name
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      LEFT JOIN produce p ON s.produce_id = p.id
      WHERE s.farmer_id = $1`;
    let queryParams = [farmerId];
    let paramIndex = 2;

    if (customer_id) {
      queryText += ` AND s.customer_id = $${paramIndex}`;
      queryParams.push(customer_id);
      paramIndex++;
    }

    if (payment_status) {
      queryText += ` AND s.payment_status = $${paramIndex}`;
      queryParams.push(payment_status);
    }

    queryText += ` ORDER BY s.sale_date DESC`;

    const result = await query(queryText, queryParams);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Create new sale
router.post('/', authenticate, requireFarmer, async (req, res) => {
  try {
    const { error, value } = saleSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { customerId, productName, quantity, unitPrice, produceId, saleDate, notes } = value;
    const farmerId = req.user.id;

    // Validate customer belongs to farmer
    const customer = await query(
      'SELECT id FROM customers WHERE id = $1 AND farmer_id = $2',
      [customerId, farmerId]
    );

    if (customer.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid customer ID'
      });
    }

    // Validate produce belongs to farmer if provided
    if (produceId) {
      const produce = await query(
        'SELECT id FROM produce WHERE id = $1 AND farmer_id = $2',
        [produceId, farmerId]
      );

      if (produce.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid produce ID'
        });
      }
    }

    const totalAmount = quantity * unitPrice;

    const result = await transaction(async (client) => {
      // Create sale record
      const saleResult = await client.query(
        `INSERT INTO sales (farmer_id, customer_id, product_name, quantity, unit_price, total_amount, produce_id, sale_date, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [farmerId, customerId, productName, quantity, unitPrice, totalAmount, produceId, saleDate, notes]
      );

      return saleResult.rows[0];
    });

    res.status(201).json({
      success: true,
      message: 'Sale recorded successfully',
      data: result
    });

  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Update payment status
router.patch('/:id/payment', authenticate, requireFarmer, async (req, res) => {
  try {
    const { amountPaid, paymentStatus } = req.body;
    const farmerId = req.user.id;
    const saleId = req.params.id;

    // Validate payment status
    const validStatuses = ['paid', 'partial', 'pending'];
    if (paymentStatus && !validStatuses.includes(paymentStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid payment status'
      });
    }

    // Get current sale
    const currentSale = await query(
      'SELECT * FROM sales WHERE id = $1 AND farmer_id = $2',
      [saleId, farmerId]
    );

    if (currentSale.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Sale not found'
      });
    }

    const sale = currentSale.rows[0];
    let newAmountPaid = sale.amount_paid;
    let newAmountPending = sale.amount_pending;
    let newPaymentStatus = sale.payment_status;

    if (amountPaid !== undefined) {
      newAmountPaid = amountPaid;
      newAmountPending = sale.total_amount - amountPaid;

      // Determine payment status
      if (newAmountPending <= 0) {
        newPaymentStatus = 'paid';
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'partial';
      } else {
        newPaymentStatus = 'pending';
      }
    }

    if (paymentStatus) {
      newPaymentStatus = paymentStatus;
    }

    const result = await query(
      `UPDATE sales
       SET amount_paid = $1, amount_pending = $2, payment_status = $3, updated_at = CURRENT_TIMESTAMP
       WHERE id = $4 AND farmer_id = $5
       RETURNING *`,
      [newAmountPaid, newAmountPending, newPaymentStatus, saleId, farmerId]
    );

    res.json({
      success: true,
      message: 'Payment status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Update payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Get sales summary
router.get('/summary', authenticate, requireFarmer, async (req, res) => {
  try {
    const farmerId = req.user.id;

    // Get total sales and revenue
    const totalStats = await query(
      `SELECT
        COUNT(*) as total_sales,
        SUM(total_amount) as total_revenue,
        SUM(amount_paid) as total_paid,
        SUM(amount_pending) as total_pending
       FROM sales WHERE farmer_id = $1`,
      [farmerId]
    );

    // Get monthly sales for the last 6 months
    const monthlySales = await query(
      `SELECT
        DATE_TRUNC('month', sale_date) as month,
        SUM(total_amount) as revenue,
        COUNT(*) as sales_count
       FROM sales
       WHERE farmer_id = $1 AND sale_date >= $2
       GROUP BY DATE_TRUNC('month', sale_date)
       ORDER BY month DESC LIMIT 6`,
      [farmerId, new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)]
    );

    // Get top customers by revenue
    const topCustomers = await query(
      `SELECT
        c.name,
        SUM(s.total_amount) as total_revenue,
        SUM(s.amount_pending) as total_debt,
        COUNT(s.id) as transaction_count
       FROM customers c
       JOIN sales s ON c.id = s.customer_id
       WHERE s.farmer_id = $1
       GROUP BY c.id, c.name
       ORDER BY total_revenue DESC LIMIT 5`,
      [farmerId]
    );

    res.json({
      success: true,
      data: {
        total: totalStats.rows[0],
        monthly: monthlySales.rows,
        topCustomers: topCustomers.rows
      }
    });

  } catch (error) {
    console.error('Sales summary error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
