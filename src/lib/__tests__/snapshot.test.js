import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// The bundled snapshot is what visitors see first, so guard its shape.
const bills = JSON.parse(readFileSync(new URL('../../../public/bills.json', import.meta.url), 'utf8'))
const TOPICS = ['Education', 'Immigration', 'Healthcare', 'Climate', 'Economy', 'Civil Rights', 'Criminal Justice', 'Technology', 'Foreign Policy', 'Other']

describe('public/bills.json', () => {
  it('has 100 unique bills', () => {
    expect(bills).toHaveLength(100)
    expect(new Set(bills.map((b) => b.id)).size).toBe(100)
  })
  it('every bill has the fields the site renders', () => {
    for (const b of bills) {
      expect(b.id).toMatch(/^\d+-[A-Z]+-\d+$/)
      for (const k of ['plain_title', 'plain_summary', 'who_it_affects', 'why_it_matters', 'status_plain_english']) {
        expect(typeof b[k], `${b.id}.${k}`).toBe('string')
      }
      expect(b.key_provisions.length).toBeGreaterThan(0)
      expect(b.topics.every((t) => TOPICS.includes(t))).toBe(true)
      expect(['official_summary', 'bill_text', 'title_only']).toContain(b.source)
    }
  })
})
