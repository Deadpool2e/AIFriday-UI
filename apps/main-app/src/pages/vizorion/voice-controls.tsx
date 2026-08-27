import * as React from 'react'
import { Loader2Icon, MicIcon, SquareIcon } from 'lucide-react'
import { useTranscribeVoice } from '@platform/api-client'
import { Button } from '@platform/ui'
import {
  speakText,
  stopSpeaking,
  isVoiceOutputSupported,
} from '@platform/voice'

export { speakText, stopSpeaking, isVoiceOutputSupported }

interface VoiceControlsProps {
  // Recorded audio is transcribed then sent immediately as a chat message
  // — there's no intermediate "review before sending" step, since
  // ChatPanel (packages/ui) doesn't expose its input value for an
  // external control to populate. Good enough for voice input; a review
  // step would need extending ChatPanel's API.
  onTranscribed: (text: string) => void
  disabled?: boolean
}

// Speech-to-text via Vizorion's POST /v1/voice/transcribe. Voice output
// (reading a reply aloud) is handled separately by speakText() below,
// using the browser's own SpeechSynthesis API — Vizorion has no TTS
// endpoint by design (see Vizorion/app/api/routes/voice.py).
export function VoiceControls({
  onTranscribed,
  disabled = false,
}: VoiceControlsProps) {
  const [recording, setRecording] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const recorderRef = React.useRef<MediaRecorder | null>(null)
  const chunksRef = React.useRef<Blob[]>([])
  const transcribe = useTranscribeVoice()

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data)
      }
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setRecording(false)
        if (blob.size === 0) return
        try {
          const { text } = await transcribe.mutateAsync({
            audio: blob,
            filename: 'recording.webm',
          })
          if (text) onTranscribed(text)
          else setError("Didn't catch any speech in that recording.")
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Transcription failed.')
        }
      }
      recorder.start()
      recorderRef.current = recorder
      setRecording(true)
    } catch {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  function stopRecording() {
    recorderRef.current?.stop()
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        size="icon"
        variant={recording ? 'destructive' : 'outline'}
        disabled={disabled || transcribe.isPending}
        onClick={recording ? stopRecording : startRecording}
        aria-label={recording ? 'Stop recording' : 'Record a voice message'}
        title={recording ? 'Stop recording' : 'Record a voice message'}
      >
        {transcribe.isPending ? (
          <Loader2Icon className="size-4 animate-spin" />
        ) : recording ? (
          <SquareIcon className="size-4" />
        ) : (
          <MicIcon className="size-4" />
        )}
      </Button>
      {error && <span className="text-danger text-xs">{error}</span>}
    </div>
  )
}
