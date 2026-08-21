import { describe, expect, it } from 'vitest'
import { autoSegment, parseJsonImport } from '#/lib/import'

describe('import autoSegment', () => {
  it('splits headers into topics', () => {
    const r = autoSegment('# Anatomy\nWhat is X :: Y\n\n# Pharm\nQ: What?\\nA: Because')
    expect(r.cards.some((c) => c.topic === 'Anatomy')).toBe(true)
    expect(r.cards.some((c) => c.topic === 'Pharm')).toBe(true)
  })

  it('parses Q/A pairs', () => {
    const r = autoSegment('Q: What is acetylcholine?\nA: A neurotransmitter\n\nQ: What is dopamine?\nA: Another')
    expect(r.cards.length).toBe(2)
    expect(r.cards[0]!.front).toContain('acetylcholine')
  })

  it('splits bullets', () => {
    const r = autoSegment('- Alpha\n- Beta\n- Gamma')
    expect(r.cards.length).toBe(3)
  })

  it('parses JSON import', () => {
    const json = JSON.stringify({ cards: [{ front: 'F', back: 'B', topic: 'T' }] })
    const r = parseJsonImport(json)
    expect(r.cards[0]!.front).toBe('F')
  })

  it('handles empty', () => {
    const r = autoSegment('   ')
    expect(r.cards.length).toBe(0)
    expect(r.warnings.length).toBeGreaterThan(0)
  })
})
