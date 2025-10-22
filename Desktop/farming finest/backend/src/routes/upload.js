const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const fetch = require('node-fetch');

// POST /api/upload (multipart/form-data) file field 'file'
router.post('/', upload.single('file'), async (req, res) => {
  const file = req.file;
  if (!file) return res.status(400).json({ error: 'missing file' });
  const path = `images/${Date.now()}_${file.originalname}`;

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'storage not configured' });

  const url = `${SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent('public')}/${encodeURIComponent(path)}`;

  // Prefer using supabase-js but avoid adding extra complexity here: call Storage API
  const putUrl = `${process.env.SUPABASE_URL}/storage/v1/object/${encodeURIComponent('public')}/${encodeURIComponent(path)}`;
  const r = await fetch(putUrl, { method: 'PUT', headers: { Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': file.mimetype }, body: file.buffer });
  if (!r.ok) return res.status(500).json({ error: 'upload failed', status: r.status });
  const publicUrl = `${process.env.SUPABASE_URL}/storage/v1/object/public/${encodeURIComponent('public')}/${encodeURIComponent(path)}`;
  res.json({ path, publicUrl });
});

module.exports = router;
