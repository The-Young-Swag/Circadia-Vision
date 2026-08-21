import { db } from '#/shared/lib/db/dexie'
import type {
  BaselineFeature,
  FeatureName,
} from '#/shared/types/domain'
import { createEmptyBaseline } from '#/shared/lib/baseline'
import type { BaselineMap } from '#/shared/lib/baseline'

export const baselineRepository = {
  async getAll(): Promise<BaselineMap> {
    const rows = await db.baselineFeatures.toArray()
    const map = createEmptyBaseline()

    for (const row of rows) {
      map[row.name] = {
        mean: row.mean,
        variance: row.variance,
        stddev: row.stddev,
        sampleCount: row.sampleCount,
      }
    }

    return map
  },

  async getByName(
    name: FeatureName,
  ): Promise<BaselineFeature | undefined> {
    return db.baselineFeatures.get(name)
  },

  async upsert(feature: BaselineFeature): Promise<void> {
    await db.baselineFeatures.put(feature)
  },
}