import { db } from '#/shared/lib/db/dexie'
import type {
  BaselineFeature,
  FeatureName,
} from '#/shared/types/domain'

export const baselineRepository = {
  async findAll(): Promise<BaselineFeature[]> {
    return db.baselineFeatures.toArray()
  },

  async getByName(
    name: FeatureName,
  ): Promise<BaselineFeature | undefined> {
    return db.baselineFeatures.get(name)
  },

  async upsert(
    feature: BaselineFeature,
  ): Promise<void> {
    await db.baselineFeatures.put(feature)
  },

  async clear(): Promise<void> {
    await db.baselineFeatures.clear()
  },
}