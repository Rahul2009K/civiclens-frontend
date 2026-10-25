// Helpers for turning raw cached bill records into display-ready facts.

// Each topic gets a "cover" palette, like a book series. bg is the cover
// color, a/b are the shapes, ink is text that sits on bg.
export const TOPIC_PALETTES = {
  Education:          { bg: '#2f4bd1', a: '#f4c247', b: '#f1ece3', ink: '#f6f2ea' },
  Immigration:        { bg: '#e2553e', a: '#1d2a5c', b: '#f3b748', ink: '#fff6ef' },
  Healthcare:         { bg: '#17796b', a: '#f2e5cf', b: '#0c3a33', ink: '#f4efe4' },
  Climate:            { bg: '#3f6d34', a: '#e6d79f', b: '#1b2c15', ink: '#f3efdf' },
  Economy:            { bg: '#d39a2f', a: '#1f2f58', b: '#f6eedd', ink: '#1a1712' },
  'Civil Rights':     { bg: '#7b2d55', a: '#f2b49a', b: '#f5eee6', ink: '#fbf2ee' },
  'Criminal Justice': { bg: '#a3312b', a: '#f0e4d2', b: '#1d1a1b', ink: '#fbf1ea' },
  Technology:         { bg: '#18202e', a: '#4fd6be', b: '#e8566f', ink: '#eef3f6' },
  'Foreign Policy':   { bg: '#285869', a: '#e8cf98', b: '#f3eee6', ink: '#f3efe7' },
  Other:              { bg: '#5d5751', a: '#ebe4d9', b: '#2a2624', ink: '#f4efe8' },
}

export function primaryTopic(bill) {
  const topics = bill?.topics || []
  return topics.find((t) => t !== 'Other' && TOPIC_PALETTES[t]) || topics[0] || 'Other'
}

export function paletteFor(bill) {
  return TOPIC_PALETTES[primaryTopic(bill)] || TOPIC_PALETTES.Other
}

const TYPE_INFO = {
  HR:      { label: 'H.R.',         chamber: 'House',  kind: 'Bill',                 slug: 'house-bill' },
  S:       { label: 'S.',           chamber: 'Senate', kind: 'Bill',                 slug: 'senate-bill' },
  HRES:    { label: 'H.Res.',       chamber: 'House',  kind: 'Resolution',           slug: 'house-resolution' },
  SRES:    { label: 'S.Res.',       chamber: 'Senate', kind: 'Resolution',           slug: 'senate-resolution' },
  HJRES:   { label: 'H.J.Res.',     chamber: 'House',  kind: 'Joint resolution',     slug: 'house-joint-resolution' },
  SJRES:   { label: 'S.J.Res.',     chamber: 'Senate', kind: 'Joint resolution',     slug: 'senate-joint-resolution' },
  HCONRES: { label: 'H.Con.Res.',   chamber: 'House',  kind: 'Concurrent resolution', slug: 'house-concurrent-resolution' },
  SCONRES: { label: 'S.Con.Res.',   chamber: 'Senate', kind: 'Concurrent resolution', slug: 'senate-concurrent-resolution' },
}

export function billFacts(bill) {
  const [congress = '119', type = 'HR', number = ''] = String(bill?.id || '').split('-')
  const info = TYPE_INFO[type] || { label: type, chamber: 'Congress', kind: 'Bill', slug: null }
  return {
    congress,
    number,
    label: `${info.label} ${number}`.trim(),
    chamber: info.chamber,
    kind: info.kind,
    url: info.slug
      ? `https://www.congress.gov/bill/${congress}th-congress/${info.slug}/${number}`
      : 'https://www.congress.gov/',
  }
}

// Where a bill sits in the process, read from the plain-English status.
export const STAGES = ['Introduced', 'In committee', 'Floor vote', 'Other chamber', 'Law']

// Civics 101: what each step actually means
export const STAGE_HELP = [
  'A member of Congress formally proposed the bill and it got a number, like H.R. 5744.',
  'A small group of lawmakers who specialize in the topic studies the bill. Most bills never leave committee.',
  'The bill is scheduled for debate and a vote by the full House or Senate.',
  'One chamber passed it. The other chamber (House or Senate) now has to pass the same text.',
  'Both chambers passed it and the President signed it, so it is now federal law.',
]

export function stageOf(bill) {
  const s = (bill?.status_plain_english || '').toLowerCase()
  if (/signed into law|law of the land|became (a )?law|now (official )?(u\.s\. )?law/.test(s)) return 4
  if (/passed (the|by the) (house|senate)|passed one chamber/.test(s)) return 3
  if (/waiting list|calendar|scheduled|floor/.test(s)) return 2
  if (/committee|lawmakers who|group of lawmakers|review/.test(s)) return 1
  return 0
}

// Model output sometimes uses long dashes; normalise them for display.
export function clean(text) {
  return String(text ?? '')
    .replace(/\s*[—–]\s*/g, ' - ')
    .replace(/�/g, '-')
}

// Small deterministic PRNG so every bill always gets the same cover.
export function seedFrom(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function rng(seed) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// "Sen. Bennet, Michael F. [D-CO]" -> "Sen. Michael F. Bennet (D-CO)"
export function sponsorName(sponsor) {
  if (!sponsor?.name) return null
  const m = sponsor.name.match(/^(Sen\.|Rep\.|Del\.|Resident Commissioner)\s+([^,]+),\s*([^[]+?)\s*\[([^\]]+)\]$/)
  if (!m) return sponsor.name
  // Non-breaking hyphen keeps "(D-CO)" on one line
  return `${m[1]} ${m[3]} ${m[2]} (${m[4].replace(/-/g, '‑')})`
}

const DATE_FMT = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })

export function formatDate(iso) {
  if (!iso) return null
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso)
  return Number.isNaN(d.getTime()) ? null : DATE_FMT.format(d)
}

export function newestUpdate(bills) {
  let best = null
  for (const b of bills) {
    const d = b.update_date || b.latest_action_date
    if (d && (!best || d > best)) best = d
  }
  return best
}
