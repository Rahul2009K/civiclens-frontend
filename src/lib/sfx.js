// Tiny sound effects, synthesized with the Web Audio API (no audio files).
// Browsers only allow audio after a user gesture, so the context starts lazily
// on the first click. Muting is remembered per visitor.

const KEY = 'civiclens-sound'
let ctx = null
let master = null
let noiseBuf = null
let muted = readMuted()
let lastSlide = 0
const listeners = new Set()

function readMuted() {
  try { return localStorage.getItem(KEY) === 'off' } catch { return false }
}

export function isMuted() { return muted }

export function setMuted(value) {
  muted = value
  try { localStorage.setItem(KEY, value ? 'off' : 'on') } catch { /* storage blocked */ }
  listeners.forEach((fn) => fn(muted))
}

export function onMuteChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

function audio() {
  if (muted) return null
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.55
    master.connect(ctx.destination)
    // One second of white noise, reused for paper and whoosh sounds
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const data = noiseBuf.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function env(gain, t, attack, peak, decay) {
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function tone({ freq, to, type = 'sine', at = 0, attack = 0.004, peak = 0.2, decay = 0.12 }) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + at
  const osc = a.createOscillator()
  const g = a.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (to) osc.frequency.exponentialRampToValueAtTime(to, t + attack + decay)
  env(g, t, attack, peak, decay)
  osc.connect(g).connect(master)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

function noise({ at = 0, dur = 0.2, from = 800, to = 3000, q = 0.8, peak = 0.25, type = 'bandpass', attack = 0.01 }) {
  const a = audio()
  if (!a) return
  const t = a.currentTime + at
  const src = a.createBufferSource()
  src.buffer = noiseBuf
  const f = a.createBiquadFilter()
  f.type = type
  f.Q.value = q
  f.frequency.setValueAtTime(from, t)
  f.frequency.exponentialRampToValueAtTime(to, t + dur)
  const g = a.createGain()
  env(g, t, attack, peak, dur)
  src.connect(f).connect(g).connect(master)
  src.start(t, Math.random() * 0.5)
  src.stop(t + attack + dur + 0.05)
}

export const sfx = {
  // Soft UI tick for buttons and links
  click() {
    tone({ freq: 1400, to: 700, peak: 0.07, decay: 0.05 })
  },
  // A book sliding off the shelf
  slide() {
    // Throttled: sweeping across the shelf shouldn't sound like a stampede
    const now = performance.now()
    if (now - lastSlide < 140) return
    lastSlide = now
    noise({ dur: 0.22, from: 300, to: 900, q: 0.6, peak: 0.08, type: 'lowpass', attack: 0.04 })
  },
  // One page flipping: a quick papery swish
  pageTurn(at = 0) {
    noise({ at, dur: 0.16, from: 1800, to: 5200, q: 1.1, peak: 0.16 })
    noise({ at: at + 0.05, dur: 0.1, from: 4000, to: 2200, q: 1.4, peak: 0.07 })
  },
  // Cover swinging open, then a few pages riffling
  bookOpen() {
    noise({ dur: 0.35, from: 200, to: 1200, q: 0.5, peak: 0.12, type: 'lowpass', attack: 0.06 })
    tone({ freq: 140, to: 90, at: 0.52, peak: 0.12, decay: 0.18 })
    for (let i = 0; i < 3; i++) this.pageTurn(0.7 + i * 0.11)
  },
  // A hardcover shutting: thump with a puff of air
  bookClose() {
    tone({ freq: 110, to: 55, peak: 0.28, decay: 0.22, attack: 0.002 })
    noise({ dur: 0.12, from: 600, to: 200, q: 0.7, peak: 0.12, type: 'lowpass', attack: 0.002 })
  },
  // Little chime for saving a bill
  chime() {
    tone({ freq: 880, peak: 0.1, decay: 0.25, type: 'triangle' })
    tone({ freq: 1320, at: 0.08, peak: 0.08, decay: 0.3, type: 'triangle' })
  },
  // Bubbly pop for votes
  pop() {
    tone({ freq: 420, to: 900, peak: 0.12, decay: 0.08, type: 'triangle' })
  },
  // Light switch for the theme toggle
  toggle() {
    tone({ freq: 2200, to: 1200, peak: 0.05, decay: 0.03, type: 'square' })
    tone({ freq: 600, at: 0.03, peak: 0.06, decay: 0.05 })
  },
}
