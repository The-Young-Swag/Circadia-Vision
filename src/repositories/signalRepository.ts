import { db, type SessionSignal } from '#/db/dexie'

export const signalRepository = {
  async add(signal: SessionSignal): Promise<void> {
    await db.sessionSignals.add(signal)
  },

  async findBySession(sessionId: string): Promise<SessionSignal[]> {
    return db.sessionSignals.where('sessionId').equals(sessionId).toArray()
  },

  async findRecent(limit = 20): Promise<SessionSignal[]> {
    return db.sessionSignals.orderBy('timestamp').reverse().limit(limit).toArray()
  },
}
