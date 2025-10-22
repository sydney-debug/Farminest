const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function authMiddleware(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'missing auth' });
  const parts = auth.split(' ');
  if (parts.length !== 2) return res.status(401).json({ error: 'invalid auth header' });
  const token = parts[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
}

// List animals for farmer
router.get('/', authMiddleware, async (req, res) => {
  const farmerId = req.user.id;
  const { data, error } = await supabase.from('animals').select('*,health_records(*)').eq('farmer_id', farmerId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ animals: data });
});

// Create animal
router.post('/', authMiddleware, async (req, res) => {
  const farmerId = req.user.id;
  const payload = Object.assign({}, req.body, { farmer_id: farmerId });
  const { data, error } = await supabase.from('animals').insert([payload]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ animal: data[0] });
});

// Update animal
router.put('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const farmerId = req.user.id;
  const { data, error } = await supabase.from('animals').update(req.body).eq('id', id).eq('farmer_id', farmerId).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ animal: data[0] });
});

// Delete animal
router.delete('/:id', authMiddleware, async (req, res) => {
  const id = req.params.id;
  const farmerId = req.user.id;
  const { data, error } = await supabase.from('animals').delete().eq('id', id).eq('farmer_id', farmerId);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

// Add health record
router.post('/:id/health', authMiddleware, async (req, res) => {
  const animalId = req.params.id;
  const farmerId = req.user.id;
  const record = Object.assign({}, req.body, { animal_id: animalId, recorded_by: farmerId });
  const { data, error } = await supabase.from('health_records').insert([record]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ record: data[0] });
});

module.exports = router;
