import { db, type BaselineFeature } from '#/db/dexie'
import { type BaselineMap, createEmptyBaseline, type FeatureName } from '#/lib/baseline'

export const baselineRepository = {
  async getAll(): Promise<BaselineMap> {
    const rows = await db.baselineFeatures.toArray()
    const map = createEmptyBaseline()
    for (const r of rows as BaselineFeature[]) {
      map[r.name as FeatureName] = {
        mean: r.mean,
        variance: r.variance,
        stddev: r.stddev,
        sampleCount: r.sampleCount,
      }
    }
    return map
  },

  async getByName(name: FeatureName): Promise<BaselineFeature | undefined> {
    return db.baselineFeatures.get(name)
  },

  async upsert(feature: BaselineFeature): Promise<void> {
    await db.baselineFeatures.put(feature)
  },
}
