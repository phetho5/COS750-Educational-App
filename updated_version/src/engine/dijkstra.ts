/*
  Dijkstra's shortest path algorithm, recorded step by step.

  The pseudocode the app shows students:

    for each vertex v:
        dist[v] ← ∞;  prev[v] ← none
    dist[start] ← 0
    while some reachable vertex is unvisited:
        u ← unvisited vertex with smallest dist   (ties: alphabetical)
        mark u as visited
        for each unvisited neighbour v of u:      (in alphabetical order)
            alt ← dist[u] + weight(u, v)
            if alt < dist[v]:
                dist[v] ← alt;  prev[v] ← u
    return dist, prev

  Instead of only returning the final answer, dijkstra() records a step for
  every visit and every edge check, each with a full copy of the distance
  table. The walkthrough plays these steps back, and the question generator
  asks questions about them, so both always agree with the real algorithm.
*/
import { compareVertices, neighboursOf, validateGraph, type Neighbour } from './graph'
import type {
  CheckEdgeStep,
  DijkstraResult,
  DijkstraStep,
  DistanceTable,
  Graph,
  TableRow,
  VertexId,
  VisitStep,
} from './types'

/** The algorithm's working table. Unlike DistanceTable it can be changed. */
type WorkingTable = Record<VertexId, { distance: number; previous: VertexId | null; visited: boolean }>

export function dijkstra(graph: Graph, start: VertexId): DijkstraResult {
  validateGraph(graph, start)

  const table = createTable(graph.vertices, start)
  const steps: DijkstraStep[] = [{ kind: 'start', start, table: snapshot(table) }]
  const visitOrder: VertexId[] = []

  let next = pickNextVertex(table)
  while (next !== null) {
    const { vertex, tiedWith } = next
    table[vertex].visited = true
    visitOrder.push(vertex)

    const toCheck = neighboursOf(graph, vertex).filter((n) => !table[n.vertex].visited)
    steps.push(visitStep(table, vertex, tiedWith, toCheck))
    for (const neighbour of toCheck) {
      steps.push(checkEdge(table, vertex, neighbour))
    }

    next = pickNextVertex(table)
  }

  const unreachable = Object.keys(table)
    .filter((v) => !table[v].visited)
    .sort(compareVertices)
  const finalTable = snapshot(table)
  steps.push({ kind: 'finish', visitOrder: [...visitOrder], unreachable, table: finalTable })

  return { start, steps, visitOrder, unreachable, finalTable }
}

/** Every vertex starts unvisited at Infinity, except the start, which is 0. */
function createTable(vertices: readonly VertexId[], start: VertexId): WorkingTable {
  const table: WorkingTable = {}
  for (const v of vertices) {
    table[v] = { distance: v === start ? 0 : Infinity, previous: null, visited: false }
  }
  return table
}

/** A copy of the table, so later changes don't alter steps already recorded. */
function snapshot(table: WorkingTable): DistanceTable {
  const copy: Record<VertexId, TableRow> = {}
  for (const v of Object.keys(table)) {
    copy[v] = { ...table[v] }
  }
  return copy
}
//Copy each row separately so changes to the working table
//do not affect the distance values recorded in previous steps.
/**
 * The unvisited vertex with the smallest distance, or null if every
 * unvisited vertex is still at Infinity (none can be reached).
 * Ties go to the vertex that comes first alphabetically.
 */
function pickNextVertex(table: WorkingTable): { vertex: VertexId; tiedWith: VertexId[] } | null {
  const candidates = Object.keys(table)
    .filter((v) => !table[v].visited && table[v].distance !== Infinity)
    .sort(compareVertices)
  if (candidates.length === 0) return null

  // Strict < keeps the alphabetically first vertex when distances are equal.
  let best = candidates[0]
  for (const v of candidates) {
    if (table[v].distance < table[best].distance) best = v
  }
  const tiedWith = candidates.filter((v) => v !== best && table[v].distance === table[best].distance)
  return { vertex: best, tiedWith }
}

function visitStep(
  table: WorkingTable,
  vertex: VertexId,
  tiedWith: VertexId[],
  toCheck: Neighbour[],
): VisitStep {
  return {
    kind: 'visit',
    vertex,
    distance: table[vertex].distance,
    tiedWith,
    neighboursToCheck: toCheck.map((n) => n.vertex),
    table: snapshot(table),
  }
}

/** Checks one edge and updates the neighbour if going through `vertex` is shorter. */
function checkEdge(table: WorkingTable, vertex: VertexId, neighbour: Neighbour): CheckEdgeStep {
  const row = table[neighbour.vertex]
  const oldDistance = row.distance
  const candidate = table[vertex].distance + neighbour.weight
  const updated = candidate < oldDistance

  if (updated) {
    row.distance = candidate
    row.previous = vertex
  }

  return {
    kind: 'check-edge',
    vertex,
    neighbour: neighbour.vertex,
    weight: neighbour.weight,
    candidate,
    oldDistance,
    updated,
    table: snapshot(table),
  }
}

/**
 * The shortest path from the start to `target`, found by following "previous"
 * backwards, e.g. ['A', 'D', 'C', 'E']. Returns null if `target` can't be reached.
 */
export function shortestPath(table: DistanceTable, target: VertexId): VertexId[] | null {
  if (!(target in table) || table[target].distance === Infinity) return null

  const path: VertexId[] = []
  let current: VertexId | null = target
  while (current !== null) {
    path.unshift(current)
    current = table[current].previous
  }
  return path
}
