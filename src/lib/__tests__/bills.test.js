import { describe, expect, it } from 'vitest'
import { billFacts, clean, coverFor, formatDate, newestUpdate, primaryTopic, sponsorName, stageOf } from '../bills'

describe('billFacts', () => {
  it('formats House and Senate bill numbers and links to Congress.gov', () => {
    expect(billFacts({ id: '119-HR-5744' })).toMatchObject({
      label: 'H.R. 5744',
      chamber: 'House',
      url: 'https://www.congress.gov/bill/119th-congress/house-bill/5744',
    })
    expect(billFacts({ id: '119-SRES-542' })).toMatchObject({ label: 'S.Res. 542', chamber: 'Senate', kind: 'Resolution' })
  })
})

describe('stageOf', () => {
  const at = (s) => stageOf({ status_plain_english: s })
  it('reads the stage from the plain-English status', () => {
    expect(at('This bill was just introduced.')).toBe(0)
    expect(at('It was sent to the Judiciary Committee for review.')).toBe(1)
    expect(at("It was added to the Senate's waiting list of legislation.")).toBe(2)
    expect(at('This bill passed the House and now goes to the Senate.')).toBe(3)
    expect(at('It was signed into law by the President.')).toBe(4)
  })
})

describe('text helpers', () => {
  it('replaces long dashes from model output', () => {
    expect(clean('Foreign Affairs \u2014 and Armed Services')).toBe('Foreign Affairs - and Armed Services')
  })
  it('turns Congress.gov sponsor names into reading order', () => {
    expect(sponsorName({ name: 'Sen. Bennet, Michael F. [D-CO]' })).toBe('Sen. Michael F. Bennet (D\u2011CO)')
    expect(sponsorName(null)).toBeNull()
  })
  it('formats dates without timezone drift', () => {
    expect(formatDate('2026-09-24')).toBe('Sep 24, 2026')
    expect(formatDate(undefined)).toBeNull()
  })
  it('finds the newest update across bills', () => {
    expect(newestUpdate([{ update_date: '2026-10-01' }, { latest_action_date: '2026-10-20' }])).toBe('2026-10-20')
  })
})

describe('topics and covers', () => {
  it('prefers a specific topic over "Other"', () => {
    expect(primaryTopic({ topics: ['Other', 'Healthcare'] })).toBe('Healthcare')
    expect(coverFor({ topics: ['Civil Rights'] })).toBe('/covers/civil-rights.webp')
    expect(coverFor({ topics: [] })).toBe('/covers/other.webp')
  })
})
