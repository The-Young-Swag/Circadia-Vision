import { db } from '#/shared/lib/db/dexie'
import type { SessionSignal } from '#/shared/types/domain'

export const signalRepository = {
  async findAll(): Promise<SessionSignal[]> {
    return db.sessionSignals.toArray()
  },

  async findRecent(
    limit = 100,
  ): Promise<SessionSignal[]> {
    const signals = await db.sessionSignals
      .orderBy('timestamp')
      .reverse()
      .limit(limit)
      .toArray()

    return signals.reverse()
  },

  async findBySessionId(
    sessionId: string,
  ): Promise<SessionSignal[]> {
    return db.sessionSignals
      .where('sessionId')
      .equals(sessionId)
      .toArray()
  },

  async create(signal: SessionSignal): Promise<void> {
    await db.sessionSignals.add(signal)
  },

  async clear(): Promise<void> {
    await db.sessionSignals.clear()
  },
}