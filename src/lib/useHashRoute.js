import { useEffect, useState } from 'react'

// Tiny hash router: #/  ·  #/bill/<id>  ·  #/watchlist  ·  #/about  ·  #/new|bills|how (home sections)
// Hash URLs work on any static host with no rewrite rules.
function parse(hash) {
  const path = hash.replace(/^#/, '') || '/'
  const bill = path.match(/^\/bill\/([^/]+)\/?$/)
  if (bill) return { name: 'bill', id: decodeURIComponent(bill[1]) }
  if (/^\/watchlist\/?$/.test(path)) return { name: 'watchlist' }
  if (/^\/about\/?$/.test(path)) return { name: 'about' }
  const section = path.match(/^\/(new|bills|how)\/?$/)
  if (section) return { name: 'home', section: section[1] }
  return { name: 'home' }
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parse(window.location.hash))

  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}

export const billHref = (id) => `#/bill/${encodeURIComponent(id)}`
