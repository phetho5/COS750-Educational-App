/*
  Types for the Dijkstra engine. The engine is plain TypeScript with no React,
  so the walkthrough screen, the question generator and the tests can all use it.
*/

/** A vertex is named by a short string, such as "A". */
export type VertexId = string

/** An edge between two vertices. In an undirected graph it works both ways. */
export interface Edge {
  readonly from: VertexId
  readonly to: VertexId
  readonly weight: number
}

export interface Graph {
  readonly vertices: readonly VertexId[]
  readonly edges: readonly Edge[]
  readonly directed: boolean
}

/** One row of the distance table: what the algorithm knows about one vertex. */
export interface TableRow {
  /** Shortest distance found so far from the start. Infinity means "not reached yet". */
  readonly distance: number
  /** The vertex we came from on that shortest path, or null if there isn't one yet. */
  readonly previous: VertexId | null
  /** True once the vertex has been visited. Its distance is then final. */
  readonly visited: boolean
}

/** The full distance table, looked up by vertex: table['B'].distance */
export type DistanceTable = Readonly<Record<VertexId, TableRow>>

/** Step 1: every distance is set up. The start is 0, the rest are Infinity. */
export interface StartStep {
  readonly kind: 'start'
  readonly start: VertexId
  readonly table: DistanceTable
}

/** The algorithm picks the unvisited vertex with the smallest distance and visits it. */
export interface VisitStep {
  readonly kind: 'visit'
  readonly vertex: VertexId
  /** The visited vertex's distance, which is now final. */
  readonly distance: number
  /** Other unvisited vertices with exactly the same distance (the tie was broken alphabetically). */
  readonly tiedWith: readonly VertexId[]
  /** The unvisited neighbours that will be checked next, in the order they are checked. */
  readonly neighboursToCheck: readonly VertexId[]
  readonly table: DistanceTable
}

/** The algorithm checks one edge from the current vertex to an unvisited neighbour. */
export interface CheckEdgeStep {
  readonly kind: 'check-edge'
  /** The vertex being visited. */
  readonly vertex: VertexId
  /** The neighbour at the other end of the edge. */
  readonly neighbour: VertexId
  readonly weight: number
  /** The distance through the current vertex: distance(vertex) + weight. */
  readonly candidate: number
  /** The neighbour's distance before this check. */
  readonly oldDistance: number
  /** True if candidate < oldDistance, so the neighbour's distance and previous changed. */
  readonly updated: boolean
  readonly table: DistanceTable
}

/** No unvisited vertex can be reached any more, so the algorithm stops. */
export interface FinishStep {
  readonly kind: 'finish'
  readonly visitOrder: readonly VertexId[]
  /** Vertices with no path from the start. They stay at Infinity and are never visited. */
  readonly unreachable: readonly VertexId[]
  readonly table: DistanceTable
}

export type DijkstraStep = StartStep | VisitStep | CheckEdgeStep | FinishStep

export interface DijkstraResult {
  readonly start: VertexId
  /** Every step in order, each with a full copy of the distance table at that moment. */
  readonly steps: readonly DijkstraStep[]
  readonly visitOrder: readonly VertexId[]
  readonly unreachable: readonly VertexId[]
  readonly finalTable: DistanceTable
}
