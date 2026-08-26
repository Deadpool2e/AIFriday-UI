// Wake-word detection via the browser's native Web Speech API
// (SpeechRecognition) — zero account, zero SDK, matching the codebase's
// "browser-native where possible" TTS precedent. There's no true
// wake-word spotting engine involved: this just runs continuous speech
// recognition and watches the live transcript for the wake phrase, which
// is the standard zero-infrastructure approach for this kind of feature.

const WAKE_PHRASE = 'hey athena'

// Chrome/Edge periodically end a recognition session on their own even in
// continuous mode — this normalizes both vendor-prefixed and standard
// constructors and centralizes the restart-on-end quirk.
function getSpeechRecognitionCtor(): (new () => SpeechRecognition) | undefined {
  if (typeof window === 'undefined') return undefined
  const w = window as typeof window & {
    SpeechRecognition?: new () => SpeechRecognition
    webkitSpeechRecognition?: new () => SpeechRecognition
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition
}

export function isWakeWordSupported(): boolean {
  return getSpeechRecognitionCtor() !== undefined
}

function normalize(transcript: string): string {
  return transcript
    .toLowerCase()
    .replace(/[.,!?]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

// Tolerates the STT's likely mishearings of "Athena" without loosening the
// match so much that unrelated speech starting with "hey" trips it.
const WAKE_PHRASE_VARIANTS = [WAKE_PHRASE, 'hey athina', 'hay athena']

function matchesWakePhrase(transcript: string): boolean {
  const normalized = normalize(transcript)
  return WAKE_PHRASE_VARIANTS.some((variant) => normalized.includes(variant))
}

export interface WakeWordHandle {
  stop: () => void
}

// onWake fires at most once per start() call — the caller is expected to
// stop() and, once done handling the wake, start a new listening session
// (see use-autowake.ts's idle-listening <-> verifying/recording cycle).
//
// onSpeechEnd fires on the browser's own (fast, local) endpoint detection —
// well before onresult, which waits on the recognition service's round
// trip to return a final transcript. A caller that needs "the audio right
// as the wake phrase was spoken" (e.g. a rolling buffer snapshot for
// speaker verification) should anchor to onSpeechEnd, not to onWake
// itself — by the time onWake/onresult fires, a fixed-size rolling buffer
// has likely already scrolled past the actual utterance and captured
// silence instead.
export function startWakeWordListening(
  onWake: () => void,
  onError?: (message: string) => void,
  onSpeechEnd?: () => void,
): WakeWordHandle {
  const Ctor = getSpeechRecognitionCtor()
  if (!Ctor) {
    onError?.('Wake-word listening is not supported in this browser.')
    return { stop: () => {} }
  }

  let stopped = false
  let recognition: SpeechRecognition | null = null

  function attach() {
    if (stopped) return
    recognition = new Ctor!()
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onspeechend = () => {
      onSpeechEnd?.()
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const transcript = event.results[i][0]?.transcript ?? ''
        if (matchesWakePhrase(transcript)) {
          stopped = true
          recognition?.stop()
          onWake()
          return
        }
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      // "no-speech" and "aborted" are routine in always-on listening —
      // only surface genuine failures (e.g. denied mic permission).
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        stopped = true
        onError?.('Microphone access was denied.')
      }
    }

    recognition.onend = () => {
      if (!stopped) attach() // restart — see the module-level comment on Chrome's auto-end quirk
    }

    recognition.start()
  }

  attach()

  return {
    stop: () => {
      stopped = true
      recognition?.stop()
    },
  }
}
