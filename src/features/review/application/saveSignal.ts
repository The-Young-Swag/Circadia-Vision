import type { SessionSignal } from '#/shared/types/domain'

import { signalRepository } from '#/shared/repositories/signalRepository'

export async function saveSignal(
  signal: SessionSignal,
): Promise<void> {
  await signalRepository.create(signal)
}