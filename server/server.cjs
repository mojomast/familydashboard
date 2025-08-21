// Simple Express + SQLite (better-sqlite3) backend for Family Dashboard
// Run with: npm run server

const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const Database = require('better-sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

// Database setup
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
const dbPath = path.join(dataDir, 'familydashboard.sqlite');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

// Schema (simple JSON column for recurrence for initial version)
db.exec(`
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  type TEXT NOT NULL,
  due_date TEXT,
  category TEXT,
  assigned_to TEXT,
  archived INTEGER DEFAULT 0,
  recurrence_json TEXT
);

CREATE TABLE IF NOT EXISTS completions (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  completed_at TEXT NOT NULL,
  instance_date TEXT,
  FOREIGN KEY(task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notes (
  date_iso TEXT PRIMARY KEY,
  content TEXT
);

CREATE TABLE IF NOT EXISTS groceries (
  id TEXT PRIMARY KEY,
  date_iso TEXT NOT NULL,
  label TEXT NOT NULL,
  done INTEGER DEFAULT 0,
  meal_task_id TEXT
);
`);

// Helpers
function ok(res, data) { return res.json({ ok: true, data }); }
function bad(res, message, status = 400) { return res.status(status).json({ ok: false, message }); }
function makeId(prefix = 'id') { return `${prefix}_${Date.now()}_${Math.floor(Math.random() * 1e6)}`; }

function rowToTask(row) {
  if (!row) return null;
  let recurrence = undefined;
  if (row.recurrence_json) {
    try { recurrence = JSON.parse(row.recurrence_json); } catch { /* ignore */ }
  }
  return {
    id: row.id,
    title: row.title,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    type: row.type,
    dueDate: row.due_date || undefined,
    category: row.category || undefined,
    assignedTo: row.assigned_to || undefined,
    archived: !!row.archived,
    recurrence,
  };
}

// Routes: tasks
app.get('/api/tasks', (req, res) => {
  const rows = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC').all();
  ok(res, rows.map(rowToTask));
});

app.post('/api/tasks', (req, res) => {
  const t = req.body || {};
  if (!t.title || !t.type) return bad(res, 'title and type are required');
  const id = t.id || makeId('task');
  const createdAt = t.createdAt || new Date().toISOString();
  const recurrence_json = t.recurrence ? JSON.stringify(t.recurrence) : null;
  db.prepare(`INSERT INTO tasks (id, title, notes, created_at, type, due_date, category, assigned_to, archived, recurrence_json)
              VALUES (@id, @title, @notes, @created_at, @type, @due_date, @category, @assigned_to, @archived, @recurrence_json)`)
    .run({
      id,
      title: t.title,
      notes: t.notes || null,
      created_at: createdAt,
      type: t.type,
      due_date: t.dueDate || null,
      category: t.category || null,
      assigned_to: t.assignedTo || null,
      archived: t.archived ? 1 : 0,
      recurrence_json,
    });
  const row = db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
  ok(res, rowToTask(row));
});

app.put('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  const t = req.body || {};
  const recurrence_json = t.recurrence ? JSON.stringify(t.recurrence) : null;
  const stmt = db.prepare(`UPDATE tasks SET
    title=@title,
    notes=@notes,
    type=@type,
    due_date=@due_date,
    category=@category,
    assigned_to=@assigned_to,
    archived=@archived,
    recurrence_json=@recurrence_json
    WHERE id=@id`);
  const info = stmt.run({
    id,
    title: t.title,
    notes: t.notes || null,
    type: t.type,
    due_date: t.dueDate || null,
    category: t.category || null,
    assigned_to: t.assignedTo || null,
    archived: t.archived ? 1 : 0,
    recurrence_json,
  });
  if (info.changes === 0) return bad(res, 'Not found', 404);
  const row = db.prepare('SELECT * FROM tasks WHERE id=?').get(id);
  ok(res, rowToTask(row));
});

app.delete('/api/tasks/:id', (req, res) => {
  const id = req.params.id;
  db.prepare('DELETE FROM tasks WHERE id=?').run(id);
  // Also cascade delete completions for that task
  db.prepare('DELETE FROM completions WHERE task_id=?').run(id);
  ok(res, true);
});

// Routes: completions
app.get('/api/completions', (req, res) => {
  const { date } = req.query;
  let rows;
  if (date) rows = db.prepare('SELECT * FROM completions WHERE instance_date = ?').all(String(date));
  else rows = db.prepare('SELECT * FROM completions').all();
  ok(res, rows.map((r) => ({ id: r.id, taskId: r.task_id, completedAt: r.completed_at, instanceDate: r.instance_date || undefined })));
});

app.post('/api/completions', (req, res) => {
  const { taskId, instanceDate } = req.body || {};
  if (!taskId) return bad(res, 'taskId is required');
  const id = makeId('comp');
  const completedAt = new Date().toISOString();
  db.prepare('INSERT INTO completions (id, task_id, completed_at, instance_date) VALUES (?,?,?,?)')
    .run(id, taskId, completedAt, instanceDate || null);
  ok(res, { id, taskId, completedAt, instanceDate });
});

app.delete('/api/completions', (req, res) => {
  const { taskId, instanceDate } = req.body || {};
  if (!taskId) return bad(res, 'taskId is required');
  if (instanceDate) db.prepare('DELETE FROM completions WHERE task_id=? AND instance_date=?').run(taskId, instanceDate);
  else db.prepare('DELETE FROM completions WHERE task_id=?').run(taskId);
  ok(res, true);
});

// Routes: notes
app.get('/api/notes/:dateIso', (req, res) => {
  const { dateIso } = req.params;
  const row = db.prepare('SELECT content FROM notes WHERE date_iso=?').get(dateIso);
  ok(res, { dateIso, content: row ? row.content : '' });
});

app.put('/api/notes/:dateIso', (req, res) => {
  const { dateIso } = req.params;
  const { content } = req.body || {};
  const exists = db.prepare('SELECT 1 FROM notes WHERE date_iso=?').get(dateIso);
  if (exists) db.prepare('UPDATE notes SET content=? WHERE date_iso=?').run(content || '', dateIso);
  else db.prepare('INSERT INTO notes (date_iso, content) VALUES (?,?)').run(dateIso, content || '');
  ok(res, true);
});

app.delete('/api/notes/:dateIso', (req, res) => {
  const { dateIso } = req.params;
  db.prepare('DELETE FROM notes WHERE date_iso=?').run(dateIso);
  ok(res, true);
});

// Routes: groceries
app.get('/api/groceries', (req, res) => {
  const { date } = req.query;
  let rows;
  if (date) rows = db.prepare('SELECT * FROM groceries WHERE date_iso=? ORDER BY id DESC').all(String(date));
  else rows = db.prepare('SELECT * FROM groceries ORDER BY id DESC').all();
  ok(res, rows.map((r) => ({ id: r.id, dateIso: r.date_iso, label: r.label, done: !!r.done, mealTaskId: r.meal_task_id || undefined })));
});

app.post('/api/groceries', (req, res) => {
  const { dateIso, label, mealTaskId } = req.body || {};
  if (!dateIso || !label) return bad(res, 'dateIso and label are required');
  const id = makeId('item');
  db.prepare('INSERT INTO groceries (id, date_iso, label, done, meal_task_id) VALUES (?,?,?,?,?)')
    .run(id, dateIso, label, 0, mealTaskId || null);
  ok(res, { id, dateIso, label, done: false, mealTaskId });
});

app.put('/api/groceries/:id', (req, res) => {
  const { id } = req.params;
  const { label, done } = req.body || {};
  const info = db.prepare('UPDATE groceries SET label = COALESCE(?, label), done = COALESCE(?, done) WHERE id=?')
    .run(label ?? null, typeof done === 'boolean' ? (done ? 1 : 0) : null, id);
  if (info.changes === 0) return bad(res, 'Not found', 404);
  const r = db.prepare('SELECT * FROM groceries WHERE id=?').get(id);
  ok(res, { id: r.id, dateIso: r.date_iso, label: r.label, done: !!r.done, mealTaskId: r.meal_task_id || undefined });
});

app.delete('/api/groceries/:id', (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM groceries WHERE id=?').run(id);
  ok(res, true);
});

// Health
app.get('/api/health', (req, res) => ok(res, { status: 'ok' }));

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Family Dashboard API listening on http://localhost:${port}`);
});
