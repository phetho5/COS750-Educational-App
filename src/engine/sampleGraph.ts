/*
  The sample graph from CLAUDE.md. Its values were checked by hand.
  DO NOT CHANGE THEM: the lessons, the walkthrough and the tests depend on them.

  Undirected, start vertex A: A-B 4, A-D 2, D-B 1, B-F 5, D-C 8, F-C 3, C-E 2, F-E 6
  Visit order: A, D, B, F, C, E
  Final distances: A 0, B 3, C 10, D 2, E 12, F 8
*/
import type { Graph } from './types'

export const SAMPLE_START = 'A'

export const SAMPLE_GRAPH: Graph = {
  vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
  directed: false,
  edges: [
    { from: 'A', to: 'B', weight: 4 },
    { from: 'A', to: 'D', weight: 2 },
    { from: 'D', to: 'B', weight: 1 },
    { from: 'B', to: 'F', weight: 5 },
    { from: 'D', to: 'C', weight: 8 },
    { from: 'F', to: 'C', weight: 3 },
    { from: 'C', to: 'E', weight: 2 },
    { from: 'F', to: 'E', weight: 6 },
  ],
}
