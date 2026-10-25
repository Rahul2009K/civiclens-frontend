import { memo, useId } from 'react'
import { rng, seedFrom } from '../lib/bills'

// Generative cover art. Same bill id always produces the same artwork.
// Works at any aspect ratio, so it serves book covers and stack lids alike.

function bauhaus(r, w, h, p, uid) {
  const cols = r() < 0.5 ? 3 : 4
  const cell = w / cols
  const rows = Math.ceil(h / cell)
  const colors = [p.a, p.b, p.bg]
  const out = []
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const x = col * cell
      const y = row * cell
      const i = row * cols + col
      const id = `${uid}-c${i}`
      const fill = r() < 0.38 ? colors[Math.floor(r() * 2)] : null
      const shape = r()
      const shapeColor = colors.filter((c) => c !== fill)[Math.floor(r() * 2)]
      const corner = Math.floor(r() * 4)
      const cx = x + (corner % 2 ? cell : 0)
      const cy = y + (corner > 1 ? cell : 0)
      let el = null
      if (shape < 0.34) el = <circle cx={cx} cy={cy} r={cell} fill={shapeColor} />
      else if (shape < 0.56) {
        const side = Math.floor(r() * 4)
        const hx = x + [cell / 2, cell, cell / 2, 0][side]
        const hy = y + [0, cell / 2, cell, cell / 2][side]
        el = <circle cx={hx} cy={hy} r={cell / 2} fill={shapeColor} />
      } else if (shape < 0.72) el = <circle cx={x + cell / 2} cy={y + cell / 2} r={cell * 0.36} fill={shapeColor} />
      else if (shape < 0.84) {
        const pts = corner % 2
          ? `${x},${y} ${x + cell},${y} ${x},${y + cell}`
          : `${x},${y} ${x + cell},${y} ${x + cell},${y + cell}`
        el = <polygon points={pts} fill={shapeColor} />
      }
      out.push(
        <g key={i} clipPath={`url(#${id})`}>
          <clipPath id={id}><rect x={x} y={y} width={cell + 0.5} height={cell + 0.5} /></clipPath>
          {fill && <rect x={x} y={y} width={cell + 0.5} height={cell + 0.5} fill={fill} />}
          {el}
        </g>
      )
    }
  }
  return out
}

function stripes(r, w, h, p) {
  const angle = [-35, 35, -55, 55][Math.floor(r() * 4)]
  const band = Math.max(w, h) / (7 + Math.floor(r() * 5))
  const span = Math.hypot(w, h)
  const seq = [p.a, p.bg, p.b, p.bg]
  const bands = []
  for (let i = 0, x = -span; x < span; i++, x += band) {
    bands.push(<rect key={i} x={x} y={-span} width={band + 0.5} height={span * 2} fill={seq[i % seq.length]} />)
  }
  const cr = Math.min(w, h) * (0.24 + r() * 0.12)
  const cx = w * (0.3 + r() * 0.4)
  const cy = h * (0.3 + r() * 0.4)
  return [
    <g key="b" transform={`translate(${w / 2} ${h / 2}) rotate(${angle})`}>{bands}</g>,
    <circle key="c" cx={cx} cy={cy} r={cr} fill={p.bg} />,
    <circle key="d" cx={cx} cy={cy} r={cr * 0.62} fill={p.a} />,
  ]
}

function arcs(r, w, h, p) {
  const ox = r() < 0.5 ? 0 : w
  const oy = r() < 0.5 ? 0 : h
  const max = Math.hypot(w, h) * 0.95
  const step = max / (8 + Math.floor(r() * 4))
  const seq = [p.a, p.bg, p.b, p.bg]
  const out = []
  for (let i = 0, rad = max; rad > step * 0.6; i++, rad -= step) {
    out.push(<circle key={i} cx={ox} cy={oy} r={rad} fill={seq[i % seq.length]} />)
  }
  out.push(<circle key="s" cx={ox === 0 ? w * 0.78 : w * 0.22} cy={oy === 0 ? h * 0.8 : h * 0.2} r={Math.min(w, h) * 0.09} fill={p.b} />)
  return out
}

function halftone(r, w, h, p) {
  const fx = w * (0.2 + r() * 0.6)
  const fy = h * (0.2 + r() * 0.6)
  const gap = Math.min(w, h) / 14
  const maxD = Math.hypot(w, h) * 0.7
  const out = [
    <circle key="big" cx={w - fx} cy={h - fy} r={Math.min(w, h) * 0.34} fill={p.b} />,
  ]
  for (let y = gap / 2, j = 0; y < h; y += gap, j++) {
    for (let x = gap / 2 + (j % 2 ? gap / 2 : 0); x < w; x += gap) {
      const d = Math.hypot(x - fx, y - fy) / maxD
      const rad = Math.max(0, (1 - d) * gap * 0.48)
      if (rad > 0.6) out.push(<circle key={`${x}-${y}`} cx={x} cy={y} r={rad} fill={p.a} />)
    }
  }
  return out
}

const PATTERNS = [bauhaus, bauhaus, stripes, arcs, halftone]

function CoverArt({ seed, palette, width = 300, height = 420, className }) {
  const uid = useId().replace(/:/g, '')
  const r = rng(seedFrom(String(seed)))
  const pattern = PATTERNS[Math.floor(r() * PATTERNS.length)]
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <rect width={width} height={height} fill={palette.bg} />
      {pattern(r, width, height, palette, uid)}
    </svg>
  )
}

export default memo(CoverArt)
