const express = require('express');
const { Client } = require('pg');

const app = express();
const port = process.env.PORT || 3000;
const dbUrl = process.env.DATABASE_URL || '';

app.get('/health', async (_req, res) => {
  if (!dbUrl) {
    return res.json({ ok: true, db: 'skip' });
  }
  try {
    const client = new Client({ connectionString: dbUrl });
    await client.connect();
    await client.query('select 1');
    await client.end();
    return res.json({ ok: true, db: 'ok' });
  } catch (err) {
    return res.status(503).json({ ok: false, db: 'error', error: String(err && err.message ? err.message : err) });
  }
});

app.get('/api/hello', (_req, res) => {
  res.json({ message: 'hello from relay-smoke' });
});

app.listen(port, () => {
  console.log(`relay-smoke api listening on ${port}`);
});
