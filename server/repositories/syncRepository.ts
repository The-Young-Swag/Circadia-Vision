import { db } from '../db/client.js'

// Repository owns persistence (Guide §25) — SQL never in controllers/services
// If we migrate node:sqlite → Postgres, only this file changes.

export const syncRepository = {
  insertSnapshot(deviceId: string, kind: string, payloadJson: string, createdAt: string) {
    const stmt = db.prepare('INSERT INTO sync_snapshots (device_id, kind, payload, created_at) VALUES (?, ?, ?, ?)')
    stmt.run(deviceId, kind, payloadJson, createdAt)
  },

  findLatest(deviceId: string, kind: string): { payload: string; created_at: string } | undefined {
    const stmt = db.prepare('SELECT payload, created_at FROM sync_snapshots WHERE device_id = ? AND kind = ? ORDER BY id DESC LIMIT 1')
    return stmt.get(deviceId, kind) as { payload: string; created_at: string } | undefined
  },
}

export const kvRepository = {
  upsert(key: string, valueJson: string, updatedAt: string) {
    const stmt = db.prepare(
      'INSERT INTO kv (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_at=excluded.updated_at',
    )
    stmt.run(key, valueJson, updatedAt)
  },

  findByKey(key: string): { value: string } | undefined {
    const stmt = db.prepare('SELECT value FROM kv WHERE key = ?')
    return stmt.get(key) as { value: string } | undefined
  },
}
