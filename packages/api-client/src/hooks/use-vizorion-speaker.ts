import { useMutation } from '@tanstack/react-query'

import { resolveVizorionService } from '../vizorion/env'
import { vizorionClient } from '../vizorion/client'

async function mockEnrollSpeaker(): Promise<{ enrolled: boolean }> {
  return { enrolled: true }
}

async function mockVerifySpeaker(): Promise<{
  score: number
  verified: boolean
}> {
  return { score: 0.9, verified: true }
}

const enrollSpeaker = resolveVizorionService(
  mockEnrollSpeaker,
  vizorionClient.enrollSpeaker,
)
const verifySpeaker = resolveVizorionService(
  mockVerifySpeaker,
  vizorionClient.verifySpeaker,
)

export function useEnrollSpeaker() {
  return useMutation({
    mutationFn: (clips: Blob[]) => enrollSpeaker(clips),
  })
}

export function useVerifySpeaker() {
  return useMutation({
    mutationFn: (clip: Blob) => verifySpeaker(clip),
  })
}
