import { useEffect, useRef, useState } from 'react'
import CoverArt from './CoverArt'
import { ScalesMark } from './Brand'
import { billFacts, clean, paletteFor } from '../lib/bills'
import { billHref } from '../lib/useHashRoute'

// The newest bills as a floating stack of hardcovers, seen from the spine.
// Each slab is a link; hovering pulls it out of the stack.
export default function BillStack({ bills }) {
  const sceneRef = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = sceneRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setInView(true); io.disconnect() }
    }, { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  function onPointerMove(e) {
    if (e.pointerType === 'touch') return
    const el = sceneRef.current
    const b = el.getBoundingClientRect()
    const x = (e.clientX - b.left) / b.width - 0.5
    const y = (e.clientY - b.top) / b.height - 0.5
    el.style.setProperty('--tilt-y', `${x * 14}deg`)
    el.style.setProperty('--tilt-x', `${-21 - y * 8}deg`)
  }

  function onPointerLeave() {
    sceneRef.current?.style.removeProperty('--tilt-y')
    sceneRef.current?.style.removeProperty('--tilt-x')
  }

  return (
    <div
      className={`stack-scene${inView ? ' is-in' : ''}`}
      ref={sceneRef}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
    >
      <div className="stack">
        {bills.map((bill, i) => {
          const p = paletteFor(bill)
          const facts = billFacts(bill)
          return (
            <a
              key={bill.id}
              href={billHref(bill.id)}
              className="slab"
              style={{ '--i': i, '--cover': p.bg, '--cover-ink': p.ink }}
              aria-label={`${facts.label}: ${clean(bill.plain_title)}`}
            >
              <span className="slab-face slab-top">
                <CoverArt seed={`${bill.id}-lid`} palette={p} width={640} height={300} />
              </span>
              <span className="slab-face slab-front">
                <span className="slab-label">{facts.label}</span>
                <span className="slab-title">{clean(bill.plain_title)}</span>
                <ScalesMark className="slab-mark" />
              </span>
              <span className="slab-face slab-side slab-left" />
              <span className="slab-face slab-side slab-right" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
