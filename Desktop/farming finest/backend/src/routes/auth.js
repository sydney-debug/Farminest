const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { supabase } = require('../lib/supabaseClient');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

// Register - creates a user in Supabase auth via Admin (service role required) or in users table
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  try {
    // Create user using Supabase Admin (service role) - optional
    // We'll create a simple profile row in 'farmers' table instead
    const { data, error } = await supabase.from('farmers').insert([{ email, name }]).select();
    if (error) return res.status(500).json({ error: error.message });

    const token = jwt.sign({ email, id: data[0].id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, profile: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login - simple email-based login for demo
router.post('/login', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'email required' });

  const { data, error } = await supabase.from('farmers').select('*').eq('email', email).limit(1);
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'user not found' });

  const profile = data[0];
  const token = jwt.sign({ email: profile.email, id: profile.id }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, profile });
});

module.exports = router;
