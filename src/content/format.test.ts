import { describe, expect, it } from 'vitest'
import { edgeName, formatDistance, hasOrHave, listText, spokenDistance } from './format'

describe('formatDistance', () => {
  it('shows Infinity as ∞ and numbers as they are', () => {
    expect(formatDistance(Infinity)).toBe('∞')
    expect(formatDistance(12)).toBe('12')
    expect(formatDistance(0)).toBe('0')
  })
})

describe('spokenDistance', () => {
  it('says "infinity" for screen readers', () => {
    expect(spokenDistance(Infinity)).toBe('infinity')
    expect(spokenDistance(3)).toBe('3')
  })
})

describe('listText', () => {
  it('joins lists the way people write them', () => {
    expect(listText([])).toBe('')
    expect(listText(['A'])).toBe('A')
    expect(listText(['A', 'D'])).toBe('A and D')
    expect(listText(['A', 'D', 'B'])).toBe('A, D and B')
  })
})

describe('edgeName and hasOrHave', () => {
  it('use a plain hyphen and the right verb', () => {
    expect(edgeName('A', 'B')).toBe('A-B')
    expect(hasOrHave(['A'])).toBe('A has')
    expect(hasOrHave(['A', 'D'])).toBe('A and D have')
  })
})
