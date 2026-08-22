import { db } from '#/shared/lib/db/dexie'
import type { Insight } from '#/shared/types/domain'

export const insightRepository = {
  async findAll(): Promise<Insight[]> {
    return db.insights.toArray()
  },

  async findActive(): Promise<Insight[]> {
    return db.insights
      .filter((insight) => !insight.dismissed)
      .toArray()
  },

  async create(insight: Insight): Promise<void> {
    await db.insights.add(insight)
  },

  async dismiss(id: string): Promise<void> {
    await db.insights.update(id, {
      dismissed: true,
    })
  },

  async clear(): Promise<void> {
    await db.insights.clear()
  },
}