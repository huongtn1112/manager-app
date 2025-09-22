/* eslint-disable no-console */
const express = require('express');
const path = require('path');
const cors = require('cors');
const { Pool } = require('pg');

// Environment
const PORT = process.env.PORT || 3000;
const DATABASE_URL = process.env.DATABASE_URL || process.env.RENDER_DATABASE_URL;

// Postgres pool (Render requires SSL)
let pool = null;
if (DATABASE_URL) {
  pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });
}

async function runMigrations() {
  if (!pool) return;
  await pool.query(`
    create table if not exists todos (
      id text primary key,
      text text not null,
      priority text not null default 'medium',
      completed boolean not null default false,
      tags jsonb default '[]'::jsonb,
      created_at timestamptz not null default now(),
      completed_at timestamptz
    );
  `);
}

function mapRowToTodo(row) {
  return {
    id: row.id,
    text: row.text,
    priority: row.priority,
    completed: row.completed,
    tags: row.tags || [],
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
  };
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

// API health
app.get('/api/health', (req, res) => {
  res.json({ ok: true, hasDatabase: Boolean(pool) });
});

// Todos API compatible with frontend bulk methods
app.get('/api/todos', async (req, res) => {
  try {
    if (!pool) return res.json([]);
    const { rows } = await pool.query('select * from todos order by created_at asc');
    res.json(rows.map(mapRowToTodo));
  } catch (err) {
    console.error('GET /api/todos error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Replace all todos (bulk upsert) to match StorageManager.saveAll
app.put('/api/todos', async (req, res) => {
  try {
    if (!pool) return res.json([]);
    const todos = Array.isArray(req.body) ? req.body : [];
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query('delete from todos');
      for (const t of todos) {
        await client.query(
          `insert into todos (id, text, priority, completed, tags, created_at, completed_at)
           values ($1,$2,$3,$4,$5,$6,$7)
           on conflict (id) do update set
             text = excluded.text,
             priority = excluded.priority,
             completed = excluded.completed,
             tags = excluded.tags,
             created_at = excluded.created_at,
             completed_at = excluded.completed_at`,
          [
            String(t.id),
            t.text || '',
            t.priority || 'medium',
            Boolean(t.completed),
            JSON.stringify(t.tags || []),
            t.createdAt ? new Date(t.createdAt) : new Date(),
            t.completedAt ? new Date(t.completedAt) : null,
          ]
        );
      }
      await client.query('commit');
    } catch (e) {
      await client.query('rollback');
      throw e;
    } finally {
      client.release();
    }
    res.json({ ok: true, count: todos.length });
  } catch (err) {
    console.error('PUT /api/todos error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Clear all todos
app.delete('/api/todos', async (req, res) => {
  try {
    if (!pool) return res.json({ ok: true });
    await pool.query('delete from todos');
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /api/todos error', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Static hosting
app.use(express.static(path.join(__dirname)));
// Fallback to index for direct file hits
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'index.html'));
});

(async () => {
  try {
    await runMigrations();
    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
  } catch (e) {
    console.error('Startup error', e);
    process.exit(1);
  }
})();


