import { describe, expect, it } from 'vitest'
import { SAMPLE_GRAPH } from '../../engine'
import { routesText } from '../../content/lessons'
import { cheapestRoute, neighboursFeedback, routeCost, routeFeedback, weightBetween } from './lessonLogic'

describe('neighboursFeedback (Module 1, Try)', () => {
  it('accepts exactly the neighbours of A', () => {
    expect(neighboursFeedback(SAMPLE_GRAPH, 'A', ['B', 'D'])).toEqual({ ok: true, text: 'B and D each share an edge with A.' })
  })

  it('names a vertex that is not a neighbour', () => {
    const r = neighboursFeedback(SAMPLE_GRAPH, 'A', ['B', 'C'])
    expect(r.ok).toBe(false)
    expect(r.text).toContain("C isn't joined to A")
  })

  it('says when one is missing, or none is selected', () => {
    expect(neighboursFeedback(SAMPLE_GRAPH, 'A', ['D']).text).toContain('Another vertex shares an edge with A')
    expect(neighboursFeedback(SAMPLE_GRAPH, 'A', []).text).toContain('Select the vertices at the other end')
  })
})

describe('routes (Module 3)', () => {
  it('finds weights both ways in an undirected graph, and null for no edge', () => {
    expect(weightBetween(SAMPLE_GRAPH, 'B', 'A')).toBe(4)
    expect(weightBetween(SAMPLE_GRAPH, 'A', 'C')).toBeNull()
  })

  it('adds up a route, and refuses a route that skips an edge', () => {
    expect(routeCost(SAMPLE_GRAPH, ['A', 'B', 'F', 'E'])).toEqual({ route: ['A', 'B', 'F', 'E'], weights: [4, 5, 6], total: 15 })
    expect(() => routeCost(SAMPLE_GRAPH, ['A', 'C'])).toThrow(/aren't joined/)
  })

  it('picks the cheapest route', () => {
    const costs = routesText.tryRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))
    expect(costs[cheapestRoute(costs)].route).toEqual(['A', 'D', 'B', 'F'])
  })

  it('gives specific feedback for the fewest-edges trap', () => {
    const costs = routesText.tryRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))
    expect(routeFeedback(costs, 1)).toEqual({ ok: true, text: expect.stringContaining('A, D, B, F: 2 + 1 + 5 = 8') })
    const trap = routeFeedback(costs, 0)
    expect(trap.ok).toBe(false)
    expect(trap.text).toContain('fewest edges')
    expect(routeFeedback(costs, 2).text).toContain('Is there a route with a smaller total?')
  })
})
