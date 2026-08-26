// Raw PCM capture + client-side WAV encoding, used only for the new
// Autowake speaker-verification audio (the rolling wake-phrase buffer and
// enrollment clips) — deliberately NOT MediaRecorder/webm-opus like the
// existing question-recording flow (apps/main-app's voice-controls.tsx),
// because the backend decodes speaker-verification clips with Python's
// stdlib `wave` module to avoid an ffmpeg/libav system dependency. WAV is
// the one format that decodes without it.
//
// Uses ScriptProcessorNode rather than an AudioWorklet — deprecated but
// still broadly supported, and avoids the extra complexity of loading a
// separate worklet module through Vite for what's a small, latency-
// insensitive buffer. Worth revisiting if ScriptProcessorNode is ever
// actually removed from target browsers.

export interface PcmCaptureHandle {
  stop: () => void
  // The last `seconds` of audio captured so far, as a WAV Blob.
  snapshotWav: (seconds: number) => Blob
  // Everything captured since start() (or the last takeAllWav()), as a
  // WAV Blob — resets the buffer. For single-shot clips (enrollment).
  takeAllWav: () => Blob
}

export async function startPcmCapture(maxBufferSeconds: number): Promise<PcmCaptureHandle> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
  const audioContext = new AudioContext()
  const source = audioContext.createMediaStreamSource(stream)
  const processor = audioContext.createScriptProcessor(4096, 1, 1)
  const sampleRate = audioContext.sampleRate
  const maxSamples = Math.ceil(maxBufferSeconds * sampleRate)

  let buffer = new Float32Array(maxSamples)
  let writeIndex = 0
  let filled = 0

  processor.onaudioprocess = (event) => {
    const input = event.inputBuffer.getChannelData(0)
    for (let i = 0; i < input.length; i += 1) {
      buffer[writeIndex] = input[i]
      writeIndex = (writeIndex + 1) % maxSamples
      filled = Math.min(filled + 1, maxSamples)
    }
  }

  source.connect(processor)
  // Some browsers only fire onaudioprocess once the node is connected all
  // the way to a destination — the actual output is never audible to the
  // user since nothing routes the mic's audio anywhere except this buffer.
  processor.connect(audioContext.destination)

  function readLast(seconds: number): Float32Array {
    const n = Math.min(filled, Math.ceil(seconds * sampleRate))
    const out = new Float32Array(n)
    for (let i = 0; i < n; i += 1) {
      const idx = (writeIndex - n + i + maxSamples * 2) % maxSamples
      out[i] = buffer[idx]
    }
    return out
  }

  function stop() {
    processor.disconnect()
    source.disconnect()
    stream.getTracks().forEach((track) => track.stop())
    void audioContext.close()
  }

  return {
    stop,
    snapshotWav: (seconds: number) => encodeWav(readLast(seconds), sampleRate),
    takeAllWav: () => {
      const all = readLast(maxBufferSeconds)
      buffer = new Float32Array(maxSamples)
      writeIndex = 0
      filled = 0
      return encodeWav(all, sampleRate)
    },
  }
}

function encodeWav(samples: Float32Array, sampleRate: number): Blob {
  const arrayBuffer = new ArrayBuffer(44 + samples.length * 2)
  const view = new DataView(arrayBuffer)

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i += 1) view.setUint8(offset + i, str.charCodeAt(i))
  }

  writeString(0, 'RIFF')
  view.setUint32(4, 36 + samples.length * 2, true)
  writeString(8, 'WAVE')
  writeString(12, 'fmt ')
  view.setUint32(16, 16, true) // PCM chunk size
  view.setUint16(20, 1, true) // format = PCM
  view.setUint16(22, 1, true) // channels = mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate * 2, true) // byte rate (16-bit mono)
  view.setUint16(32, 2, true) // block align
  view.setUint16(34, 16, true) // bits per sample
  writeString(36, 'data')
  view.setUint32(40, samples.length * 2, true)

  let offset = 44
  for (let i = 0; i < samples.length; i += 1) {
    const s = Math.max(-1, Math.min(1, samples[i]))
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true)
    offset += 2
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' })
}
