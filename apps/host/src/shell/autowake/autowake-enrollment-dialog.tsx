import * as React from 'react'
import { CheckIcon, Loader2Icon, MicIcon, SquareIcon } from 'lucide-react'
import { startPcmCapture, type PcmCaptureHandle } from '@platform/voice'
import {
  Button,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@platform/ui'

const SAMPLE_COUNT = 3
const MAX_SAMPLE_SECONDS = 8

interface AutowakeEnrollmentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onEnroll: (clips: Blob[]) => Promise<void>
  isEnrolling: boolean
}

export function AutowakeEnrollmentDialog({
  open,
  onOpenChange,
  onEnroll,
  isEnrolling,
}: AutowakeEnrollmentDialogProps) {
  const [clips, setClips] = React.useState<Blob[]>([])
  const [recording, setRecording] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const captureRef = React.useRef<PcmCaptureHandle | null>(null)

  // State reset adjusted during render (React's documented pattern for
  // "reset state when a prop changes") rather than in a useEffect, matching
  // app-shell.tsx's mobile-nav-on-navigation reset. The capture handle is a
  // ref, not state, so releasing it belongs in an effect below instead —
  // refs can't be read or written during render.
  const [wasOpen, setWasOpen] = React.useState(open)
  if (open !== wasOpen) {
    setWasOpen(open)
    if (!open) {
      setClips([])
      setRecording(false)
      setError(null)
    }
  }

  React.useEffect(() => {
    if (open) return
    captureRef.current?.stop()
    captureRef.current = null
  }, [open])

  async function startSample() {
    setError(null)
    try {
      captureRef.current = await startPcmCapture(MAX_SAMPLE_SECONDS)
      setRecording(true)
    } catch {
      setError('Microphone access was denied or is unavailable.')
    }
  }

  function stopSample() {
    const capture = captureRef.current
    if (!capture) return
    const wav = capture.takeAllWav()
    capture.stop()
    captureRef.current = null
    setRecording(false)
    setClips((prev) => [...prev, wav])
  }

  async function handleSave() {
    try {
      await onEnroll(clips)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed.')
    }
  }

  const remaining = SAMPLE_COUNT - clips.length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enroll your voice</DialogTitle>
          <DialogDescription>
            Record {SAMPLE_COUNT} short samples of yourself speaking naturally — Autowake uses these to make sure
            only your voice can trigger it after "Hey Athena".
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: SAMPLE_COUNT }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full border text-xs',
                  index < clips.length
                    ? 'bg-success text-success-foreground border-success'
                    : 'text-muted-foreground',
                )}
              >
                {index < clips.length ? <CheckIcon className="size-4" /> : index + 1}
              </div>
            ))}
          </div>

          {remaining > 0 ? (
            <Button
              type="button"
              variant={recording ? 'destructive' : 'outline'}
              onClick={recording ? stopSample : startSample}
              disabled={isEnrolling}
            >
              {recording ? <SquareIcon className="mr-2 size-4" /> : <MicIcon className="mr-2 size-4" />}
              {recording ? 'Stop recording' : `Record sample ${clips.length + 1} of ${SAMPLE_COUNT}`}
            </Button>
          ) : (
            <p className="text-muted-foreground text-sm">All samples recorded — ready to save.</p>
          )}

          {error && <p className="text-danger text-xs">{error}</p>}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isEnrolling}>
            Cancel
          </Button>
          <Button type="button" onClick={() => void handleSave()} disabled={remaining > 0 || isEnrolling}>
            {isEnrolling ? <Loader2Icon className="mr-2 size-4 animate-spin" /> : null}
            Save voice profile
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
