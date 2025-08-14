require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const LIB_API_BASE = process.env.LIB_API_BASE || 'https://api.library.example.com';
const LIB_API_KEY = process.env.LIB_API_KEY;

if (!LIB_API_KEY) {
  console.error('WARNING: LIB_API_KEY is not set. Please create a .env with LIB_API_KEY=your_key');
}

// Simple proxy endpoint: GET /v1/events
app.get('/v1/events', async (req, res) => {
  try {
    const url = new URL('/v1/events', LIB_API_BASE);
    // forward query params
    Object.keys(req.query || {}).forEach(k => url.searchParams.append(k, req.query[k]));

    const resp = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${LIB_API_KEY}`,
        'Accept': 'application/json'
      }
    });
    const data = await resp.json();
    res.status(resp.status).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({error: 'proxy_error', message: err.message});
  }
});

app.listen(PORT, () => console.log(`Library proxy listening on http://localhost:${PORT}`));
