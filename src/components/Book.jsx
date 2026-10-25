import { useRef } from 'react'
import CoverArt from './CoverArt'
import { ScalesMark } from './Brand'
import { billFacts, clean, paletteFor, primaryTopic } from '../lib/bills'

// A bill rendered as a physical hardcover: front, spine and page edges in CSS 3D.
// size="lg" adds the title plate and follows the pointer.
export default function Book({ bill, size = 'sm' }) {
  const ref = useRef(null)
  const palette = paletteFor(bill)
  const facts = billFacts(bill)
  const topic = primaryTopic(bill)
  const lg = size === 'lg'

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
          <CoverArt seed={bill.id} palette={palette} className="book-art" />
          <div className="book-sheen" />
          <span className="book-badge"><ScalesMark /></span>
          <div className="book-plate">
            <span className="book-plate-label">{facts.label}</span>
            {lg && <span className="book-plate-title">{clean(bill.plain_title)}</span>}
            <span className="book-plate-topic">{topic}</span>
          </div>
        </div>
        <div className="book-face book-spine">
          <span>{facts.label}</span>
          <ScalesMark className="book-spine-mark" />
        </div>
        <div className="book-face book-pages" />
        <div className="book-face book-back" />
      </div>
      <div className="book-shadow" />
    </div>
  )
}
