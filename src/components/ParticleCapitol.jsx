import { useEffect, useRef } from 'react'

// The U.S. Capitol, drawn from a few thousand particles on a 2D canvas.
// Particles assemble on load, scatter away from the pointer and drift back.
// No dependencies; pauses when offscreen; static under reduced motion.

const PALETTES = {
  dark: { inks: ['#f6efe4', '#ffd2b8', '#ff9a6b', '#ff7a45'], blend: 'lighter', star: '255,240,228' },
  // Light mode: dense ink with ember accents, set against a low sun so the dome reads clearly
  light: { inks: ['#151012', '#3b2a24', '#b23f16', '#e2602a'], blend: 'source-over', star: '120,60,40', scale: 1.35, sun: true },
}

function drawCapitol(ctx, W, H) {
  const u = Math.min(W * 0.98, H * 1.3)
  const cx = W / 2
  const base = H * 0.95
  const X = (x) => cx + x * u
  const Y = (y) => base - y * u
  const rect = (x, y, w, h) => ctx.fillRect(X(x), Y(y + h), w * u, h * u)

  ctx.fillStyle = '#fff'
  // Terraces and wings
  rect(-0.49, 0, 0.98, 0.016)
  rect(-0.45, 0.016, 0.9, 0.018)
  rect(-0.43, 0.034, 0.86, 0.128)
  rect(-0.135, 0.034, 0.27, 0.15)
  // Portico pediment
  ctx.beginPath()
  ctx.moveTo(X(-0.15), Y(0.184))
  ctx.lineTo(X(0.15), Y(0.184))
  ctx.lineTo(X(0), Y(0.232))
  ctx.closePath()
  ctx.fill()
  // Drum, colonnade, attic
  rect(-0.165, 0.232, 0.33, 0.03)
  rect(-0.145, 0.262, 0.29, 0.1)
  rect(-0.125, 0.362, 0.25, 0.026)
  // Dome
  ctx.beginPath()
  ctx.ellipse(X(0), Y(0.388), 0.122 * u, 0.172 * u, 0, Math.PI, 0)
  ctx.fill()
  // Lantern, cap and statue
  rect(-0.024, 0.552, 0.048, 0.062)
  ctx.beginPath()
  ctx.ellipse(X(0), Y(0.614), 0.026 * u, 0.022 * u, 0, Math.PI, 0)
  ctx.fill()
  rect(-0.006, 0.632, 0.012, 0.042)
  ctx.beginPath()
  ctx.arc(X(0), Y(0.682), 0.009 * u, 0, Math.PI * 2)
  ctx.fill()

  // Carve columns and dome ribs out of the solid shapes
  ctx.globalCompositeOperation = 'destination-out'
  for (let x = -0.415; x < 0.405; x += 0.027) {
    if (Math.abs(x + 0.005) > 0.14) rect(x, 0.05, 0.011, 0.09)
  }
  for (let x = -0.118; x < 0.11; x += 0.031) rect(x, 0.05, 0.014, 0.112)
  for (let x = -0.133; x < 0.13; x += 0.0215) rect(x, 0.272, 0.009, 0.08)
  ctx.lineWidth = Math.max(1, 0.0045 * u)
  ctx.strokeStyle = '#000'
  for (let k = -3; k <= 3; k++) {
    const s = k / 3.6
    ctx.beginPath()
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const th = (t * Math.PI) / 2
      const x = 0.122 * Math.cos(th) * s
      const y = 0.388 + 0.172 * Math.sin(th)
      if (t === 0) ctx.moveTo(X(x), Y(y))
      else ctx.lineTo(X(x), Y(y))
    }
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
  return { top: Y(0.69), bottom: base }
}

function sampleTargets(W, H, count) {
  const off = document.createElement('canvas')
  off.width = W
  off.height = H
  const octx = off.getContext('2d', { willReadFrequently: true })
  const { top, bottom } = drawCapitol(octx, W, H)
  const data = octx.getImageData(0, 0, W, H).data
  const pts = []
  for (let y = 0; y < H; y += 2) {
    for (let x = 0; x < W; x += 2) {
      if (data[(y * W + x) * 4 + 3] > 140) pts.push(x, y)
    }
  }
  // Random subsample keeps the density organic instead of grid-like
  const n = pts.length / 2
  const out = new Float32Array(count * 2)
  for (let i = 0; i < count; i++) {
    const j = Math.floor(Math.random() * n)
    out[i * 2] = pts[j * 2] + (Math.random() - 0.5) * 1.6
    out[i * 2 + 1] = pts[j * 2 + 1] + (Math.random() - 0.5) * 1.6
  }
  return { targets: out, top, bottom }
}

export default function ParticleCapitol({ theme = 'dark' }) {
  const wrapRef = useRef(null)
  const canvasRef = useRef(null)
  const themeRef = useRef(theme)
  const redrawRef = useRef(() => {})

  useEffect(() => {
    themeRef.current = theme
    redrawRef.current()
  }, [theme])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0, H = 0, dpr = 1, count = 0
    let px, py, vx, vy, tx, ty, ink, phase, size
    let stars = []
    let shape = { top: 0, bottom: 0 }
    let raf = 0
    let running = false
    let visible = true
    let start = performance.now()
    const pointer = { x: -9999, y: -9999, active: false }

    function build() {
      const box = wrap.getBoundingClientRect()
      W = Math.max(1, Math.round(box.width))
      H = Math.max(1, Math.round(box.height))
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = W * dpr
      canvas.height = H * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

      const prev = count
      count = Math.round(Math.min(7500, Math.max(1800, (W * H) / 52)))
      const { targets, top, bottom } = sampleTargets(W, H, count)
      shape = { top, bottom }
      const fresh = prev !== count || !px
      if (fresh) {
        px = new Float32Array(count); py = new Float32Array(count)
        vx = new Float32Array(count); vy = new Float32Array(count)
        ink = new Uint8Array(count); phase = new Float32Array(count); size = new Float32Array(count)
      }
      tx = new Float32Array(count); ty = new Float32Array(count)
      const span = Math.max(1, bottom - top)
      for (let i = 0; i < count; i++) {
        tx[i] = targets[i * 2]
        ty[i] = targets[i * 2 + 1]
        // Dome glows pale, the base burns ember
        const h = (ty[i] - top) / span
        const roll = Math.random() * 0.6 + h * 0.6
        ink[i] = roll < 0.5 ? 0 : roll < 0.72 ? 1 : roll < 0.92 ? 2 : 3
        phase[i] = Math.random() * Math.PI * 2
        size[i] = Math.random() < 0.1 ? 2.2 : 1.45
        if (fresh) {
          if (reduce) { px[i] = tx[i]; py[i] = ty[i] }
          else {
            const a = Math.random() * Math.PI * 2
            const r = Math.max(W, H) * (0.35 + Math.random() * 0.5)
            px[i] = W / 2 + Math.cos(a) * r
            py[i] = H * 0.55 + Math.sin(a) * r * 0.6
          }
        }
      }
      stars = Array.from({ length: Math.round((W * H) / 9000) }, () => ({
        x: Math.random() * W, y: Math.random() * H,
        r: Math.random() * 0.9 + 0.2, p: Math.random() * Math.PI * 2,
      }))
      if (fresh) start = performance.now()
    }

    function draw(now) {
      const pal = PALETTES[themeRef.current] || PALETTES.dark
      ctx.clearRect(0, 0, W, H)
      if (pal.sun) {
        // A warm low sun behind the dome
        const span = shape.bottom - shape.top
        const sx = W / 2
        const sy = shape.top + span * 0.42
        const sr = span * 0.62
        const g = ctx.createRadialGradient(sx, sy, sr * 0.1, sx, sy, sr)
        g.addColorStop(0, 'rgba(240,110,52,0.42)')
        g.addColorStop(0.55, 'rgba(240,110,52,0.16)')
        g.addColorStop(1, 'rgba(240,110,52,0)')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(sx, sy, sr, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const s of stars) {
        const a = reduce ? 0.35 : 0.2 + 0.25 * Math.sin(now * 0.0011 + s.p)
        ctx.fillStyle = `rgba(${pal.star},${a.toFixed(3)})`
        ctx.fillRect(s.x, s.y, s.r, s.r)
      }
      ctx.globalCompositeOperation = pal.blend
      for (let c = 0; c < pal.inks.length; c++) {
        ctx.fillStyle = pal.inks[c]
        ctx.globalAlpha = pal.sun ? 0.95 : c === 0 ? 0.92 : 0.85
        const k = pal.scale || 1
        for (let i = 0; i < count; i++) {
          if (ink[i] !== c) continue
          ctx.fillRect(px[i], py[i], size[i] * k, size[i] * k)
        }
      }
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'
    }

    function step(now) {
      const t = now - start
      // Spring stiffens as the intro settles, so particles glide in then hold
      const k = 0.006 + Math.min(1, t / 2600) * 0.024
      const R = Math.min(W, H) * 0.16
      const R2 = R * R
      for (let i = 0; i < count; i++) {
        const wob = Math.sin(now * 0.0012 + phase[i]) * 0.7
        let ax = (tx[i] + wob - px[i]) * k
        let ay = (ty[i] + Math.cos(now * 0.001 + phase[i]) * 0.5 - py[i]) * k
        if (pointer.active) {
          const dx = px[i] - pointer.x
          const dy = py[i] - pointer.y
          const d2 = dx * dx + dy * dy
          if (d2 < R2 && d2 > 0.01) {
            const d = Math.sqrt(d2)
            const f = (1 - d / R) * 2.4
            ax += (dx / d) * f
            ay += (dy / d) * f
          }
        }
        vx[i] = (vx[i] + ax) * 0.86
        vy[i] = (vy[i] + ay) * 0.86
        px[i] += vx[i]
        py[i] += vy[i]
      }
      draw(now)
      raf = running ? requestAnimationFrame(step) : 0
    }

    function play() {
      if (reduce || running || !visible || document.hidden) return
      running = true
      raf = requestAnimationFrame(step)
    }
    function pause() {
      running = false
      cancelAnimationFrame(raf)
    }

    function burst(x, y) {
      for (let i = 0; i < count; i++) {
        const dx = px[i] - x
        const dy = py[i] - y
        const d = Math.hypot(dx, dy) || 1
        const f = Math.max(0, 1 - d / (Math.min(W, H) * 0.45)) * 14
        vx[i] += (dx / d) * f
        vy[i] += (dy / d) * f
      }
    }

    const local = (e) => {
      const b = canvas.getBoundingClientRect()
      return { x: e.clientX - b.left, y: e.clientY - b.top }
    }
    const onMove = (e) => { const p = local(e); pointer.x = p.x; pointer.y = p.y; pointer.active = true }
    const onLeave = () => { pointer.active = false }
    const onDown = (e) => { if (!reduce) { const p = local(e); burst(p.x, p.y) } }

    build()
    if (reduce) draw(performance.now())
    else play()
    redrawRef.current = () => { if (!running) draw(performance.now()) }

    const ro = new ResizeObserver(() => {
      build()
      if (!running) draw(performance.now())
    })
    ro.observe(wrap)
    const io = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting
      if (visible) play()
      else pause()
    })
    io.observe(wrap)
    const onVis = () => (document.hidden ? pause() : play())
    document.addEventListener('visibilitychange', onVis)
    wrap.addEventListener('pointermove', onMove)
    wrap.addEventListener('pointerleave', onLeave)
    wrap.addEventListener('pointerdown', onDown)

    return () => {
      pause()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVis)
      wrap.removeEventListener('pointermove', onMove)
      wrap.removeEventListener('pointerleave', onLeave)
      wrap.removeEventListener('pointerdown', onDown)
      redrawRef.current = () => {}
    }
  }, [])

  return (
    <div className="capitol" ref={wrapRef}>
      <canvas ref={canvasRef} role="img" aria-label="The U.S. Capitol drawn in glowing particles" />
    </div>
  )
}
