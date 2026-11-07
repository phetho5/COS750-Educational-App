/*
  The sample graph from CLAUDE.md must give exactly the hand-checked results.
  If any of these fail, the engine is wrong, not the sample graph.
*/
import { describe, expect, it } from 'vitest'
import { dijkstra, shortestPath } from './dijkstra'
import { SAMPLE_GRAPH, SAMPLE_START } from './sampleGraph'
import type { CheckEdgeStep, DijkstraStep } from './types'

const result = dijkstra(SAMPLE_GRAPH, SAMPLE_START)

/** The step where `vertex` is being visited and the edge to `neighbour` is checked. */
function findCheck(steps: readonly DijkstraStep[], vertex: string, neighbour: string): CheckEdgeStep {
  const step = steps.find(
    (s): s is CheckEdgeStep => s.kind === 'check-edge' && s.vertex === vertex && s.neighbour === neighbour,
  )
  if (!step) throw new Error(`No check of ${vertex}-${neighbour} while visiting ${vertex}`)
  return step
}

describe('Dijkstra on the sample graph (start A)', () => {
  it('visits A, D, B, F, C, E in that order', () => {
    expect(result.visitOrder).toEqual(['A', 'D', 'B', 'F', 'C', 'E'])
  })

  it('finds the final distances A 0, B 3, C 10, D 2, E 12, F 8', () => {
    const distances = Object.fromEntries(
      Object.entries(result.finalTable).map(([v, row]) => [v, row.distance]),
    )
    expect(distances).toEqual({ A: 0, B: 3, C: 10, D: 2, E: 12, F: 8 })
  })

  it('records the previous vertex on each shortest path', () => {
    const previous = Object.fromEntries(
      Object.entries(result.finalTable).map(([v, row]) => [v, row.previous]),
    )
    expect(previous).toEqual({ A: null, B: 'D', C: 'D', D: 'A', E: 'C', F: 'B' })
  })

  it('updates B from 4 to 3 when D is visited', () => {
    const step = findCheck(result.steps, 'D', 'B')
    expect(step).toMatchObject({ oldDistance: 4, weight: 1, candidate: 3, updated: true })
    expect(step.table.B).toMatchObject({ distance: 3, previous: 'D' })
  })

  it('updates E from 14 to 12 when C is visited', () => {
    const step = findCheck(result.steps, 'C', 'E')
    expect(step).toMatchObject({ oldDistance: 14, weight: 2, candidate: 12, updated: true })
    expect(step.table.E).toMatchObject({ distance: 12, previous: 'C' })
  })

  it("checks F-C as 8 + 3 = 11, which doesn't beat 10, so C isn't updated", () => {
    const step = findCheck(result.steps, 'F', 'C')
    expect(step).toMatchObject({ oldDistance: 10, weight: 3, candidate: 11, updated: false })
    expect(step.table.C).toMatchObject({ distance: 10, previous: 'D' })
  })

  it('reaches every vertex', () => {
    expect(result.unreachable).toEqual([])
  })

  it('checks each of the 8 edges exactly once, in the expected order', () => {
    const checks = result.steps
      .filter((s): s is CheckEdgeStep => s.kind === 'check-edge')
      .map((s) => `${s.vertex}-${s.neighbour}`)
    expect(checks).toEqual(['A-B', 'A-D', 'D-B', 'D-C', 'B-F', 'F-C', 'F-E', 'C-E'])
  })

  it('has 16 steps: start, 6 visits, 8 edge checks, finish', () => {
    expect(result.steps.map((s) => s.kind)).toEqual([
      'start',
      'visit', 'check-edge', 'check-edge', // A: B, D
      'visit', 'check-edge', 'check-edge', // D: B, C
      'visit', 'check-edge', // B: F
      'visit', 'check-edge', 'check-edge', // F: C, E
      'visit', 'check-edge', // C: E
      'visit', // E: no unvisited neighbours
      'finish',
    ])
  })

  it('gives the shortest route to E as A, D, C, E', () => {
    expect(shortestPath(result.finalTable, 'E')).toEqual(['A', 'D', 'C', 'E'])
  })
})
