import { useEffect, useRef } from 'react'
import { TOPIC_PALETTES } from '../lib/bills'

// A quiet, living backdrop drawn on one fixed canvas behind the page.
// Home gets rippling "flag" lines with drifting legal marks (§ ¶ ⚖ columns,
// stars). Each bill page gets a scene for its topic, tinted in that topic's
// cover colors: a heartbeat line for Healthcare, a market ticker for Economy,
// circuit traces for Technology, and so on. Reduced motion draws one still frame.

const SCENES = {
  home:               { field: 'ripple',    glyphs: ['§', '¶', 'scales', 'column', 'star', 'star'] },
  'Criminal Justice': { field: 'columns',   glyphs: ['§', 'scales', '¶', 'column'] },
  'Foreign Policy':   { field: 'meridians', glyphs: ['star', 'globe', 'star'] },
  Economy:            { field: 'ticker',    glyphs: ['$', '%', 'coin', 'bars'] },
  Education:          { field: 'ruled',     glyphs: ['A+', 'book', 'abc', '✓'] },
  Immigration:        { field: 'routes',    glyphs: ['star', 'house', 'star'] },
  Healthcare:         { field: 'pulse',     glyphs: ['plus', 'heart', 'plus'] },
  Climate:            { field: 'contour',   glyphs: ['leaf', 'drop', 'leaf'] },
  Technology:         { field: 'circuit',   glyphs: ['0', '1', '</>', '1', '0'] },
  'Civil Rights':     { field: 'ripple',    glyphs: ['=', 'star', 'VOTE', '='] },
  Other:              { field: 'ripple',    glyphs: ['“', '”', 'bubble', '§'] },
}

// ---------- color helpers ----------
function hexToRgb(hex) {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
function mix(a, b, t) { return a.map((v, i) => Math.round(v + (b[i] - v) * t)) }
function luminance([r, g, b]) { return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 }
function rgba(c, a) { return `rgba(${c[0]},${c[1]},${c[2]},${a})` }

function colorsFor(scene, dark) {
  const css = getComputedStyle(document.documentElement)
  const read = (v, fallback) => {
    const s = css.getPropertyValue(v).trim()
    return s.startsWith('#') ? hexToRgb(s) : fallback
  }
  const text = read('--text', dark ? [242, 236, 228] : [25, 22, 26])
  const accent = read('--accent', dark ? [255, 122, 69] : [184, 63, 21])
  if (scene === 'home') return { main: text, pop: accent }
  const p = TOPIC_PALETTES[scene] || TOPIC_PALETTES.Other
  // Keep the topic hue but make sure it reads against the page.
  const fit = (hex) => {
    const c = hexToRgb(hex)
    const l = luminance(c)
    if (dark && l < 0.45) return mix(c, [255, 255, 255], 0.45 - l * 0.5)
    if (!dark && l > 0.6) return mix(c, [0, 0, 0], 0.35)
    return c
  }
  return { main: fit(p.bg), pop: fit(luminance(hexToRgb(p.a)) > 0.7 && !dark ? p.bg : p.a) }
}

// ---------- seeded randomness (stable layouts per scene) ----------
function rng(seed) {
  let s = seed >>> 0
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
function hash(str) { let h = 2166136261; for (const ch of str) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); return h }

// ---------- glyph shapes (drawn centered at 0,0 with size s) ----------
function drawGlyph(g, kind, s, fill) {
  g.fillStyle = fill
  g.strokeStyle = fill
  g.lineWidth = Math.max(1.4, s * 0.07)
  g.lineCap = 'round'
  g.lineJoin = 'round'
  switch (kind) {
    case 'star': {
      g.beginPath()
      for (let i = 0; i < 10; i++) {
        const r = i % 2 ? s * 0.22 : s * 0.5
        const a = -Math.PI / 2 + (i * Math.PI) / 5
        g.lineTo(Math.cos(a) * r, Math.sin(a) * r)
      }
      g.closePath(); g.fill(); break
    }
    case 'column': {
      const w = s * 0.5, h = s
      g.fillRect(-w * 0.62, -h * 0.5, w * 1.24, h * 0.1)
      g.fillRect(-w * 0.7, h * 0.4, w * 1.4, h * 0.1)
      for (let i = 0; i < 4; i++) g.fillRect(-w * 0.45 + i * w * 0.3, -h * 0.36, w * 0.14, h * 0.74)
      break
    }
    case 'scales': {
      g.beginPath()
      g.moveTo(0, -s * 0.45); g.lineTo(0, s * 0.42)
      g.moveTo(-s * 0.42, -s * 0.3); g.lineTo(s * 0.42, -s * 0.3)
      g.moveTo(-s * 0.25, s * 0.45); g.lineTo(s * 0.25, s * 0.45)
      for (const x of [-s * 0.38, s * 0.38]) {
        g.moveTo(x, -s * 0.3); g.lineTo(x - s * 0.14, s * 0.05)
        g.moveTo(x, -s * 0.3); g.lineTo(x + s * 0.14, s * 0.05)
      }
      g.stroke()
      for (const x of [-s * 0.38, s * 0.38]) { g.beginPath(); g.arc(x, s * 0.05, s * 0.15, 0, Math.PI); g.fill() }
      break
    }
    case 'plus': g.fillRect(-s * 0.12, -s * 0.42, s * 0.24, s * 0.84); g.fillRect(-s * 0.42, -s * 0.12, s * 0.84, s * 0.24); break
    case 'heart': {
      g.beginPath()
      g.moveTo(0, s * 0.38)
      g.bezierCurveTo(-s * 0.6, 0, -s * 0.45, -s * 0.5, 0, -s * 0.18)
      g.bezierCurveTo(s * 0.45, -s * 0.5, s * 0.6, 0, 0, s * 0.38)
      g.fill(); break
    }
    case 'leaf': {
      g.beginPath()
      g.moveTo(-s * 0.4, s * 0.4)
      g.quadraticCurveTo(-s * 0.45, -s * 0.4, s * 0.42, -s * 0.42)
      g.quadraticCurveTo(s * 0.4, s * 0.42, -s * 0.4, s * 0.4)
      g.fill()
      g.globalCompositeOperation = 'destination-out'
      g.beginPath(); g.moveTo(-s * 0.32, s * 0.32); g.lineTo(s * 0.3, -s * 0.3); g.lineWidth = s * 0.05; g.stroke()
      g.globalCompositeOperation = 'source-over'
      break
    }
    case 'drop': {
      g.beginPath()
      g.moveTo(0, -s * 0.48)
      g.bezierCurveTo(s * 0.1, -s * 0.25, s * 0.36, 0, s * 0.36, s * 0.14)
      g.arc(0, s * 0.14, s * 0.36, 0, Math.PI)
      g.bezierCurveTo(-s * 0.36, 0, -s * 0.1, -s * 0.25, 0, -s * 0.48)
      g.fill(); break
    }
    case 'coin': {
      g.beginPath(); g.arc(0, 0, s * 0.42, 0, Math.PI * 2); g.stroke()
      g.font = `600 ${s * 0.5}px 'Geist Variable', sans-serif`
      g.fillText('$', 0, s * 0.02); break
    }
    case 'bars': {
      const hs = [0.35, 0.6, 0.9]
      hs.forEach((h, i) => g.fillRect(-s * 0.42 + i * s * 0.3, s * 0.45 - h * s, s * 0.22, h * s))
      break
    }
    case 'book': {
      g.beginPath()
      g.moveTo(0, -s * 0.25); g.quadraticCurveTo(-s * 0.25, -s * 0.38, -s * 0.5, -s * 0.3); g.lineTo(-s * 0.5, s * 0.3)
      g.quadraticCurveTo(-s * 0.25, s * 0.22, 0, s * 0.34)
      g.quadraticCurveTo(s * 0.25, s * 0.22, s * 0.5, s * 0.3); g.lineTo(s * 0.5, -s * 0.3)
      g.quadraticCurveTo(s * 0.25, -s * 0.38, 0, -s * 0.25)
      g.fill(); break
    }
    case 'house': {
      g.beginPath()
      g.moveTo(-s * 0.42, -s * 0.02); g.lineTo(0, -s * 0.42); g.lineTo(s * 0.42, -s * 0.02)
      g.lineTo(s * 0.32, -s * 0.02); g.lineTo(s * 0.32, s * 0.42); g.lineTo(-s * 0.32, s * 0.42); g.lineTo(-s * 0.32, -s * 0.02)
      g.closePath(); g.fill(); break
    }
    case 'globe': {
      g.beginPath(); g.arc(0, 0, s * 0.44, 0, Math.PI * 2)
      g.ellipse(0, 0, s * 0.18, s * 0.44, 0, 0, Math.PI * 2)
      g.moveTo(-s * 0.44, 0); g.lineTo(s * 0.44, 0)
      g.stroke(); break
    }
    case 'bubble': {
      g.beginPath()
      g.roundRect(-s * 0.48, -s * 0.36, s * 0.96, s * 0.6, s * 0.14)
      g.moveTo(-s * 0.2, s * 0.22); g.lineTo(-s * 0.3, s * 0.46); g.lineTo(0, s * 0.22)
      g.fill(); break
    }
    default: {
      const mono = /^[01]$|^<\/>$/.test(kind)
      const sans = kind === 'VOTE' || kind === 'abc' || kind === '$' || kind === '%'
      const fam = mono ? "'Geist Mono Variable', monospace" : sans ? "'Geist Variable', sans-serif" : "'Newsreader Variable', Georgia, serif"
      const size = kind.length > 2 ? s * 0.42 : s
      g.font = `${sans || mono ? 600 : 500} ${size}px ${fam}`
      g.fillText(kind, 0, s * 0.04)
    }
  }
}

// ---------- background fields ----------
function waveLines(g, w, h, t, c, { count, amp, freq, speed, alpha, top = 0.12, gap = 0.11 }) {
  for (let i = 0; i < count; i++) {
    const y0 = h * (top + i * gap)
    g.beginPath()
    for (let x = -20; x <= w + 20; x += 14) {
      const y = y0
        + Math.sin(x * freq + t * speed + i * 0.7) * amp
        + Math.sin(x * freq * 2.7 - t * speed * 1.3 + i * 1.9) * amp * 0.35
      x === -20 ? g.moveTo(x, y) : g.lineTo(x, y)
    }
    g.strokeStyle = rgba(i % 3 === 1 ? c.pop : c.main, alpha * (i % 3 === 1 ? 1.25 : 1))
    g.lineWidth = i % 3 === 1 ? 1.6 : 1.1
    g.stroke()
  }
}

function ekgAt(x) {
  const p = ((x % 300) + 300) % 300
  if (p < 120) return 0
  if (p < 135) return -(p - 120) * 0.6
  if (p < 145) return -9 + (p - 135) * 4.2
  if (p < 158) return 33 - (p - 145) * 6.2
  if (p < 168) return -47.6 + (p - 158) * 5.4
  if (p < 180) return 6.4 - (p - 168) * 0.53
  if (p < 210) return Math.sin(((p - 180) / 30) * Math.PI) * -8
  return 0
}

const FIELDS = {
  ripple(g, w, h, t, c) { waveLines(g, w, h, t, c, { count: 8, amp: 16, freq: 0.0042, speed: 0.32, alpha: 0.075 }) },
  contour(g, w, h, t, c) { waveLines(g, w, h, t, c, { count: 14, amp: 34, freq: 0.0026, speed: 0.16, alpha: 0.07, top: 0.06, gap: 0.068 }) },
  columns(g, w, h, t, c) {
    // Tall faint pillars with a slow light sweeping across them
    const n = Math.max(5, Math.round(w / 220))
    const sweep = ((t * 0.06) % 1.6) - 0.3
    for (let i = 0; i < n; i++) {
      const x = (i + 0.5) * (w / n)
      const near = Math.max(0, 1 - Math.abs(i / n - sweep) * 4)
      g.fillStyle = rgba(c.main, 0.035 + near * 0.05)
      for (let f = -2; f <= 2; f++) g.fillRect(x + f * 9 - 2, h * 0.08, 4, h * 0.84)
      g.fillRect(x - 30, h * 0.06, 60, 8)
      g.fillRect(x - 34, h * 0.92, 68, 8)
    }
    waveLines(g, w, h, t, c, { count: 3, amp: 10, freq: 0.004, speed: 0.25, alpha: 0.06, top: 0.3, gap: 0.2 })
  },
  pulse(g, w, h, t, c) {
    for (let i = 0; i < 3; i++) {
      const y0 = h * (0.22 + i * 0.28)
      const off = i * 110
      g.beginPath()
      for (let x = 0; x <= w; x += 3) { const y = y0 + ekgAt(x + off); x ? g.lineTo(x, y) : g.moveTo(x, y) }
      g.strokeStyle = rgba(c.main, 0.06); g.lineWidth = 1.4; g.stroke()
      // the travelling bright trace
      const head = ((t * 170 + i * 420) % (w + 600)) - 100
      const grad = g.createLinearGradient(head - 260, 0, head, 0)
      grad.addColorStop(0, rgba(c.pop, 0)); grad.addColorStop(1, rgba(c.pop, 0.32))
      g.beginPath()
      for (let x = Math.max(0, head - 260); x <= Math.min(w, head); x += 3) {
        const y = y0 + ekgAt(x + off); x === Math.max(0, head - 260) ? g.moveTo(x, y) : g.lineTo(x, y)
      }
      g.strokeStyle = grad; g.lineWidth = 2.2; g.stroke()
      if (head > 0 && head < w) { g.fillStyle = rgba(c.pop, 0.45); g.beginPath(); g.arc(head, y0 + ekgAt(head + off), 3, 0, Math.PI * 2); g.fill() }
    }
  },
  ticker(g, w, h, t, c, data) {
    g.fillStyle = rgba(c.main, 0.035)
    for (let y = h * 0.1; y < h; y += 70) g.fillRect(0, y, w, 1)
    data.series.forEach((s, i) => {
      const y0 = h * (0.3 + i * 0.2)
      const shift = (t * (14 + i * 6)) % 40
      g.beginPath()
      for (let k = 0; k * 40 - shift <= w + 40; k++) {
        const v = s[(k + Math.floor(t * (14 + i * 6) / 40)) % s.length]
        const x = k * 40 - shift, y = y0 + v
        k ? g.lineTo(x, y) : g.moveTo(x, y)
      }
      g.strokeStyle = rgba(i === 1 ? c.pop : c.main, i === 1 ? 0.13 : 0.08); g.lineWidth = i === 1 ? 1.8 : 1.2; g.stroke()
    })
  },
  circuit(g, w, h, t, c, data) {
    data.traces.forEach((tr, i) => {
      g.beginPath()
      tr.forEach(([x, y], k) => (k ? g.lineTo(x * w, y * h) : g.moveTo(x * w, y * h)))
      g.strokeStyle = rgba(c.main, 0.07); g.lineWidth = 1.3; g.stroke()
      const [ex, ey] = tr[tr.length - 1]
      g.fillStyle = rgba(c.main, 0.1); g.beginPath(); g.arc(ex * w, ey * h, 3.5, 0, Math.PI * 2); g.fill()
      // a packet of light running along the trace
      const pts = tr.map(([x, y]) => [x * w, y * h])
      const lens = []; let total = 0
      for (let k = 1; k < pts.length; k++) { const d = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); lens.push(d); total += d }
      let d = ((t * 90 + i * 137) % (total + 400))
      if (d > total) return
      for (let k = 0; k < lens.length; k++) {
        if (d <= lens[k]) {
          const f = d / lens[k]
          const x = pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, y = pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f
          g.fillStyle = rgba(c.pop, 0.55); g.beginPath(); g.arc(x, y, 2.6, 0, Math.PI * 2); g.fill()
          g.fillStyle = rgba(c.pop, 0.12); g.beginPath(); g.arc(x, y, 9, 0, Math.PI * 2); g.fill()
          break
        }
        d -= lens[k]
      }
    })
  },
  meridians(g, w, h, t, c) {
    const R = Math.min(w, h) * 0.46
    const cx = w * 0.78, cy = h * 0.55
    g.lineWidth = 1.2
    g.strokeStyle = rgba(c.main, 0.08)
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke()
    for (let i = 0; i < 9; i++) {
      const a = ((i / 9) * Math.PI + t * 0.08) % Math.PI
      const rx = Math.abs(Math.cos(a)) * R
      g.strokeStyle = rgba(i === 4 ? c.pop : c.main, i === 4 ? 0.12 : 0.065)
      g.beginPath(); g.ellipse(cx, cy, rx, R, 0, 0, Math.PI * 2); g.stroke()
    }
    for (let j = -2; j <= 2; j++) {
      const y = cy + (j / 3) * R
      const rx = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2))
      g.strokeStyle = rgba(c.main, 0.06)
      g.beginPath(); g.ellipse(cx, y, rx, rx * 0.12, 0, 0, Math.PI * 2); g.stroke()
    }
  },
  ruled(g, w, h, t, c) {
    g.fillStyle = rgba(c.main, 0.06)
    for (let y = 120; y < h; y += 36) g.fillRect(0, y, w, 1)
    g.fillStyle = rgba(c.pop, 0.13)
    g.fillRect(w * 0.08, 0, 1.5, h)
    // a slow pencil stroke writing itself across one line
    const line = Math.floor(t / 7) % Math.max(1, Math.floor((h - 160) / 36))
    const prog = (t % 7) / 7
    const y = 120 + line * 36 + 36 - 10
    g.beginPath()
    for (let x = w * 0.1; x < w * (0.1 + 0.6 * prog); x += 4) {
      const yy = y + Math.sin(x * 0.09) * 3 + Math.sin(x * 0.023) * 2
      x === w * 0.1 ? g.moveTo(x, yy) : g.lineTo(x, yy)
    }
    g.strokeStyle = rgba(c.main, 0.12 * (1 - Math.max(0, prog - 0.85) / 0.15)); g.lineWidth = 1.4; g.stroke()
  },
  routes(g, w, h, t, c, data) {
    g.setLineDash([6, 9])
    g.lineDashOffset = -t * 24
    data.arcs.forEach(([x1, y1, x2, y2, lift], i) => {
      const ax = x1 * w, ay = y1 * h, bx = x2 * w, by = y2 * h
      const mx = (ax + bx) / 2, my = Math.min(ay, by) - lift * h
      g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx, my, bx, by)
      g.strokeStyle = rgba(i % 2 ? c.pop : c.main, i % 2 ? 0.13 : 0.085); g.lineWidth = 1.4; g.stroke()
    })
    g.setLineDash([])
    data.arcs.forEach(([x1, y1, x2, y2]) => {
      for (const [x, y] of [[x1, y1], [x2, y2]]) { g.fillStyle = rgba(c.main, 0.12); g.beginPath(); g.arc(x * w, y * h, 3.5, 0, Math.PI * 2); g.fill() }
    })
  },
}

function buildData(scene) {
  const r = rng(hash(scene))
  const series = Array.from({ length: 3 }, () => {
    let v = 0
    return Array.from({ length: 80 }, () => { v = Math.max(-60, Math.min(60, v + (r() - 0.5) * 34)); return v })
  })
  const traces = Array.from({ length: 16 }, () => {
    const pts = [[Math.round(r() * 12) / 12, Math.round(r() * 8) / 8]]
    for (let k = 0; k < 3; k++) {
      const [x, y] = pts[pts.length - 1]
      pts.push(k % 2 ? [x, Math.min(1, Math.max(0, y + (r() - 0.5) * 0.5))] : [Math.min(1, Math.max(0, x + (r() - 0.5) * 0.4)), y])
    }
    return pts
  })
  const arcs = Array.from({ length: 6 }, () => [r() * 0.5, 0.35 + r() * 0.55, 0.5 + r() * 0.5, 0.35 + r() * 0.55, 0.12 + r() * 0.2])
  return { series, traces, arcs }
}

function makeGlyphs(scene, w, h) {
  const r = rng(hash(scene) ^ 0x9e37)
  const kinds = (SCENES[scene] || SCENES.Other).glyphs
  const count = Math.min(30, Math.max(10, Math.round((w * h) / 52000)))
  return Array.from({ length: count }, (_, i) => {
    const depth = 0.3 + r() * 0.7
    return {
      kind: kinds[i % kinds.length],
      x: r() * w,
      y: r() * (h + 160) - 80,
      size: 16 + depth * 30,
      depth,
      vy: -(4 + depth * 9),
      rot: (r() - 0.5) * 0.6,
      vr: (r() - 0.5) * 0.08,
      phase: r() * Math.PI * 2,
      alpha: 0.05 + depth * 0.07,
      pop: r() < 0.3,
    }
  })
}

export default function AmbientBackground({ scene = 'home', theme }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const g = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    const cfg = SCENES[scene] || SCENES.Other
    const field = FIELDS[cfg.field]
    const data = buildData(scene)
    const colors = colorsFor(scene, theme !== 'light')
    let w = 0, h = 0, glyphs = []
    let raf = 0
    const born = performance.now()
    let last = born

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5)
      w = window.innerWidth; h = window.innerHeight
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr)
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
      g.textAlign = 'center'; g.textBaseline = 'middle'
      glyphs = makeGlyphs(scene, w, h)
    }

    function frame(now) {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const t = now / 1000
      const still = reduce.matches
      g.clearRect(0, 0, w, h)
      const fade = still ? 1 : Math.min(1, (now - born) / 900) // fade in on scene change
      const tt = still ? 4 : t
      // Two slow pools of the scene's color drifting behind everything
      g.globalAlpha = fade
      const wash = scene === 'home' ? 0.05 : 0.16
      const blobs = [
        [w * (0.2 + Math.sin(tt * 0.05) * 0.1), h * (0.3 + Math.cos(tt * 0.04) * 0.12), colors.main, wash],
        [w * (0.82 + Math.cos(tt * 0.045) * 0.08), h * (0.78 + Math.sin(tt * 0.06) * 0.1), colors.pop, wash * 0.6],
      ]
      for (const [bx, by, col, a] of blobs) {
        const rad = Math.max(w, h) * 0.6
        const grad = g.createRadialGradient(bx, by, 0, bx, by, rad)
        grad.addColorStop(0, rgba(col, a)); grad.addColorStop(1, rgba(col, 0))
        g.fillStyle = grad; g.fillRect(0, 0, w, h)
      }
      g.globalAlpha = fade * (scene === 'home' ? 1 : 1.35)
      field(g, w, h, tt, colors, data)
      const scroll = window.scrollY
      for (const p of glyphs) {
        if (!still) { p.y += p.vy * dt; p.rot += p.vr * dt }
        const span = h + 160
        const y = ((((p.y - scroll * p.depth * 0.18) % span) + span) % span) - 80
        const x = p.x + Math.sin(t * 0.4 + p.phase) * 10 * p.depth
        g.save()
        g.translate(x, y)
        g.rotate(p.rot)
        drawGlyph(g, p.kind, p.size, rgba(p.pop ? colors.pop : colors.main, p.alpha * (p.pop ? 1.3 : 1)))
        g.restore()
      }
      g.globalAlpha = 1
      if (!still && !document.hidden) raf = requestAnimationFrame(frame)
    }

    function restart() {
      cancelAnimationFrame(raf)
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }

    resize()
    restart()
    const onResize = () => { resize(); restart() }
    const onVisible = () => { if (!document.hidden) restart() }
    const onScroll = () => { if (reduce.matches) restart() }
    window.addEventListener('resize', onResize)
    document.addEventListener('visibilitychange', onVisible)
    reduce.addEventListener('change', restart)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      document.removeEventListener('visibilitychange', onVisible)
      reduce.removeEventListener('change', restart)
      window.removeEventListener('scroll', onScroll)
    }
  }, [scene, theme])

  return <canvas ref={ref} className="ambient" data-scene={scene} aria-hidden="true" />
}
