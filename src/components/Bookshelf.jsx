import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Book from './Book'
import { openOnClick } from '../lib/openBook'
import { billFacts, clean, formatDate, primaryTopic, rng, seedFrom } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'
import { sfx } from '../lib/sfx'

// Loud, clashing jacket colors so the shelf reads like a real mixed bookcase.
const JACKETS = [
  { bg: '#ff4f7b', a: '#1c1aa6', b: '#ffe14d', ink: '#fff4f6' },
  { bg: '#2d5bff', a: '#ff8a1f', b: '#d8ff3d', ink: '#f2f5ff' },
  { bg: '#ffd23f', a: '#e0245e', b: '#1b2a8f', ink: '#1a1400' },
  { bg: '#16b58a', a: '#ff3d6e', b: '#fff1a8', ink: '#f0fff9' },
  { bg: '#ff7a1a', a: '#3b1d8f', b: '#2ee6c5', ink: '#fff3e8' },
  { bg: '#7b2ff7', a: '#c6ff3d', b: '#ff9ecb', ink: '#f6f0ff' },
  { bg: '#c6f23d', a: '#7b2ff7', b: '#ff5a1f', ink: '#18210a' },
  { bg: '#e8262b', a: '#ffd23f', b: '#0b6e6e', ink: '#fff1ee' },
  { bg: '#0f9fd8', a: '#ff4f7b', b: '#fff3c4', ink: '#f1fbff' },
  { bg: '#1d1b4f', a: '#ff6a3d', b: '#5ef0c5', ink: '#f3f1ff' },
]

// The newest bills standing spine-out in a wooden bookcase. Hover pulls one
// forward and turns its cover toward you; click plays the opening animation.
export default function Bookshelf({ bills, ctx }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(null)
  const shown = active ?? bills[0]
  const facts = shown ? billFacts(shown) : null

  function pull(bill) {
    setActive(bill)
    sfx.slide()
  }

  return (
    <div className="shelf">
      <div className="bookcase" onPointerLeave={() => setActive(null)}>
        <div className="bookcase-back" aria-hidden="true" />
        <div className="shelf-scene">
          <div className="shelf-row">
            <span className="bookend bookend-left" aria-hidden="true" />
            {bills.map((bill, i) => {
              const r = rng(seedFrom(bill.id))
              const jacket = JACKETS[i % JACKETS.length]
              return (
                <motion.a
                  key={bill.id}
                  href={billHref(bill.id)}
                  className={`shelf-book${active?.id === bill.id ? ' is-active' : ''}`}
                  style={{
                    '--h': `${(0.86 + r() * 0.16).toFixed(3)}`,
                    '--lean': `${(r() - 0.5) * 2.4}deg`,
                  }}
                  data-burst="big"
                  data-sfx="custom"
                  aria-label={`${billFacts(bill).label}: ${clean(bill.plain_title)}`}
                  onPointerEnter={() => pull(bill)}
                  onFocus={() => setActive(bill)}
                  onClick={(e) => openOnClick(e, bill, ctx, jacket)}
                  initial={reduce ? false : { opacity: 0, y: -70 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 17, delay: reduce ? 0 : i * 0.06 }}
                >
                  <Book bill={bill} size="shelf" palette={jacket} />
                </motion.a>
              )
            })}
            <span className="bookend bookend-right" aria-hidden="true" />
          </div>
        </div>
        <div className="shelf-plank" aria-hidden="true">
          <span className="shelf-label mono">Just in</span>
        </div>
      </div>

      {shown && (
        <div className="shelf-caption" aria-live="polite">
          <span className="shelf-caption-meta mono">
            {facts.label} · {primaryTopic(shown)}
            {shown.latest_action_date && <> · {formatDate(shown.latest_action_date)}</>}
          </span>
          <motion.p
            key={shown.id}
            className="shelf-caption-title"
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {clean(shown.plain_title)}
          </motion.p>
        </div>
      )}
    </div>
  )
}
