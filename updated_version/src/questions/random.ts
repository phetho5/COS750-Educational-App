/*
  A seeded random number generator.

  Math.random() gives different numbers every time, which makes questions
  impossible to reproduce in a test. With a seed, the same seed always gives
  the same sequence of numbers, so the same seed always builds the same question.

  The algorithm is mulberry32: a small, well-known generator that is plenty
  random enough for picking weights and shuffling options (not for security).
*/

export interface Rng {
  /** A number from 0 (inclusive) to 1 (exclusive), like Math.random(). */
  next(): number
  /** A whole number from min to max, both included. */
  int(min: number, max: number): number
  /** One item from a non-empty list. */
  pick<T>(items: readonly T[]): T
  /** A shuffled copy of the list. The original list is not changed. */
  shuffle<T>(items: readonly T[]): T[]
}

export function createRng(seed: number): Rng {
  let state = seed >>> 0 // force a 32-bit unsigned whole number

  function next(): number {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  function int(min: number, max: number): number {
    return min + Math.floor(next() * (max - min + 1))
  }

  function pick<T>(items: readonly T[]): T {
    if (items.length === 0) throw new Error('Cannot pick from an empty list.')
    return items[int(0, items.length - 1)]
  }

  // Fisher-Yates shuffle: every order is equally likely.
  function shuffle<T>(items: readonly T[]): T[] {
    const copy = [...items]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = int(0, i)
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  return { next, int, pick, shuffle }
}

/**
 * A new seed made from a seed and a position, e.g. the seed for question 3 of a check.
 * Different positions give unrelated seeds, so questions in one check don't look alike.
 */
export function deriveSeed(seed: number, index: number): number {
  return createRng((seed ^ Math.imul(index + 1, 0x9e3779b1)) >>> 0).int(0, 0xffffffff)
}

/** A fresh seed for the app to use when it starts a new check. Not used in tests. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 0x100000000)
}
