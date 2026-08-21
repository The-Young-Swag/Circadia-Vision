import { db } from '#/shared/lib/db/dexie'

/**
 * Initialize application defaults without fabricating learning data.
 *
 * Circadia must never create cards, review sessions, calibration history,
 * signals, baselines, or insights on behalf of a user.
 *
 * This function is safe to call repeatedly. Existing settings are preserved.
 */
export async function seedIfEmpty(): Promise<void> {
  const defaults = [
    {
      key: 'hasSeenOnboarding',
      value: JSON.stringify(false),
    },
    {
      key: 'adaptiveOptIn',
      value: JSON.stringify(false),
    },
    {
      key: 'calibrationSessions',
      value: JSON.stringify(0),
    },
  ]

  for (const setting of defaults) {
    const existing =
      await db.appSettings.get(setting.key)

    if (!existing) {
      await db.appSettings.put(setting)
    }
  }
}