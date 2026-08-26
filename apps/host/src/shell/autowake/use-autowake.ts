import * as React from 'react'
import { useEnrollSpeaker, useTranscribeVoice, useVerifySpeaker, type useVizorionChat } from '@platform/api-client'
import {
  hasEnrolledProfile,
  isAutowakeEnabled,
  isWakeWordSupported,
  setAutowakeEnabled,
  setHasEnrolledProfile,
  speakText,
  startPcmCapture,
  startWakeWordListening,
} from '@platform/voice'

export type AutowakeState =
  | 'disabled' // toggled off by the user
  | 'not-enrolled' // enabled, but no voice profile recorded yet
  | 'unsupported' // browser lacks SpeechRecognition
  | 'idle-listening'
  | 'verifying'
  | 'rejected'
  | 'recording'
  | 'transcribing'
  | 'thinking'
  | 'speaking'

const ROLLING_BUFFER_SECONDS = 3.5 // "Hey Athena" + lead-in + margin for when onSpeechEnd fires
const REJECTED_FLASH_MS = 1200
const SILENCE_STOP_MS = 1600
const SILENCE_CHECK_INTERVAL_MS = 200
const SILENCE_RMS_THRESHOLD = 0.01

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, ms))
}

// Records the user's question after a verified wake: MediaRecorder/webm
// (unlike the WAV-based wake/verify audio) since this goes straight to the
// existing /v1/voice/transcribe endpoint, which already handles webm fine.
// Resolves on whichever comes first: ~1.6s of silence, or an external
// stopRecordingNow() call via recorderRef.
function recordQuestion(recorderRef: React.MutableRefObject<MediaRecorder | null>): Promise<Blob | null> {
  return new Promise((resolve) => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream)
        const chunks: Blob[] = []
        recorder.ondataavailable = (event) => {
          if (event.data.size > 0) chunks.push(event.data)
        }

        const audioContext = new AudioContext()
        const analyser = audioContext.createAnalyser()
        analyser.fftSize = 2048
        audioContext.createMediaStreamSource(stream).connect(analyser)
        const data = new Uint8Array(analyser.frequencyBinCount)
        let silenceMs = 0
        const silenceTimer = window.setInterval(() => {
          analyser.getByteTimeDomainData(data)
          let sumSquares = 0
          for (let i = 0; i < data.length; i += 1) {
            const v = (data[i] - 128) / 128
            sumSquares += v * v
          }
          const rms = Math.sqrt(sumSquares / data.length)
          silenceMs = rms < SILENCE_RMS_THRESHOLD ? silenceMs + SILENCE_CHECK_INTERVAL_MS : 0
          if (silenceMs >= SILENCE_STOP_MS && recorder.state !== 'inactive') recorder.stop()
        }, SILENCE_CHECK_INTERVAL_MS)

        recorder.onstop = () => {
          window.clearInterval(silenceTimer)
          void audioContext.close()
          stream.getTracks().forEach((track) => track.stop())
          recorderRef.current = null
          resolve(chunks.length > 0 ? new Blob(chunks, { type: 'audio/webm' }) : null)
        }

        recorderRef.current = recorder
        recorder.start()
      })
      .catch(() => resolve(null))
  })
}

interface UseAutowakeOptions {
  // Shared with VizorionLauncher (lifted to app-shell.tsx) so a verified
  // wake streams into the same visible conversation instead of an
  // invisible parallel one.
  chat: ReturnType<typeof useVizorionChat>
  // Fired the moment a wake is speaker-verified, right as recording
  // starts — the natural point to pop the chat panel open. Deliberately
  // not fired on every wake-word hit (only after verification passes), so
  // a rejected/other-voice trigger doesn't flash the panel open.
  onWakeVerified?: () => void
}

export function useAutowake({ chat, onWakeVerified }: UseAutowakeOptions) {
  const [enabled, setEnabled] = React.useState(() => isAutowakeEnabled())
  const [enrolled, setEnrolled] = React.useState(() => hasEnrolledProfile())
  const [state, setState] = React.useState<AutowakeState>('disabled')
  const [error, setError] = React.useState<string | null>(null)

  const supported = React.useMemo(() => isWakeWordSupported(), [])

  const generationRef = React.useRef(0)
  const wakeCancelRef = React.useRef<(() => void) | null>(null)
  const activeRecorderRef = React.useRef<MediaRecorder | null>(null)

  const transcribe = useTranscribeVoice()
  const verifySpeaker = useVerifySpeaker()
  const enrollSpeaker = useEnrollSpeaker()

  const sawStreamingRef = React.useRef(false)
  const speakDoneRef = React.useRef<(() => void) | null>(null)

  // Fires the reply back out loud once the chat stream that started this
  // "thinking" phase actually finishes — watches real state rather than
  // reading chat.messages from a ref, since sendMessage() only resolves
  // Promise<void> and its committed messages land via React state, not
  // something safe to read imperatively right after awaiting it.
  React.useEffect(() => {
    if (state !== 'thinking') {
      sawStreamingRef.current = false
      return
    }
    if (chat.isStreaming) {
      sawStreamingRef.current = true
      return
    }
    if (!sawStreamingRef.current) return // hasn't actually started streaming yet
    sawStreamingRef.current = false

    const last = chat.messages[chat.messages.length - 1]
    setState('speaking')
    const finish = () => {
      speakDoneRef.current?.()
      speakDoneRef.current = null
    }
    if (last && last.role === 'assistant' && last.content) {
      speakText(last.content, finish)
    } else {
      finish()
    }
  }, [state, chat.isStreaming, chat.messages])

  React.useEffect(() => {
    generationRef.current += 1
    const generation = generationRef.current
    const isCurrent = () => generationRef.current === generation

    async function runLifecycle() {
      if (!enabled) {
        setState('disabled')
        return
      }
      if (!supported) {
        setState('unsupported')
        return
      }
      if (!enrolled) {
        setState('not-enrolled')
        return
      }

      setError(null)

      while (isCurrent()) {
        // --- idle-listening: wake-word + rolling verification buffer ---
        setState('idle-listening')
        let pcm
        try {
          pcm = await startPcmCapture(ROLLING_BUFFER_SECONDS)
        } catch {
          if (!isCurrent()) return
          setError('Microphone access was denied or is unavailable.')
          setState('disabled')
          return
        }
        if (!isCurrent()) {
          pcm.stop()
          return
        }

        // Snapshotted at onSpeechEnd (the browser's own fast, local
        // endpoint detection) rather than at onWake/onresult — onresult
        // waits on the recognition service's round trip to return a final
        // transcript, by which point the rolling buffer has often already
        // scrolled past the actual "Hey Athena" utterance and captured
        // trailing silence instead. That silence, sent to the backend,
        // fails Resemblyzer's VAD ("no speech detected") — anchoring here
        // is the fix.
        let speechEndSnapshot: Blob | null = null
        try {
          await new Promise<void>((resolve, reject) => {
            const handle = startWakeWordListening(
              () => resolve(),
              (message) => reject(new Error(message)),
              () => {
                speechEndSnapshot = pcm.snapshotWav(ROLLING_BUFFER_SECONDS)
              },
            )
            wakeCancelRef.current = () => {
              handle.stop()
              reject(new Error('__cancelled__'))
            }
          })
        } catch (err) {
          wakeCancelRef.current = null
          pcm.stop()
          if (!isCurrent()) return
          if (err instanceof Error && err.message === '__cancelled__') return
          setError(err instanceof Error ? err.message : 'Wake-word listening failed.')
          setState('disabled')
          return
        }
        wakeCancelRef.current = null
        if (!isCurrent()) {
          pcm.stop()
          return
        }

        // --- verifying: score the just-spoken wake phrase, no extra wait ---
        setState('verifying')
        // Falls back to a fresh snapshot in the unlikely case onSpeechEnd
        // never fired before onWake (e.g. a very short/clipped utterance).
        const snapshot = speechEndSnapshot ?? pcm.snapshotWav(ROLLING_BUFFER_SECONDS)
        pcm.stop()

        let verified: boolean
        try {
          const result = await verifySpeaker.mutateAsync(snapshot)
          verified = result.verified
        } catch (err) {
          if (!isCurrent()) return
          setError(err instanceof Error ? err.message : 'Speaker verification failed.')
          continue
        }
        if (!isCurrent()) return
        if (!verified) {
          setState('rejected')
          await sleep(REJECTED_FLASH_MS)
          if (!isCurrent()) return
          continue
        }

        // --- recording: the actual question ---
        onWakeVerified?.()
        setState('recording')
        const blob = await recordQuestion(activeRecorderRef)
        if (!isCurrent()) return
        if (!blob || blob.size === 0) continue

        // --- transcribing ---
        setState('transcribing')
        let text = ''
        try {
          const result = await transcribe.mutateAsync({ audio: blob, filename: 'question.webm' })
          text = result.text
        } catch (err) {
          if (!isCurrent()) return
          setError(err instanceof Error ? err.message : 'Transcription failed.')
          continue
        }
        if (!isCurrent()) return
        if (!text) continue

        // --- thinking + speaking: handed off to the effect above, which
        // watches chat.isStreaming/chat.messages and calls speakText ---
        setState('thinking')
        await new Promise<void>((resolve) => {
          speakDoneRef.current = resolve
          void chat.sendMessage(text)
        })
        if (!isCurrent()) return
        // loop back to idle-listening
      }
    }

    void runLifecycle()

    return () => {
      generationRef.current += 1
      wakeCancelRef.current?.()
      wakeCancelRef.current = null
      if (activeRecorderRef.current && activeRecorderRef.current.state !== 'inactive') {
        activeRecorderRef.current.stop()
      }
      activeRecorderRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, enrolled, supported])

  const toggleEnabled = React.useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      setAutowakeEnabled(next)
      return next
    })
  }, [])

  const enroll = React.useCallback(
    async (clips: Blob[]) => {
      await enrollSpeaker.mutateAsync(clips)
      setHasEnrolledProfile(true)
      setEnrolled(true)
    },
    [enrollSpeaker],
  )

  const stopRecordingNow = React.useCallback(() => {
    if (activeRecorderRef.current && activeRecorderRef.current.state !== 'inactive') {
      activeRecorderRef.current.stop()
    }
  }, [])

  return {
    state,
    error,
    enabled,
    enrolled,
    supported,
    toggleEnabled,
    stopRecordingNow,
    enroll,
    isEnrolling: enrollSpeaker.isPending,
  }
}
