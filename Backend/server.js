const express = require('express');
const multer = require('multer');
const fs = require('fs');
const csvParser = require('csv-parser');
const axios = require('axios');
const cors = require('cors');
const { Parser } = require('json2csv');
require('dotenv').config();

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());

const NUMVERIFY_BASE = 'http://apilayer.net/api/validate';
const API_KEY = process.env.NUMVERIFY_API_KEY;

let lastResults = [];

app.post('/api/upload', upload.single('numbers'), (req, res) => {
    const filePath = req.file.path;
    const numbers = [];
  
    fs.createReadStream(filePath)
      .pipe(csvParser({ headers: false }))
      .on('data', row => {
        const number = Object.values(row)[0];
        if (number) numbers.push(number.trim());
      })
      .on('end', async () => {
        const results = [];
        const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
  
        for (let i = 0; i < numbers.length; i++) {
          const raw = numbers[i];
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
  
        
              if (data.error.code === 104) {
                return res.status(429).json({
                  error: 'Monthly API usage limit reached. Please upgrade your subscription plan.'
                });
              }
  
              results.push({
                number: raw,
                type: 'error',
                carrier: 'error',
                valid: false,
                error: data.error.info,
              });
            } else if (!data.valid) {
              results.push({
                number: raw,
                type: 'invalid',
                carrier: data.carrier || 'unknown',
                valid: false,
              });
            } else {
              results.push({
                number: raw,
                type: data.line_type || 'unknown',
                carrier: data.carrier || 'unknown',
                valid: true,
              });
            }
          } catch (err) {
            console.error(`💥 Request failed for ${raw}:`, err.message);
            results.push({
              number: raw,
              type: 'error',
              carrier: 'error',
              valid: false,
            });
          }
  
          await delay(500);
        }
  
        lastResults = results;
        res.json({ total: results.length, results });
      });
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

app.listen(3001, () => {
  console.log('✅ Server running on http://localhost:3001');
});
