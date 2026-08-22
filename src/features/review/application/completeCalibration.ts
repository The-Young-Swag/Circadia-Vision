import { settingsRepository } from '#/shared/repositories/settingsRepository'

const MAX_CALIBRATION_SESSIONS = 5

export async function completeCalibration(
  currentCount: number,
): Promise<number> {
  const nextCount = Math.min(
    Math.max(currentCount, 0) + 1,
    MAX_CALIBRATION_SESSIONS,
  )

  await settingsRepository.setCalibrationSessions(
    nextCount,
  )

  return nextCount
}