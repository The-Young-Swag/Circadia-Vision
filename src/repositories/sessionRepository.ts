import { db, type ReviewSession } from '#/db/dexie'

export const sessionRepository = {
  async findAll(): Promise<ReviewSession[]> {
    return db.reviewSessions.toArray()
  },

  async findBySessionId(sessionId: string): Promise<ReviewSession[]> {
    return db.reviewSessions.where('sessionId').equals(sessionId).toArray()
  },

  async create(session: ReviewSession): Promise<void> {
    await db.reviewSessions.add(session)
  },
}
