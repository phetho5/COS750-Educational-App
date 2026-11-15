import { describe, expect, it } from 'vitest'
import { dijkstra, shortestPath } from './dijkstra'
import { GraphError } from './graph'
import { SAMPLE_GRAPH } from './sampleGraph'
import type { CheckEdgeStep, Graph, VisitStep } from './types'

/** Builds a graph from strings like "A-B 4". */
function graphOf(vertices: string[], edges: string[], directed = false): Graph {
  return {
    vertices,
    directed,
    edges: edges.map((text) => {
      const [pair, weight] = text.split(' ')
      const [from, to] = pair.split('-')
      return { from, to, weight: Number(weight) }
    }),
  }
}

const visits = (steps: readonly unknown[]) =>
  (steps as { kind: string }[]).filter((s): s is VisitStep => s.kind === 'visit')
const checks = (steps: readonly unknown[]) =>
  (steps as { kind: string }[]).filter((s): s is CheckEdgeStep => s.kind === 'check-edge')

describe('the start step', () => {
  it('sets the start to 0 and every other vertex to Infinity, none visited', () => {
    const [first] = dijkstra(SAMPLE_GRAPH, 'A').steps
    expect(first.kind).toBe('start')
    expect(first.table.A).toEqual({ distance: 0, previous: null, visited: false })
    for (const v of ['B', 'C', 'D', 'E', 'F']) {
      expect(first.table[v]).toEqual({ distance: Infinity, previous: null, visited: false })
    }
  })

  it('works from a start other than A', () => {
    const result = dijkstra(SAMPLE_GRAPH, 'E')
    expect(result.visitOrder[0]).toBe('E')
    expect(result.finalTable.E.distance).toBe(0)
    expect(result.finalTable.A.distance).toBe(12) // same path, other direction
  })
})

describe('visit steps', () => {
  it('mark the vertex as visited and record its final distance', () => {
    const visitD = visits(dijkstra(SAMPLE_GRAPH, 'A').steps).find((s) => s.vertex === 'D')!
    expect(visitD.distance).toBe(2)
    expect(visitD.table.D.visited).toBe(true)
    expect(visitD.neighboursToCheck).toEqual(['B', 'C']) // A is already visited
  })

  it('list no neighbours when all of them are already visited', () => {
    const visitE = visits(dijkstra(SAMPLE_GRAPH, 'A').steps).find((s) => s.vertex === 'E')!
    expect(visitE.neighboursToCheck).toEqual([])
  })
})

describe('ties', () => {
  const tied = graphOf(['A', 'B', 'C', 'D'], ['A-C 1', 'A-B 1', 'B-D 5', 'C-D 1'])

  it('are broken alphabetically', () => {
    expect(dijkstra(tied, 'A').visitOrder).toEqual(['A', 'B', 'C', 'D'])
  })

  it('are recorded on the visit step', () => {
    const [, visitB] = visits(dijkstra(tied, 'A').steps)
    expect(visitB.vertex).toBe('B')
    expect(visitB.tiedWith).toEqual(['C'])
  })

  it('are not recorded when there is no tie', () => {
    for (const step of visits(dijkstra(SAMPLE_GRAPH, 'A').steps)) {
      expect(step.tiedWith).toEqual([])
    }
  })

  it('do not depend on the order vertices are listed in', () => {
    const shuffled = { ...tied, vertices: ['D', 'C', 'B', 'A'] }
    expect(dijkstra(shuffled, 'A').visitOrder).toEqual(['A', 'B', 'C', 'D'])
  })
})

describe('edge checks', () => {
  it('happen in alphabetical order of the neighbour', () => {
    const graph = graphOf(['A', 'B', 'C', 'D'], ['A-D 1', 'A-B 1', 'A-C 1'])
    const fromA = checks(dijkstra(graph, 'A').steps).filter((s) => s.vertex === 'A')
    expect(fromA.map((s) => s.neighbour)).toEqual(['B', 'C', 'D'])
  })

  it('do not update when the new path is equal, only when it is shorter', () => {
    // B is 2 directly, and also 1 + 1 = 2 through C.
    const graph = graphOf(['A', 'B', 'C'], ['A-B 2', 'A-C 1', 'C-B 1'])
    const step = checks(dijkstra(graph, 'A').steps).find((s) => s.vertex === 'C' && s.neighbour === 'B')!
    expect(step).toMatchObject({ candidate: 2, oldDistance: 2, updated: false })
    expect(step.table.B.previous).toBe('A')
  })

  it('treat a first reach from Infinity as an update', () => {
    const [first] = checks(dijkstra(SAMPLE_GRAPH, 'A').steps)
    expect(first).toMatchObject({ vertex: 'A', neighbour: 'B', oldDistance: Infinity, candidate: 4, updated: true })
  })
})

describe('distance table copies', () => {
  it('are separate for each step, so later changes do not alter earlier steps', () => {
    const { steps } = dijkstra(SAMPLE_GRAPH, 'A')
    const afterAB = checks(steps)[0]
    expect(afterAB.table.B.distance).toBe(4) // later changed to 3, but this copy keeps 4
    expect(steps[0].table.B.distance).toBe(Infinity)
  })

  it('are a full table at every step', () => {
    for (const step of dijkstra(SAMPLE_GRAPH, 'A').steps) {
      expect(Object.keys(step.table).sort()).toEqual(['A', 'B', 'C', 'D', 'E', 'F'])
    }
  })
})

describe('directed graphs', () => {
  it('only follow edges in their direction', () => {
    const graph = graphOf(['A', 'B', 'C'], ['A-B 1', 'C-B 1'], true)
    const result = dijkstra(graph, 'A')
    expect(result.visitOrder).toEqual(['A', 'B'])
    expect(result.unreachable).toEqual(['C']) // C-B points into B, not out of it
  })
})

describe('unreachable vertices', () => {
  const graph = graphOf(['A', 'B', 'C', 'D'], ['A-B 3', 'C-D 1'])
  const result = dijkstra(graph, 'A')

  it('stay at Infinity and are never visited', () => {
    expect(result.finalTable.C).toEqual({ distance: Infinity, previous: null, visited: false })
    expect(result.visitOrder).toEqual(['A', 'B'])
  })

  it('are listed in the result and on the finish step', () => {
    expect(result.unreachable).toEqual(['C', 'D'])
    const finish = result.steps[result.steps.length - 1]
    expect(finish).toMatchObject({ kind: 'finish', unreachable: ['C', 'D'], visitOrder: ['A', 'B'] })
  })

  it('have no shortest path', () => {
    expect(shortestPath(result.finalTable, 'C')).toBeNull()
  })
})

describe('other graphs', () => {
  it('handle a single vertex with no edges', () => {
    const result = dijkstra(graphOf(['A'], []), 'A')
    expect(result.visitOrder).toEqual(['A'])
    expect(result.steps.map((s) => s.kind)).toEqual(['start', 'visit', 'finish'])
  })

  it('allow edges with weight 0', () => {
    const result = dijkstra(graphOf(['A', 'B'], ['A-B 0']), 'A')
    expect(result.finalTable.B.distance).toBe(0)
  })

  it('do not change the graph passed in', () => {
    const graph = graphOf(['A', 'B'], ['A-B 4'])
    const before = JSON.stringify(graph)
    dijkstra(graph, 'A')
    expect(JSON.stringify(graph)).toBe(before)
  })
})

describe('invalid graphs', () => {
  it('reject a negative edge weight', () => {
    const graph = graphOf(['A', 'B'], ['A-B -1'])
    expect(() => dijkstra(graph, 'A')).toThrow(GraphError)
    expect(() => dijkstra(graph, 'A')).toThrow(/negative weight/)
  })

  it('reject a start vertex that is not in the graph', () => {
    expect(() => dijkstra(SAMPLE_GRAPH, 'Z')).toThrow(/start vertex "Z"/)
  })

  it('reject an edge to a vertex that is not in the graph', () => {
    expect(() => dijkstra(graphOf(['A'], ['A-B 1']), 'A')).toThrow(/not in the graph/)
  })

  it('reject a weight that is not a real number', () => {
    expect(() => dijkstra(graphOf(['A', 'B'], ['A-B NaN']), 'A')).toThrow(/real number/)
    expect(() => dijkstra(graphOf(['A', 'B'], ['A-B Infinity']), 'A')).toThrow(/real number/)
  })

  it('reject a vertex listed twice', () => {
    expect(() => dijkstra(graphOf(['A', 'A'], []), 'A')).toThrow(/only once/)
  })

  it('reject an empty vertex name', () => {
    expect(() => dijkstra(graphOf(['A', ''], []), 'A')).toThrow(/cannot be empty/)
  })
})

describe('shortestPath', () => {
  const { finalTable } = dijkstra(SAMPLE_GRAPH, 'A')

  it('is just the start for the start vertex', () => {
    expect(shortestPath(finalTable, 'A')).toEqual(['A'])
  })

  it('follows previous vertices back to the start', () => {
    expect(shortestPath(finalTable, 'F')).toEqual(['A', 'D', 'B', 'F'])
  })

  it('is null for a vertex not in the table', () => {
    expect(shortestPath(finalTable, 'Z')).toBeNull()
  })
})
