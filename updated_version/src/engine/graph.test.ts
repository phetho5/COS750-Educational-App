import { describe, expect, it } from 'vitest'
import { compareVertices, neighboursOf } from './graph'
import { SAMPLE_GRAPH } from './sampleGraph'

describe('neighboursOf', () => {
  it('finds neighbours in both directions in an undirected graph, alphabetically', () => {
    expect(neighboursOf(SAMPLE_GRAPH, 'B')).toEqual([
      { vertex: 'A', weight: 4 },
      { vertex: 'D', weight: 1 },
      { vertex: 'F', weight: 5 },
    ])
  })

  it('only follows outgoing edges in a directed graph', () => {
    const directed = { ...SAMPLE_GRAPH, directed: true }
    // Edges touching B: A-B, D-B, B-F. Only B-F starts at B.
    expect(neighboursOf(directed, 'B')).toEqual([{ vertex: 'F', weight: 5 }])
  })

  it('returns nothing for a vertex with no edges', () => {
    expect(neighboursOf({ vertices: ['A'], edges: [], directed: false }, 'A')).toEqual([])
  })
})

describe('compareVertices', () => {
  it('orders vertex names alphabetically', () => {
    expect(['C', 'A', 'B'].sort(compareVertices)).toEqual(['A', 'B', 'C'])
    expect(compareVertices('A', 'A')).toBe(0)
  })
})
