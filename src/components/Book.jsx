import { useEffect, useRef } from 'react'
import CoverIllustration from './CoverIllustration'
import { ScalesMark } from './Brand'
import { billFacts, clean, paletteFor, primaryTopic } from '../lib/bills'

export function BookFront({ bill, palette, showTitle }) {
  const pal = palette || paletteFor(bill)
  const facts = billFacts(bill)
  return (
    <>
      <CoverIllustration topic={primaryTopic(bill)} palette={pal} seed={bill.id} compact={showTitle} />
      <div className="book-sheen" />
      <span className="book-badge"><ScalesMark /></span>
      <div className="book-plate">
        <span className="book-plate-label">{facts.label}</span>
        {showTitle && (
          <span className={`book-plate-title${bill.plain_title.length > 58 ? ' is-long' : ''}`}>{clean(bill.plain_title)}</span>
        )}
        <span className="book-plate-topic">{primaryTopic(bill)}</span>
      </div>
    </>
  )
}

function BookBack({ bill }) {
  const facts = billFacts(bill)
  return (
    <div className="book-back-inner">
      <span className="book-back-label">{facts.label}</span>
      <p className="book-back-title">{clean(bill.plain_title)}</p>
      <p className="book-back-text">{clean(bill.plain_summary)}</p>
      <span className="book-back-brand"><ScalesMark /> CivicLens</span>
    </div>
  )
}

// Hover spin: rotate continuously, then ease back to the resting angle on leave.
function useSpin(ref, enabled) {
  useEffect(() => {
    const el = ref.current
    if (!enabled || !el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const host = el.closest('[data-spin-host]') || el.parentElement
    let angle = 0
    let raf = 0
    let last = 0
    let settling = false

    const apply = () => { el.style.setProperty('--spin', `${angle}deg`) }
    const tick = (now) => {
      const dt = last ? Math.min(48, now - last) : 16
      last = now
      if (settling) {
        // Glide forward to the next full turn so it lands face-out
        const target = Math.ceil(angle / 360) * 360
        angle += Math.max(0.6, (target - angle) * 0.12)
        if (angle >= target - 0.5) { angle = 0; apply(); raf = 0; return }
      } else {
        angle += dt * 0.045 // about 8 seconds per turn
      }
      apply()
      raf = requestAnimationFrame(tick)
    }
    const start = () => { settling = false; last = 0; if (!raf) raf = requestAnimationFrame(tick) }
    const stop = () => { settling = true; if (!raf) { last = 0; raf = requestAnimationFrame(tick) } }

    host.addEventListener('pointerenter', start)
    host.addEventListener('pointerleave', stop)
    host.addEventListener('focusin', start)
    host.addEventListener('focusout', stop)
    return () => {
      cancelAnimationFrame(raf)
      host.removeEventListener('pointerenter', start)
      host.removeEventListener('pointerleave', stop)
      host.removeEventListener('focusin', start)
      host.removeEventListener('focusout', stop)
    }
  }, [ref, enabled])
}

// A bill rendered as a physical hardcover in CSS 3D.
// size: "sm" (grid, spins on hover), "lg" (bill page, follows pointer), "shelf" (spine out)
export default function Book({ bill, size = 'sm', palette: paletteOverride }) {
  const ref = useRef(null)
  const palette = paletteOverride || paletteFor(bill)
  const facts = billFacts(bill)
  const lg = size === 'lg'
  useSpin(ref, size === 'sm')

  function onPointerMove(e) {
    if (!lg || e.pointerType === 'touch' || !ref.current) return
    const box = ref.current.getBoundingClientRect()
    const x = (e.clientX - box.left) / box.width - 0.5
    const y = (e.clientY - box.top) / box.height - 0.5
    ref.current.style.setProperty('--ry', `${22 + x * 22}deg`)
    ref.current.style.setProperty('--rx', `${4 - y * 14}deg`)
  }

  function onPointerLeave() {
    if (!ref.current) return
    ref.current.style.removeProperty('--ry')
    ref.current.style.removeProperty('--rx')
  }

  return (
    <div
      className={`book-scene book-${size}`}
      onPointerMove={lg ? onPointerMove : undefined}
      onPointerLeave={lg ? onPointerLeave : undefined}
    >
      <div
        className="book"
        ref={ref}
        style={{ '--cover': palette.bg, '--cover-ink': palette.ink }}
      >
        <div className="book-face book-front">
          <BookFront bill={bill} palette={palette} showTitle={lg} />
        </div>
        <div className="book-face book-spine">
          <span className="book-spine-label">{facts.label}</span>
          {size === 'shelf' && <span className="book-spine-title">{clean(bill.plain_title)}</span>}
          <ScalesMark className="book-spine-mark" />
        </div>
        <div className="book-face book-pages" />
        <div className="book-face book-back"><BookBack bill={bill} /></div>
        <div className="book-face book-top" />
      </div>
      <div className="book-shadow" />
    </div>
  )
}
