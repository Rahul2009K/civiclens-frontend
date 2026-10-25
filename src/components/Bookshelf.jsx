import { useEffect, useState } from 'react'
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

// Shown under the shelf while no book is pulled out. Gentle, nonpartisan
// jokes about how Congress works, rotating every few seconds.
const QUIPS = [
  ['Fresh off the floor', 'Still warm from the congressional printer.'],
  ['Committee status', 'A bill walks into committee. Two years later, it is still in committee.'],
  ['Schoolhouse Rock', '“I’m just a bill.” Well, here are ten of them.'],
  ['Origin story', 'Every one of these started with someone saying “there ought to be a law.”'],
  ['Naming department', 'Somewhere, a staffer is still workshopping the acronym for one of these.'],
  ['Odds', 'Most bills never become law. These ones are still dreaming.'],
  ['Disclaimer', 'No filibusters were harmed in the making of this shelf.'],
  ['Attributed, loosely', '“Laws are like sausages: better not to see them made.” Probably never said by Bismarck.'],
  ['Reading time', 'Pick one. It’s shorter than the 400-page original, promise.'],
  ['Breaking', 'Congress has opinions again. Here are the newest ones.'],
]

// The newest bills standing spine-out in a wooden bookcase. Hover pulls one
// forward and turns its cover toward you; click plays the opening animation.
export default function Bookshelf({ bills, ctx }) {
  const reduce = useReducedMotion()
  const [active, setActive] = useState(null)
  const [quip, setQuip] = useState(0)
  const shown = active
  const facts = shown ? billFacts(shown) : null

  // Rotate the quip only while nobody is browsing the shelf
  useEffect(() => {
    if (active) return
    const id = setInterval(() => setQuip((q) => (q + 1) % QUIPS.length), 6000)
    return () => clearInterval(id)
  }, [active])

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

      <div className="shelf-caption" aria-live="polite">
        {shown ? (
          <>
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
          </>
        ) : (
          <motion.div
            key={`quip-${quip}`}
            initial={reduce ? false : { opacity: 0, y: 10, filter: 'blur(4px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="shelf-caption-meta mono">{QUIPS[quip][0]}</span>
            <p className="shelf-caption-title is-quip">{QUIPS[quip][1]}</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
