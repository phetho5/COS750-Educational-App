import { describe, expect, it } from 'vitest'
import { createRng, deriveSeed } from './random'

const take = (seed: number, count: number) => {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => rng.next())
}

describe('createRng', () => {
  it('gives the same numbers for the same seed', () => {
    expect(take(42, 10)).toEqual(take(42, 10))
  })

  it('gives different numbers for different seeds', () => {
    expect(take(1, 10)).not.toEqual(take(2, 10))
  })

  it('gives numbers from 0 up to (not including) 1', () => {
    for (const n of take(7, 1000)) {
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })

  it('int() covers the whole range, both ends included, and nothing outside it', () => {
    const rng = createRng(3)
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) seen.add(rng.int(1, 9))
    expect([...seen].sort()).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9])
  })

  it('pick() returns an item from the list', () => {
    const rng = createRng(5)
    for (let i = 0; i < 50; i++) expect(['x', 'y', 'z']).toContain(rng.pick(['x', 'y', 'z']))
  })

  it('pick() refuses an empty list', () => {
    expect(() => createRng(5).pick([])).toThrow()
  })

  it('shuffle() keeps every item and does not change the original', () => {
    const items = [1, 2, 3, 4, 5]
    const shuffled = createRng(9).shuffle(items)
    expect([...shuffled].sort()).toEqual([1, 2, 3, 4, 5])
    expect(items).toEqual([1, 2, 3, 4, 5])
  })

  it('shuffle() produces different orders over different seeds', () => {
    const orders = new Set<string>()
    for (let seed = 0; seed < 50; seed++) orders.add(createRng(seed).shuffle([1, 2, 3]).join(''))
    expect(orders.size).toBe(6) // all 3! orders appear
  })

  it('treats seeds outside the 32-bit range consistently', () => {
    expect(take(2 ** 32 + 5, 3)).toEqual(take(5, 3))
  })
})

describe('deriveSeed', () => {
  it('is the same for the same seed and index', () => {
    expect(deriveSeed(10, 2)).toBe(deriveSeed(10, 2))
  })

  it('differs for different indexes and different seeds', () => {
    const seeds = new Set([0, 1, 2, 3, 4].map((i) => deriveSeed(10, i)))
    expect(seeds.size).toBe(5)
    expect(deriveSeed(10, 0)).not.toBe(deriveSeed(11, 0))
  })
})
