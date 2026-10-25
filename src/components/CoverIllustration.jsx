import { memo } from 'react'
import { rng, seedFrom } from '../lib/bills'

// Flat, hand-drawn style illustrations for each topic, drawn in the cover's
// own palette. Small parts animate while the book is hovered or open
// (see .ill-* rules in styles.css). viewBox is 300 x 420, the cover's shape.

const SKIN = ['#8d5524', '#c68642', '#e0ac69', '#f1c27d', '#5c3a1e']

function Courthouse({ p }) {
  return (
    <g>
      <polygon points="66,170 150,122 234,170" fill={p.a} />
      <rect x="66" y="170" width="168" height="13" fill={p.a} />
      {[86, 122, 158, 194].map((x) => (
        <rect key={x} x={x} y="190" width="20" height="74" rx="2" fill={p.a} />
      ))}
      <rect x="60" y="266" width="180" height="11" fill={p.a} />
      <rect x="50" y="279" width="200" height="11" fill={p.b} />
      <circle cx="150" cy="154" r="7" fill={p.bg} />
      <g className="ill-gavel" style={{ transformOrigin: '238px 130px' }}>
        <rect x="214" y="78" width="46" height="20" rx="5" fill={p.b} transform="rotate(-28 237 88)" />
        <rect x="233" y="94" width="7" height="46" rx="3" fill={p.b} transform="rotate(-28 237 88)" />
      </g>
    </g>
  )
}

function Handshake({ p }) {
  return (
    <g>
      <circle cx="150" cy="168" r="78" fill={p.a} />
      <g fill="none" stroke={p.bg} strokeWidth="5" opacity="0.55" className="ill-globe">
        <ellipse cx="150" cy="168" rx="30" ry="78" />
        <ellipse cx="150" cy="168" rx="60" ry="78" />
        <line x1="72" y1="168" x2="228" y2="168" />
        <path d="M84 128 Q150 112 216 128 M84 208 Q150 224 216 208" />
      </g>
      <g className="ill-shake">
        <rect x="30" y="226" width="92" height="34" rx="8" fill={p.b} />
        <rect x="178" y="226" width="92" height="34" rx="8" fill="#1d2433" />
        <rect x="108" y="222" width="62" height="40" rx="18" fill={SKIN[1]} />
        <rect x="134" y="230" width="58" height="34" rx="17" fill={SKIN[3]} />
        <rect x="120" y="244" width="40" height="12" rx="6" fill={SKIN[1]} />
      </g>
    </g>
  )
}

function Chart({ p }) {
  const bars = [[70, 70], [112, 104], [154, 138], [196, 176]]
  return (
    <g>
      {bars.map(([x, h], i) => (
        <rect key={x} className="ill-bar" style={{ transformOrigin: `${x + 15}px 290px`, animationDelay: `${i * 0.12}s` }}
          x={x} y={290 - h} width="30" height={h} rx="3" fill={p.a} />
      ))}
      <rect x="56" y="290" width="188" height="6" rx="3" fill={p.a} />
      <path d="M70 196 L126 160 L160 176 L226 102" fill="none" stroke={p.b} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      <polygon points="232,88 238,118 210,104" fill={p.b} />
      <g className="ill-coin">
        <circle cx="86" cy="118" r="24" fill={p.b} />
        <circle cx="86" cy="118" r="16" fill="none" stroke={p.a} strokeWidth="4" />
        <text x="86" y="129" textAnchor="middle" fontFamily="'Geist Variable', sans-serif" fontWeight="800" fontSize="28" fill={p.a}>$</text>
      </g>
    </g>
  )
}

function Classroom({ p }) {
  return (
    <g>
      <g className="ill-cap" style={{ transformOrigin: '150px 120px' }}>
        <polygon points="150,92 214,118 150,144 86,118" fill={p.a} />
        <path d="M112 130 v22 q38 18 76 0 v-22 l-38 15 z" fill={p.a} />
        <path d="M206 121 v34" stroke={p.b} strokeWidth="4" className="ill-tassel" style={{ transformOrigin: '206px 121px' }} />
        <circle cx="206" cy="158" r="6" fill={p.b} className="ill-tassel" style={{ transformOrigin: '206px 121px' }} />
      </g>
      <path d="M150 206 C120 190 82 188 52 196 L52 282 C82 274 120 276 150 292 Z" fill={p.b} />
      <path d="M150 206 C180 190 218 188 248 196 L248 282 C218 274 180 276 150 292 Z" fill={p.b} />
      <path d="M150 206 V292" stroke={p.a} strokeWidth="4" />
      {[214, 230, 246].map((y) => (
        <g key={y} stroke={p.a} strokeWidth="3" opacity="0.6" strokeLinecap="round">
          <line x1="70" y1={y} x2="132" y2={y + 4} />
          <line x1="168" y1={y + 4} x2="230" y2={y} />
        </g>
      ))}
      <path d="M44 290 Q150 316 256 290" fill="none" stroke={p.a} strokeWidth="6" strokeLinecap="round" />
    </g>
  )
}

function Arrival({ p }) {
  return (
    <g>
      <g className="ill-plane">
        <path d="M58 92 h70 l22 -14 h10 l-12 20 h26 l10 -8 h8 l-6 14 l6 14 h-8 l-10 -8 h-26 l12 20 h-10 l-22 -14 h-70 z" fill={p.b} transform="translate(0 6)" />
        <path d="M24 104 h26" stroke={p.b} strokeWidth="4" strokeDasharray="6 6" strokeLinecap="round" className="ill-trail" />
      </g>
      <polygon points="168,170 236,124 304,170" fill={p.a} transform="translate(-30 0)" />
      <rect x="148" y="170" width="116" height="96" fill={p.a} />
      <rect x="194" y="214" width="26" height="52" rx="3" fill={p.b} />
      <rect x="162" y="186" width="22" height="22" rx="2" fill={p.b} className="ill-window" />
      <rect x="230" y="186" width="22" height="22" rx="2" fill={p.b} className="ill-window" style={{ animationDelay: '0.4s' }} />
      {/* family */}
      <circle cx="74" cy="200" r="13" fill={SKIN[0]} />
      <rect x="58" y="216" width="32" height="50" rx="14" fill={p.a} />
      <circle cx="116" cy="204" r="12" fill={SKIN[4]} />
      <rect x="101" y="219" width="30" height="47" rx="13" fill={p.b} />
      <circle cx="96" cy="234" r="9" fill={SKIN[1]} />
      <rect x="85" y="246" width="22" height="20" rx="9" fill={p.ink} />
      <rect x="128" y="240" width="20" height="26" rx="4" fill={p.ink} opacity="0.85" />
      <rect x="40" y="266" width="230" height="8" rx="4" fill={p.a} />
    </g>
  )
}

function Heart({ p }) {
  return (
    <g>
      <path className="ill-heart" style={{ transformOrigin: '150px 196px' }}
        d="M150 272 C70 218 58 178 72 150 C88 118 132 116 150 148 C168 116 212 118 228 150 C242 178 230 218 150 272 Z" fill={p.a} />
      <path className="ill-ekg" d="M34 196 H104 L118 168 L134 226 L150 150 L166 214 L178 196 H266"
        fill="none" stroke={p.b} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      {[[62, 96], [236, 104], [214, 290]].map(([x, y]) => (
        <path key={x} d={`M${x - 9} ${y} h18 M${x} ${y - 9} v18`} stroke={p.a} strokeWidth="5" strokeLinecap="round" />
      ))}
    </g>
  )
}

function Nature({ p }) {
  return (
    <g>
      <g className="ill-sun" style={{ transformOrigin: '196px 132px' }}>
        <circle cx="196" cy="132" r="34" fill={p.a} />
        {Array.from({ length: 10 }, (_, i) => (
          <rect key={i} x="194" y="80" width="4" height="14" rx="2" fill={p.a} transform={`rotate(${i * 36} 196 132)`} />
        ))}
      </g>
      <polygon points="30,286 112,166 194,286" fill={p.b} />
      <polygon points="112,286 196,186 280,286" fill={p.b} opacity="0.75" />
      <polygon points="112,166 128,190 98,190" fill={p.a} opacity="0.9" />
      <g className="ill-tree" style={{ transformOrigin: '80px 288px' }}>
        <rect x="76" y="252" width="8" height="36" fill={p.a} />
        <polygon points="80,196 104,240 56,240" fill={p.a} />
        <polygon points="80,218 108,262 52,262" fill={p.a} />
      </g>
      <path d="M30 294 Q90 284 150 294 T270 294" fill="none" stroke={p.a} strokeWidth="6" strokeLinecap="round" className="ill-river" />
    </g>
  )
}

function Chip({ p }) {
  const pins = [124, 150, 176]
  return (
    <g>
      <g stroke={p.b} strokeWidth="4" fill="none" strokeLinecap="round" className="ill-traces">
        <path d="M40 120 H86 V146" /><path d="M260 112 H216 V146" />
        <path d="M40 270 H92 V246" /><path d="M262 266 H214 V246" />
        <path d="M150 74 V104" /><path d="M150 300 V284" />
      </g>
      {[[40, 120], [260, 112], [40, 270], [262, 266], [150, 74]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="7" fill={p.b} className="ill-node" style={{ animationDelay: `${i * 0.25}s` }} />
      ))}
      <rect x="96" y="132" width="108" height="124" rx="12" fill={p.a} />
      {pins.map((y) => <rect key={`l${y}`} x="80" y={y + 4} width="16" height="6" rx="2" fill={p.a} />)}
      {pins.map((y) => <rect key={`r${y}`} x="204" y={y + 4} width="16" height="6" rx="2" fill={p.a} />)}
      <rect x="112" y="150" width="76" height="88" rx="6" fill={p.bg} />
      <text x="150" y="208" textAnchor="middle" fontFamily="'Geist Mono Variable', monospace" fontWeight="700" fontSize="34" fill={p.a}>AI</text>
      <path className="ill-spark" d="M224 92 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 z" fill={p.b} />
    </g>
  )
}

function Protest({ p }) {
  const signs = [
    { x: 54, y: 118, r: -8, mark: 'eq' },
    { x: 116, y: 96, r: 3, mark: 'vote' },
    { x: 184, y: 116, r: 9, mark: 'heart' },
  ]
  return (
    <g>
      {signs.map((s, i) => (
        <g key={i} className="ill-sign" style={{ transformOrigin: `${s.x + 32}px 290px`, animationDelay: `${i * 0.18}s` }}>
          <g transform={`rotate(${s.r} ${s.x + 32} 220)`}>
            <rect x={s.x + 29} y={s.y + 50} width="6" height="120" fill={p.a} />
            <rect x={s.x} y={s.y} width="64" height="58" rx="4" fill={p.b} />
            {s.mark === 'eq' && <g fill={p.bg}><rect x={s.x + 16} y={s.y + 18} width="32" height="7" rx="2" /><rect x={s.x + 16} y={s.y + 33} width="32" height="7" rx="2" /></g>}
            {s.mark === 'vote' && <text x={s.x + 32} y={s.y + 37} textAnchor="middle" fontFamily="'Geist Variable', sans-serif" fontWeight="800" fontSize="18" fill={p.bg}>VOTE</text>}
            {s.mark === 'heart' && <path d={`M${s.x + 32} ${s.y + 44} c-18 -12 -20 -22 -14 -28 c6 -6 12 -2 14 4 c2 -6 8 -10 14 -4 c6 6 4 16 -14 28 z`} fill={p.bg} />}
          </g>
        </g>
      ))}
      {[[60, 0], [104, 4], [150, 1], [196, 3], [240, 2]].map(([x, s], i) => (
        <g key={i}>
          <circle cx={x} cy={262} r="15" fill={SKIN[s]} />
          <rect x={x - 20} y="278" width="40" height="30" rx="14" fill={p.a} />
        </g>
      ))}
    </g>
  )
}

function Debate({ p }) {
  return (
    <g>
      <g className="ill-bubble" style={{ transformOrigin: '96px 150px' }}>
        <rect x="40" y="86" width="104" height="62" rx="18" fill={p.a} />
        <polygon points="74,146 96,146 76,166" fill={p.a} />
        {[70, 92, 114].map((x) => <circle key={x} cx={x} cy="117" r="6" fill={p.bg} />)}
      </g>
      <g className="ill-bubble" style={{ transformOrigin: '204px 140px', animationDelay: '0.5s' }}>
        <rect x="156" y="74" width="104" height="62" rx="18" fill={p.b} />
        <polygon points="226,134 204,134 224,154" fill={p.b} />
        <rect x="178" y="100" width="60" height="7" rx="3" fill={p.bg} />
        <rect x="178" y="112" width="40" height="7" rx="3" fill={p.bg} />
      </g>
      <path d="M106 206 h88 l-10 84 h-68 z" fill={p.a} />
      <rect x="96" y="196" width="108" height="14" rx="3" fill={p.b} />
      <circle cx="150" cy="246" r="13" fill={p.b} />
      <path d="M128 196 L118 168 M172 196 L182 168" stroke={p.b} strokeWidth="5" strokeLinecap="round" />
      <circle cx="117" cy="164" r="7" fill={p.b} />
      <circle cx="183" cy="164" r="7" fill={p.b} />
      <rect x="70" y="290" width="160" height="8" rx="4" fill={p.b} />
    </g>
  )
}

const BY_TOPIC = {
  'Criminal Justice': Courthouse,
  'Foreign Policy': Handshake,
  Economy: Chart,
  Education: Classroom,
  Immigration: Arrival,
  Healthcare: Heart,
  Climate: Nature,
  Technology: Chip,
  'Civil Rights': Protest,
  Other: Debate,
}

function CoverIllustration({ topic, palette, seed, compact = false }) {
  const Drawing = BY_TOPIC[topic] || Debate
  const r = rng(seedFrom(`${seed}-halo`))
  // A soft halo behind the drawing, placed differently on every bill
  const hx = 80 + r() * 140
  const hy = 110 + r() * 120
  const hr = 70 + r() * 50
  const ring = r() < 0.5
  return (
    <svg className="cover-ill" viewBox="0 0 300 420" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="300" height="420" fill={palette.bg} />
      {ring
        ? <circle cx={hx} cy={hy} r={hr} fill="none" stroke={palette.ink} strokeOpacity="0.12" strokeWidth="18" />
        : <circle cx={hx} cy={hy} r={hr} fill={palette.ink} fillOpacity="0.08" />}
      {compact ? (
        // With a title plate on the cover, shrink the drawing into the top
        // two thirds so the plate never hides it. A nested viewport keeps the
        // animation origins (set in 300x420 units) correct.
        <svg x="39" y="2" width="222" height="311" viewBox="0 0 300 420" overflow="visible">
          <g transform="translate(0 6)"><Drawing p={palette} /></g>
        </svg>
      ) : (
        <g transform="translate(0 6)">
          <Drawing p={palette} />
        </g>
      )}
    </svg>
  )
}

export default memo(CoverIllustration)
