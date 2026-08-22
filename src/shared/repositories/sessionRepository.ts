import { db } from '#/shared/lib/db/dexie'
import type { ReviewSession } from '#/shared/types/domain'

export const sessionRepository = {
  async findAll(): Promise<ReviewSession[]> {
    return db.reviewSessions.toArray()
  },

  async findById(
    id: string,
  ): Promise<ReviewSession | undefined> {
    return db.reviewSessions.get(id)
  },

  async findBySessionId(
    sessionId: string,
  ): Promise<ReviewSession[]> {
    return db.reviewSessions
      .where('sessionId')
      .equals(sessionId)
      .toArray()
  },

  async create(session: ReviewSession): Promise<void> {
    await db.reviewSessions.add(session)
  },

  async clear(): Promise<void> {
    await db.reviewSessions.clear()
  },
}