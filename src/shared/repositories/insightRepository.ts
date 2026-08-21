import { db  } from '#/shared/lib/db/dexie'
import type {Insight} from '#/shared/lib/db/dexie';

export const insightRepository = {
  async findAll(): Promise<Insight[]> {
    return db.insights.toArray()
  },

  async create(insight: Insight): Promise<void> {
    await db.insights.add(insight)
  },

  async clearAll(): Promise<void> {
    await db.insights.clear()
  },
}
