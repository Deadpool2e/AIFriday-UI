// Voice output via the browser's own SpeechSynthesis API — Vizorion has no
// TTS endpoint by design (see Vizorion/app/api/routes/voice.py). Moved here
// from apps/main-app/src/pages/vizorion/voice-controls.tsx so apps/host's
// Autowake widget can use it too (apps can't statically import each
// other's source under Module Federation).

// Strips markdown syntax so it isn't read aloud literally (e.g. "asterisk
// asterisk Best UX..." instead of "Best UX...") — mirrors
// Vizorion/examples/web/src/voice.ts's toSpeechText().
function toSpeechText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' code block ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)]\([^)]*\)/g, '$1')
    .replace(/^\s*\|.*\|\s*$/gm, '')
    .replace(/^\s*\d+[.)]\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '')
    .replace(/[*_#>~|]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

export function speakText(text: string, onEnd?: () => void) {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd?.()
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(toSpeechText(text))
  if (onEnd) {
    utterance.onend = onEnd
    utterance.onerror = onEnd
  }
  window.speechSynthesis.speak(utterance)
}

export function stopSpeaking() {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
}

export function isVoiceOutputSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
}
