const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');

// Public list of vets
router.get('/', async (req, res) => {
  const { data, error } = await supabase.from('vets').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ vets: data });
});

module.exports = router;
