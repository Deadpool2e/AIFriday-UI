import type { AutowakeState } from './use-autowake'

// Shared between AutowakeWidget (the status FAB) and VizorionLauncher
// (which shows a "currently listening" banner inside the chat panel
// itself once a wake is verified) so the wording stays in sync.
export const AUTOWAKE_STATE_LABEL: Record<AutowakeState, string> = {
  disabled: 'Autowake is off',
  'not-enrolled': 'Enroll your voice to enable Autowake',
  unsupported: 'Not supported in this browser',
  'idle-listening': 'Listening for "Hey Athena"',
  verifying: 'Verifying your voice…',
  rejected: "That didn't sound like you",
  recording: 'Listening for your question…',
  transcribing: 'Transcribing…',
  thinking: 'Thinking…',
  speaking: 'Speaking…',
}

// States worth surfacing inside VizorionLauncher's panel — i.e. once a
// wake has been verified and the panel has opened for it. idle-listening
// stays out: that's the ambient always-on state, not something tied to
// "the panel is open because of a wake."
export const AUTOWAKE_PANEL_STATES: AutowakeState[] = [
  'verifying',
  'recording',
  'transcribing',
  'thinking',
  'speaking',
]
