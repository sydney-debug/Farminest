const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next){
  const a = req.headers.authorization; if (!a) return res.status(401).json({ error: 'missing' });
  try { req.user = jwt.verify(a.split(' ')[1], JWT_SECRET); next(); } catch(e){ res.status(401).json({ error: 'invalid' }); }
}

router.get('/', auth, async (req, res) => {
  const { data, error } = await supabase.from('feeds').select('*').eq('farmer_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ feeds: data });
});

router.post('/', auth, async (req, res) => {
  const payload = Object.assign({}, req.body, { farmer_id: req.user.id });
  const { data, error } = await supabase.from('feeds').insert([payload]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ feed: data[0] });
});

// low-stock alerts for farmer
router.get('/alerts', auth, async (req, res) => {
  const { data, error } = await supabase.from('feeds').select('*').eq('farmer_id', req.user.id).lte('quantity', 'threshold');
  if (error) return res.status(500).json({ error: error.message });
  res.json({ alerts: data });
});

module.exports = router;
