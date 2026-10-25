import { useEffect, useRef } from 'react'
import { BookFront } from './Book'
import { ScalesMark } from './Brand'
import { billFacts, clean, paletteFor } from '../lib/bills'

// Plays when a book is clicked: it lifts off the page, flies to the centre,
// swings its cover open, then hands off to the bill page.
// Uses the Web Animations API so timing is exact and nothing touches React state mid-flight.
export default function BookOpener({ opening, onNavigate, onDone }) {
  const rootRef = useRef(null)
  const bookRef = useRef(null)
  const coverRef = useRef(null)
  const flashRef = useRef(null)
  const { bill, rect } = opening
  const palette = paletteFor(bill)
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

    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)'
    const anims = [
      root.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 260, fill: 'forwards' }),
      book.animate(
        [
          { transform: `translate(${fromX}px, ${fromY}px) scale(${fromScale}) rotateY(24deg)` },
          { transform: 'translate(0, -12px) scale(1.04) rotateY(-8deg)', offset: 0.75 },
          { transform: 'translate(0, 0) scale(1) rotateY(0deg)' },
        ],
        { duration: 620, easing: ease, fill: 'forwards' }
      ),
      coverRef.current.animate(
        [{ transform: 'rotateY(0deg)' }, { transform: 'rotateY(-158deg)' }],
        { duration: 720, delay: 560, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }
      ),
      flashRef.current.animate(
        [{ opacity: 0, transform: 'scale(0.4)' }, { opacity: 1, transform: 'scale(1)', offset: 0.35 }, { opacity: 0, transform: 'scale(1.6)' }],
        { duration: 900, delay: 700, easing: 'ease-out', fill: 'forwards' }
      ),
    ]

    const toPage = setTimeout(onNavigate, 1180)
    const fadeOut = setTimeout(() => {
      const out = root.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, fill: 'forwards' })
      out.onfinish = onDone
    }, 1300)

    return () => {
      clearTimeout(toPage)
      clearTimeout(fadeOut)
      anims.forEach((a) => a.cancel())
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
            <span className="opener-page-brand"><ScalesMark /> CivicLens</span>
          </div>
          <div className="opener-cover" ref={coverRef}>
            <div className="opener-cover-front book-front-like"><BookFront bill={bill} showTitle /></div>
            <div className="opener-cover-inside" />
          </div>
        </div>
      </div>
    </div>
  )
}
