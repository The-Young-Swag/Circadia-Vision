import { cardRepository } from '#/shared/repositories/cardRepository'
import { settingsRepository } from '#/shared/repositories/settingsRepository'

export async function loadReview() {
  const [
    cards,
    adaptiveOptIn,
    calibrationSessions,
  ] = await Promise.all([
    cardRepository.findAll(),
    settingsRepository.getAdaptiveOptIn(),
    settingsRepository.getCalibrationSessions(),
  ])

  return {
    cards,
    adaptiveOptIn: adaptiveOptIn ?? false,
    calibrationSessions: Math.min(
      calibrationSessions,
      5,
    ),
  }
}