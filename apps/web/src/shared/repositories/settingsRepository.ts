import {
  db,
  getSetting,
  setSetting,
  SETTINGS_KEYS,
} from '#/shared/lib/db/dexie'

export const settingsRepository = {
  async getAdaptiveOptIn(): Promise<boolean | null> {
    return getSetting<boolean | null>(SETTINGS_KEYS.adaptiveOptIn, null)
  },

  async setAdaptiveOptIn(value: boolean): Promise<void> {
    await setSetting(SETTINGS_KEYS.adaptiveOptIn, value)
  },

  async getCalibrationSessions(): Promise<number> {
    return getSetting<number>(SETTINGS_KEYS.calibrationSessions, 0)
  },

  async setCalibrationSessions(n: number): Promise<void> {
    await setSetting(SETTINGS_KEYS.calibrationSessions, n)
  },

  async getAllSettings() {
    return db.appSettings.toArray()
  },
}
