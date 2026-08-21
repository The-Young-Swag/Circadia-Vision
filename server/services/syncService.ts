import { kvRepository, syncRepository } from '../repositories/syncRepository.js'

// Application services contain use cases (Guide §24)
// Thin, orchestrated, no HTTP knowledge, no SQL

export const syncService = {
  push(deviceId: string, kind: string, payload: unknown) {
    syncRepository.insertSnapshot(deviceId, kind, JSON.stringify(payload), new Date().toISOString())
  },

  pull(deviceId: string, kind: string): { payload: unknown; createdAt: string } | null {
    const row = syncRepository.findLatest(deviceId, kind)
    if (!row) return null
    return { payload: JSON.parse(row.payload) as unknown, createdAt: row.created_at }
  },
}

export const kvService = {
  set(key: string, value: unknown) {
    kvRepository.upsert(key, JSON.stringify(value), new Date().toISOString())
  },

  get(key: string): unknown | null {
    const row = kvRepository.findByKey(key)
    if (!row) return null
    return JSON.parse(row.value) as unknown
  },
}
