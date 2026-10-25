import { useState } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import Book from './Book'
import { openOnClick } from '../lib/openBook'
import { billFacts, clean, formatDate, paletteFor, primaryTopic, rng, seedFrom } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'

// The newest bills standing spine-out on a shelf. Hover pulls one forward and
// turns its cover toward you; click plays the opening animation.
export default function Bookshelf({ bills, ctx }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(null)
  const shown = active ?? bills[0]
  const facts = shown ? billFacts(shown) : null

  return (
    <div className="shelf">
      <div className="shelf-scene" onPointerLeave={() => setActive(null)}>
        <div className="shelf-row">
          {bills.map((bill, i) => {
            const r = rng(seedFrom(bill.id))
            return (
              <motion.a
                key={bill.id}
                href={billHref(bill.id)}
                className={`shelf-book${active?.id === bill.id ? ' is-active' : ''}`}
                style={{
                  '--h': `${(0.88 + r() * 0.16).toFixed(3)}`,
                  '--lean': `${(r() - 0.5) * 2.4}deg`,
                  '--cover': paletteFor(bill).bg,
                }}
                aria-label={`${billFacts(bill).label}: ${clean(bill.plain_title)}`}
                onPointerEnter={() => setActive(bill)}
                onFocus={() => setActive(bill)}
                onClick={(e) => openOnClick(e, bill, ctx)}
                initial={reduce ? false : { opacity: 0, y: -60 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ type: 'spring', stiffness: 260, damping: 18, delay: reduce ? 0 : i * 0.06 }}
              >
                <Book bill={bill} size="shelf" />
              </motion.a>
            )
          })}
        </div>
        <div className="shelf-plank" aria-hidden="true" />
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
