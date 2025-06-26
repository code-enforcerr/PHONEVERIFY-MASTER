const express = require('express');
const multer = require('multer');
const fs = require('fs');
const axios = require('axios');
const cors = require('cors');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

const NUMVERIFY_BASE = 'http://apilayer.net/api/validate';
const API_KEY = process.env.NUMVERIFY_API_KEY;
const RESULTS_FILE = './results.json';

let lastResults = [];


if (fs.existsSync(RESULTS_FILE)) {
  const saved = fs.readFileSync(RESULTS_FILE, 'utf8');
  try {
    lastResults = JSON.parse(saved);
  } catch (e) {
    console.error('❌ Failed to parse results.json:', e.message);
    lastResults = [];
  }
}

app.get('/api/verify-one', async (req, res) => {
  const raw = req.query.number;
  if (!raw) return res.status(400).json({ error: 'Missing number' });

  const digitsOnly = raw.replace(/[^\d]/g, '');
  const formatted = digitsOnly.length === 10 ? '1' + digitsOnly : digitsOnly;

  try {
    const { data } = await axios.get(NUMVERIFY_BASE, {
      params: {
        access_key: API_KEY,
        number: formatted,
        format: 1,
      },
    });

    if (data.error) {
      console.warn(`❌ API error for ${raw}:`, data.error.info);
      return res.json({
        number: raw,
        type: 'error',
        carrier: 'error',
        valid: false,
        error: data.error.info,
      });
    }

    if (!data.valid) {
      return res.json({
        number: raw,
        type: 'invalid',
        carrier: data.carrier || 'unknown',
        valid: false,
      });
    }

    return res.json({
      number: raw,
      type: data.line_type || 'unknown',
      carrier: data.carrier || 'unknown',
      valid: true,
    });
  } catch (err) {
    console.error(`💥 Request failed for ${raw}:`, err.message);
    return res.json({
      number: raw,
      type: 'error',
      carrier: 'error',
      valid: false,
      error: err.message,
    });
  }
});


app.post('/api/save-results', (req, res) => {
  const { results } = req.body;

  if (!Array.isArray(results) || results.length === 0) {
    return res.status(400).json({ error: 'No results received' });
  }

  lastResults = results;

  
  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2));

  res.json({ message: 'Results saved on server' });
});

app.get('/api/download', (req, res) => {
  if (!lastResults.length) {
    return res.status(400).json({ error: 'No results to download yet' });
  }

  const fields = ['number', 'type', 'carrier', 'valid'];
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(lastResults);

  res.setHeader('Content-Disposition', 'attachment; filename=results.csv');
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

app.get('/api/download/:type', (req, res) => {
  const { type } = req.params;

  if (!lastResults.length) {
    return res.status(400).json({ error: 'No results to download yet' });
  }

  const filtered = lastResults.filter(item => item.type === type);

  if (!filtered.length) {
    return res.status(404).json({ error: `No results of type "${type}" found` });
  }

  const fields = ['number', 'type', 'carrier', 'valid'];
  const json2csv = new Parser({ fields });
  const csv = json2csv.parse(filtered);

  res.setHeader('Content-Disposition', `attachment; filename=${type}-results.csv`);
  res.setHeader('Content-Type', 'text/csv');
  res.send(csv);
});

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001');
});