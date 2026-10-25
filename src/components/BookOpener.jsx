import { useEffect, useRef } from 'react'
import { BookFront } from './Book'
import { ScalesMark } from './Brand'
import { billFacts, clean, paletteFor } from '../lib/bills'
import { sfx } from '../lib/sfx'

const SHEETS = 3

// Plays when a book is clicked: it lifts off the page, flies to the centre,
// swings its cover open, riffles a few pages with a puff of golden dust,
// then hands off to the bill page. Web Animations API keeps the timing exact
// without touching React state mid-flight.
export default function BookOpener({ opening, onNavigate, onDone }) {
  const rootRef = useRef(null)
  const bookRef = useRef(null)
  const coverRef = useRef(null)
  const flashRef = useRef(null)
  const sheetsRef = useRef([])
  const dustRef = useRef(null)
  const { bill, rect } = opening
  const palette = opening.palette || paletteFor(bill)
  const facts = billFacts(bill)

  useEffect(() => {
    const root = rootRef.current
    const book = bookRef.current
    const W = Math.min(340, window.innerWidth * 0.62)
    const H = W * 1.4
    book.style.width = `${W}px`
    book.style.height = `${H}px`

    // Start exactly where the clicked book sits on the page
    const cx = window.innerWidth / 2
    const cy = window.innerHeight / 2
    const fromX = rect.left + rect.width / 2 - cx
    const fromY = rect.top + rect.height / 2 - cy
    const fromScale = Math.max(0.15, rect.width / W)

    sfx.bookOpen()

    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)'
    const turn = 'cubic-bezier(0.65, 0, 0.35, 1)'
    const anims = [
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' }),
      book.animate(
        [
          { transform: `translate(${fromX}px, ${fromY}px) scale(${fromScale}) rotateY(24deg)` },
          { transform: 'translate(0, -14px) scale(1.04) rotateY(-8deg)', offset: 0.75 },
          { transform: 'translate(0, 0) scale(1) rotateY(0deg)' },
        ],
        { duration: 620, easing: ease, fill: 'forwards' }
      ),
      coverRef.current.animate(
        [{ transform: 'translateZ(5px) rotateY(0deg)' }, { transform: 'translateZ(5px) rotateY(-162deg)' }],
        { duration: 640, delay: 520, easing: turn, fill: 'forwards' }
      ),
      ...sheetsRef.current.map((sheet, i) =>
        sheet.animate(
          [{ transform: `translateZ(${SHEETS - i}px) rotateY(0deg)` }, { transform: `translateZ(${SHEETS - i}px) rotateY(-${154 - i * 6}deg)` }],
          { duration: 420, delay: 700 + i * 110, easing: turn, fill: 'forwards' }
        )
      ),
      flashRef.current.animate(
        [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.6)' }],
        { duration: 900, delay: 760, easing: 'ease-out', fill: 'forwards' }
      ),
    ]

    // Golden dust rising out of the open pages
    const dust = dustRef.current
    const motes = []
    const dustTimer = setTimeout(() => {
      for (let i = 0; i < 26; i++) {
        const m = document.createElement('span')
        m.className = 'opener-mote'
        const size = 3 + Math.random() * 5
        m.style.width = `${size}px`
        m.style.height = `${size}px`
        m.style.left = `${W * (0.15 + Math.random() * 0.8)}px`
        m.style.top = `${H * (0.25 + Math.random() * 0.6)}px`
        dust.appendChild(m)
        motes.push(m)
        m.animate(
          [
            { transform: 'translate(0, 0) scale(0)', opacity: 0 },
            { transform: `translate(${(Math.random() - 0.5) * 40}px, -30px) scale(1)`, opacity: 1, offset: 0.25 },
            { transform: `translate(${(Math.random() - 0.5) * 120}px, ${-90 - Math.random() * 120}px) scale(0.4)`, opacity: 0 },
          ],
          { duration: 900 + Math.random() * 600, delay: Math.random() * 300, easing: 'ease-out', fill: 'forwards' }
        )
      }
    }, 780)

    const toPage = setTimeout(onNavigate, 1750)
    const fadeOut = setTimeout(() => {
      const out = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' })
      out.onfinish = onDone
    }, 1850)

    return () => {
      clearTimeout(dustTimer)
      clearTimeout(toPage)
      clearTimeout(fadeOut)
      anims.forEach((a) => a.cancel())
      motes.forEach((m) => m.remove())
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="opener" ref={rootRef} aria-hidden="true">
      <div className="opener-dim" />
      <div className="opener-flash" ref={flashRef} />
      <div className="opener-stage">
        <div className="opener-book" ref={bookRef} style={{ '--cover': palette.bg, '--cover-ink': palette.ink }}>
          <div className="opener-page">
            <span className="opener-page-label">{facts.label}</span>
            <p className="opener-page-title">{clean(bill.plain_title)}</p>
            <span className="opener-page-brand"><ScalesMark /> Billshelf</span>
          </div>
          {Array.from({ length: SHEETS }, (_, i) => (
            <div
              key={i}
              className="opener-sheet"
              ref={(el) => { sheetsRef.current[i] = el }}
              style={{ zIndex: 2 + SHEETS - i }}
            />
          ))}
          <div className="opener-cover" ref={coverRef}>
            <div className="opener-cover-front"><BookFront bill={bill} palette={palette} showTitle /></div>
            <div className="opener-cover-inside" />
          </div>
          <div className="opener-dust" ref={dustRef} />
        </div>
      </div>
    </div>
  )
}
