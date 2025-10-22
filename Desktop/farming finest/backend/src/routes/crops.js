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
  const { data, error } = await supabase.from('crops').select('*').eq('farmer_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ crops: data });
});

router.post('/', auth, async (req, res) => {
  const payload = Object.assign({}, req.body, { farmer_id: req.user.id });
  const { data, error } = await supabase.from('crops').insert([payload]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ crop: data[0] });
});

router.put('/:id', auth, async (req, res) => {
  const { data, error } = await supabase.from('crops').update(req.body).eq('id', req.params.id).eq('farmer_id', req.user.id).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ crop: data[0] });
});

router.delete('/:id', auth, async (req, res) => {
  const { error } = await supabase.from('crops').delete().eq('id', req.params.id).eq('farmer_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ ok: true });
});

module.exports = router;
