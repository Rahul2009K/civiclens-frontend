import { useEffect, useRef } from 'react'
import { sfx } from '../lib/sfx'

// Every click sends out a ring and a few four-point stars. Elements marked
// data-burst="big" (books) get a larger golden burst. Buttons and links also
// tick, unless they play their own sound (data-sfx="custom").
const STAR = 'M0 -10 C1.2 -2 2 -1.2 10 0 C2 1.2 1.2 2 0 10 C-1.2 2 -2 1.2 -10 0 C-2 -1.2 -1.2 -2 0 -10 Z'
const COLORS = ['var(--accent)', 'var(--spark-gold)', 'var(--spark-light)', 'var(--accent)']

export default function ClickSparks() {
  const layer = useRef(null)

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    function burst(x, y, big) {
      const root = layer.current
      if (!root) return
      const ring = document.createElement('span')
      ring.className = 'spark-ring'
      ring.style.left = `${x}px`
      ring.style.top = `${y}px`
      root.appendChild(ring)
      ring.animate(
        [{ transform: 'translate(-50%, -50%) scale(0.2)', opacity: 0.9 }, { transform: `translate(-50%, -50%) scale(${big ? 2.6 : 1.5})`, opacity: 0 }],
        { duration: big ? 700 : 480, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' }
      ).onfinish = () => ring.remove()

      const count = big ? 14 : 7
      for (let i = 0; i < count; i++) {
        const el = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
        el.setAttribute('viewBox', '-10 -10 20 20')
        el.setAttribute('class', 'spark-star')
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', STAR)
        path.style.fill = COLORS[i % COLORS.length] // style, not attribute, so CSS variables resolve everywhere
        el.appendChild(path)
        const size = (big ? 12 : 9) + Math.random() * (big ? 10 : 6)
        el.style.width = `${size}px`
        el.style.height = `${size}px`
        el.style.left = `${x}px`
        el.style.top = `${y}px`
        root.appendChild(el)
        const angle = (i / count) * Math.PI * 2 + Math.random() * 0.6
        const dist = (big ? 60 : 28) + Math.random() * (big ? 70 : 26)
        const dx = Math.cos(angle) * dist
        const dy = Math.sin(angle) * dist
        const spin = (Math.random() - 0.5) * 360
        el.animate(
          [
            { transform: 'translate(-50%, -50%) scale(0) rotate(0deg)', opacity: 1 },
            { transform: `translate(calc(-50% + ${dx * 0.7}px), calc(-50% + ${dy * 0.7}px)) scale(1) rotate(${spin / 2}deg)`, opacity: 1, offset: 0.45 },
            { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy + 14}px)) scale(0.2) rotate(${spin}deg)`, opacity: 0 },
          ],
          { duration: (big ? 900 : 620) + Math.random() * 200, easing: 'cubic-bezier(0.2, 0.7, 0.3, 1)' }
        ).onfinish = () => el.remove()
      }
    }

    function onDown(e) {
      if (e.button !== 0) return
      const target = e.target instanceof Element ? e.target : null
      const interactive = target?.closest('a, button, summary, [role="button"], input, label')
      if (interactive && !interactive.closest('[data-sfx="custom"]') && interactive.tagName !== 'INPUT') sfx.click()
      if (reduce.matches) return
      burst(e.clientX, e.clientY, !!target?.closest('[data-burst="big"]'))
    }

    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [])

  return <div className="sparks" ref={layer} aria-hidden="true" />
}
