import {
  db,
  getSetting,
  setSetting,
  SETTINGS_KEYS,
} from '#/shared/lib/db/dexie'

export const settingsRepository = {
  getAdaptiveOptIn(): Promise<boolean | null> {
    return getSetting<boolean | null>(
      SETTINGS_KEYS.adaptiveOptIn,
      null,
    )
  },

  setAdaptiveOptIn(
    value: boolean,
  ): Promise<void> {
    return setSetting(
      SETTINGS_KEYS.adaptiveOptIn,
      value,
    )
  },

  getCalibrationSessions(): Promise<number> {
    return getSetting<number>(
      SETTINGS_KEYS.calibrationSessions,
      0,
    )
  },

  setCalibrationSessions(
    count: number,
  ): Promise<void> {
    return setSetting(
      SETTINGS_KEYS.calibrationSessions,
      count,
    )
  },

  getMetric(key: string): Promise<number> {
    return getSetting<number>(key, 0)
  },

  setMetric(
    key: string,
    value: number,
  ): Promise<void> {
    return setSetting(key, value)
  },

  getAllSettings() {
    return db.appSettings.toArray()
  },

  clear(): Promise<void> {
    return db.appSettings.clear()
  },
}