import express from 'express'
import cors from 'cors'
import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'

const PORT = Number(process.env.SYNC_PORT ?? 4901)
const DB_PATH = process.env.SYNC_DB ?? join(process.cwd(), 'data', 'circadia-sync.db')

mkdirSync(dirname(DB_PATH), { recursive: true })
const db = new DatabaseSync(DB_PATH)

// Init schema
db.exec(`
  CREATE TABLE IF NOT EXISTS sync_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT NOT NULL,
    kind TEXT NOT NULL, -- cards | sessions | signals
    payload TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS kv (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
`)

const app = express()
app.use(cors())
app.use(express.json({ limit: '5mb' }))

app.get('/health', (_req, res) => {
  res.json({ ok: true, db: DB_PATH, time: new Date().toISOString() })
})

// Push a full snapshot (client -> server). Overwrites last.
app.post('/sync/push', (req, res) => {
  const { deviceId, kind, payload } = req.body as {
    deviceId?: string
    kind?: string
    payload?: unknown
  }
  if (!deviceId || !kind || !payload) {
    res.status(400).json({ error: 'deviceId, kind, payload required' })
    return
  }
  const stmt = db.prepare(
    'INSERT INTO sync_snapshots (device_id, kind, payload, created_at) VALUES (?, ?, ?, ?)',
  )
  stmt.run(deviceId, kind, JSON.stringify(payload), new Date().toISOString())
  res.json({ ok: true })
})

// Pull latest snapshot for a kind
app.get('/sync/pull', (req, res) => {
  const { deviceId, kind } = req.query as { deviceId?: string; kind?: string }
  if (!deviceId || !kind) {
    res.status(400).json({ error: 'deviceId and kind required' })
    return
  }
  const stmt = db.prepare(
    'SELECT payload, created_at FROM sync_snapshots WHERE device_id = ? AND kind = ? ORDER BY id DESC LIMIT 1',
  )
  const row = stmt.get(deviceId, kind) as { payload: string; created_at: string } | undefined
  if (!row) {
    res.json({ payload: null })
    return
  }
  res.json({ payload: JSON.parse(row.payload), createdAt: row.created_at })
})

// Simple KV (for settings)
app.post('/kv', (req, res) => {
  const { key, value } = req.body as { key?: string; value?: unknown }
  if (!key) {
    res.status(400).json({ error: 'key required' })
    return
  }
  const stmt = db.prepare(
    'INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
  )
  stmt.run(key, JSON.stringify(value), new Date().toISOString())
  res.json({ ok: true })
})

app.get('/kv/:key', (req, res) => {
  const stmt = db.prepare('SELECT value FROM kv WHERE key = ?')
  const row = stmt.get(req.params.key) as { value: string } | undefined
  if (!row) {
    res.status(404).json({ error: 'not found' })
    return
  }
  res.json({ value: JSON.parse(row.value) })
})

app.get('/', (_req, res) => {
  res.type('html').send(`
    <h1>Circadia Sync</h1>
    <p>Optional sync backend — core app works offline without it.</p>
    <ul>
      <li>GET /health</li>
      <li>POST /sync/push { deviceId, kind, payload }</li>
      <li>GET /sync/pull?deviceId=&kind=</li>
    </ul>
  `)
})

if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[circadia-sync] listening on http://0.0.0.0:${PORT} db=${DB_PATH}`)
  })
}

export default app
