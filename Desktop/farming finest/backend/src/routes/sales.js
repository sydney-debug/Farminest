const express = require('express');
const router = express.Router();
const { supabase } = require('../lib/supabaseClient');
const jwt = require('jsonwebtoken');
const { createObjectCsvStringifier } = require('csv-writer');
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

function auth(req, res, next){
  const a = req.headers.authorization; if (!a) return res.status(401).json({ error: 'missing' });
  try { req.user = jwt.verify(a.split(' ')[1], JWT_SECRET); next(); } catch(e){ res.status(401).json({ error: 'invalid' }); }
}

router.post('/', auth, async (req, res) => {
  const payload = Object.assign({}, req.body, { farmer_id: req.user.id });
  const { data, error } = await supabase.from('sales').insert([payload]).select();
  if (error) return res.status(500).json({ error: error.message });
  res.json({ sale: data[0] });
});

router.get('/pl', auth, async (req, res) => {
  const { data, error } = await supabase.from('sales').select('*').eq('farmer_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });
  const total = data.reduce((s, r) => s + Number(r.amount || 0), 0);
  res.json({ total, count: data.length, items: data });
});

router.get('/export', auth, async (req, res) => {
  const { data, error } = await supabase.from('sales').select('*').eq('farmer_id', req.user.id);
  if (error) return res.status(500).json({ error: error.message });

  const csvStringifier = createObjectCsvStringifier({ header: [{id:'id',title:'ID'},{id:'item',title:'Item'},{id:'amount',title:'Amount'},{id:'currency',title:'Currency'},{id:'date',title:'Date'}] });
  const header = csvStringifier.getHeaderString();
  const records = csvStringifier.stringifyRecords(data.map(d => ({ id: d.id, item: d.item, amount: d.amount, currency: d.currency, date: d.date })));
  res.setHeader('Content-disposition', 'attachment; filename=sales.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(header + records);
});

module.exports = router;
