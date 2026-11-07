import { describe, expect, it } from 'vitest'
import { dijkstra, SAMPLE_GRAPH } from '../engine'
import { LAYOUTS, layoutById, MAX_WEIGHT, MIN_WEIGHT, withRandomWeights, withShuffledLabels, type Point } from './layouts'
import { createRng } from './random'

/** True if the segments p1-p2 and p3-p4 cross at a point inside both (not at a shared end). */
function segmentsCross(p1: Point, p2: Point, p3: Point, p4: Point): boolean {
  const cross = (a: Point, b: Point, c: Point) => (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x)
  const d1 = cross(p3, p4, p1)
  const d2 = cross(p3, p4, p2)
  const d3 = cross(p1, p2, p3)
  const d4 = cross(p1, p2, p4)
  return d1 * d2 < 0 && d3 * d4 < 0
}

describe('segmentsCross (the test helper itself)', () => {
  it('detects an X and ignores edges that only share an end', () => {
    expect(segmentsCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 }, { x: 10, y: 0 })).toBe(true)
    expect(segmentsCross({ x: 0, y: 0 }, { x: 10, y: 10 }, { x: 10, y: 10 }, { x: 20, y: 0 })).toBe(false)
  })
})

describe.each(LAYOUTS.map((l) => [l.id, l] as const))('layout "%s"', (_id, layout) => {
  it('has 5 or 6 vertices, as the brief asks', () => {
    expect(layout.vertices.length).toBeGreaterThanOrEqual(5)
    expect(layout.vertices.length).toBeLessThanOrEqual(6)
  })

  it('has a position for every vertex at both sizes', () => {
    for (const size of [layout.wide, layout.narrow]) {
      expect(Object.keys(size.positions).sort()).toEqual([...layout.vertices].sort())
    }
  })

  it('only joins vertices that exist, and never the same pair twice', () => {
    const pairs = layout.edges.map(([a, b]) => [a, b].sort().join('-'))
    expect(new Set(pairs).size).toBe(pairs.length)
    for (const [a, b] of layout.edges) {
      expect(layout.vertices).toContain(a)
      expect(layout.vertices).toContain(b)
      expect(a).not.toBe(b)
    }
  })

  it('has no crossing edges at either size', () => {
    for (const { positions } of [layout.wide, layout.narrow]) {
      for (let i = 0; i < layout.edges.length; i++) {
        for (let j = i + 1; j < layout.edges.length; j++) {
          const [a, b] = layout.edges[i]
          const [c, d] = layout.edges[j]
          const crossed = segmentsCross(positions[a], positions[b], positions[c], positions[d])
          expect(crossed, `${a}-${b} crosses ${c}-${d}`).toBe(false)
        }
      }
    }
  })

  it('reaches every vertex from the start, whatever the weights', () => {
    const graph = withRandomWeights(layout, createRng(1))
    expect(dijkstra(graph, layout.start).unreachable).toEqual([])
  })
})

describe('withRandomWeights', () => {
  it('gives every edge a whole-number weight from 1 to 9', () => {
    const rng = createRng(11)
    for (let i = 0; i < 200; i++) {
      for (const edge of withRandomWeights(layoutById('ladder'), rng).edges) {
        expect(Number.isInteger(edge.weight)).toBe(true)
        expect(edge.weight).toBeGreaterThanOrEqual(MIN_WEIGHT)
        expect(edge.weight).toBeLessThanOrEqual(MAX_WEIGHT)
      }
    }
  })

  it('gives the same weights for the same seed', () => {
    const a = withRandomWeights(layoutById('kite'), createRng(4))
    const b = withRandomWeights(layoutById('kite'), createRng(4))
    expect(a).toEqual(b)
  })
})

describe('withShuffledLabels', () => {
  /** Each edge as the two points it joins, so the drawn shape can be compared. */
  const drawnShape = (layout: (typeof LAYOUTS)[number]) =>
    layout.edges
      .map(([a, b]) => [a, b].map((v) => `${layout.wide.positions[v].x},${layout.wide.positions[v].y}`).sort().join(' '))
      .sort()

  it.each(LAYOUTS.map((l) => [l.id, l] as const))('keeps the "%s" shape, positions and start, only moving letters', (_id, layout) => {
    for (let seed = 0; seed < 30; seed++) {
      const shuffled = withShuffledLabels(layout, createRng(seed))
      expect(shuffled.start).toBe('A')
      expect(shuffled.wide.positions.A).toEqual(layout.wide.positions[layout.start])
      expect([...shuffled.vertices]).toEqual([...layout.vertices].sort())
      expect(drawnShape(shuffled)).toEqual(drawnShape(layout))
    }
  })

  it('gives different letter arrangements for different seeds', () => {
    const arrangements = new Set<string>()
    for (let seed = 0; seed < 30; seed++) {
      arrangements.add(JSON.stringify(withShuffledLabels(layoutById('sample'), createRng(seed)).wide.positions))
    }
    expect(arrangements.size).toBeGreaterThan(10)
  })
})

describe('the sample layout', () => {
  it('has exactly the sample graph shape', () => {
    const pairs = (edges: readonly (readonly [string, string])[]) => edges.map(([a, b]) => `${a}-${b}`)
    expect(pairs(layoutById('sample').edges)).toEqual(pairs(SAMPLE_GRAPH.edges.map((e) => [e.from, e.to])))
  })
})

describe('layoutById', () => {
  it('rejects an unknown layout', () => {
    // @ts-expect-error testing a bad id on purpose
    expect(() => layoutById('nope')).toThrow(/Unknown layout/)
  })
})
