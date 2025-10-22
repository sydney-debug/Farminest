const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('agrovets').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ agrovets: data });
});

router.get('/:id/products', async (req, res) => {
  const { data, error } = await supabase.from('agrovet_products').select('*').eq('agrovet_id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ products: data });
});

module.exports = router;
