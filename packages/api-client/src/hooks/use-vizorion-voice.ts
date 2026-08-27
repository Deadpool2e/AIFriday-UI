import { useMutation } from '@tanstack/react-query'

import { resolveVizorionService } from '../vizorion/env'
import { vizorionClient } from '../vizorion/client'

// Fewer params than the real signature is fine — TS function types are
// compatible when extra args the mock never reads are simply ignored.
async function mockTranscribe(): Promise<{ text: string }> {
  return {
    text: '(mock transcription — set VITE_VIZORION_USE_MOCK=false for real speech-to-text)',
  }
}

const transcribeVoice = resolveVizorionService(
  mockTranscribe,
  vizorionClient.transcribeVoice,
)

export function useTranscribeVoice() {
  return useMutation({
    mutationFn: ({
      audio,
      filename,
      language,
    }: {
      audio: Blob
      filename: string
      language?: string
    }) => transcribeVoice(audio, filename, language),
  })
}
