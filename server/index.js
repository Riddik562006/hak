const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const databaseUrl = process.env.DATABASE_URL;
let pool = null;
let inMemoryRequests = null;
if (databaseUrl) {
  pool = new Pool({ connectionString: databaseUrl });
} else {
  // Fallback in-memory store for development when no DATABASE_URL provided
  inMemoryRequests = [];
  console.warn('WARNING: DATABASE_URL not set — using in-memory store. Data will be lost on restart.');
}

// Simple health
app.get('/', (req, res) => res.json({ ok: true }));

// Create a new access request (fast or detailed)
app.post('/api/requests', async (req, res) => {
  const { userId, secretType, justification, durationDays } = req.body;
  if (!userId || !secretType) return res.status(400).json({ error: 'userId and secretType required' });

  const id = uuidv4();
  const requestedAt = new Date().toISOString();
  try {
    if (pool) {
      await pool.query(
        `INSERT INTO access_requests(id, user_id, secret_type, status, secret_value, justification, duration_days, requested_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8)`,
        [id, userId, secretType, 'PENDING', null, justification || null, durationDays || 0, requestedAt]
      );
      res.json({ id, userId, secretType, status: 'PENDING', requestedAt });
    } else {
      const rec = { id, user_id: userId, secret_type: secretType, status: 'PENDING', secret_value: null, justification: justification || null, duration_days: durationDays || 0, requested_at: requestedAt };
      inMemoryRequests.push(rec);
      res.json({ id, userId, secretType, status: 'PENDING', requestedAt });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

// Get requests for a user
app.get('/api/requests/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    if (pool) {
      const result = await pool.query('SELECT * FROM access_requests WHERE user_id = $1 ORDER BY requested_at DESC', [userId]);
      res.json(result.rows.map(r => ({
        id: r.id,
        userId: r.user_id,
        secretType: r.secret_type,
        status: r.status,
        secretValue: r.secret_value,
        justification: r.justification,
        durationDays: r.duration_days,
        requestedAt: r.requested_at
      })));
    } else {
      const rows = inMemoryRequests.filter(r => r.user_id === userId).sort((a,b) => new Date(b.requested_at) - new Date(a.requested_at));
      res.json(rows.map(r => ({ id: r.id, userId: r.user_id, secretType: r.secret_type, status: r.status, secretValue: r.secret_value, justification: r.justification, durationDays: r.duration_days, requestedAt: r.requested_at })));
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

// Simple admin endpoint to grant/deny (for dev)
app.post('/api/requests/:id/decision', async (req, res) => {
  const { id } = req.params;
  const { status, secretValue } = req.body; // status: GRANTED or DENIED
  if (!['GRANTED','DENIED'].includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    if (pool) {
      await pool.query('UPDATE access_requests SET status=$1, secret_value=$2 WHERE id=$3', [status, secretValue || null, id]);
      res.json({ ok: true });
    } else {
      const idx = inMemoryRequests.findIndex(r => r.id === id);
      if (idx === -1) return res.status(404).json({ error: 'not_found' });
      inMemoryRequests[idx].status = status;
      inMemoryRequests[idx].secret_value = secretValue || null;
      res.json({ ok: true });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'db_error' });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Server listening on ${port}`));
