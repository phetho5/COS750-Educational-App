/*
  Facts about the sample graph, worked out in code, for the computed
  versions in the concept bank. Nothing here is typed in by hand.
*/
import { compareVertices, dijkstra, neighboursOf, SAMPLE_GRAPH, SAMPLE_START, type VertexId } from '../../engine'

export const SAMPLE_RESULT = dijkstra(SAMPLE_GRAPH, SAMPLE_START)
export const SAMPLE_VERTICES = SAMPLE_GRAPH.vertices
export const SAMPLE_DIRECTED = { ...SAMPLE_GRAPH, directed: true }

/** The weight of the edge between a and b in the sample graph, or 0 if there is none (as in the matrix). */
export function weightBetween(a: VertexId, b: VertexId): number {
  const edge = SAMPLE_GRAPH.edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))
  return edge ? edge.weight : 0
}

/** Neighbours in the undirected sample graph, alphabetically. */
export function neighbours(v: VertexId): VertexId[] {
  return neighboursOf(SAMPLE_GRAPH, v).map((n) => n.vertex)
}

/** Vertices with an edge pointing into v, if the sample graph is read as directed. */
export function inNeighbours(v: VertexId): VertexId[] {
  return SAMPLE_GRAPH.edges.filter((e) => e.to === v).map((e) => e.from).sort(compareVertices)
}

/** Vertices you can reach in one step from v, if the sample graph is read as directed. */
export function outNeighbours(v: VertexId): VertexId[] {
  return neighboursOf(SAMPLE_DIRECTED, v).map((n) => n.vertex)
}

/** An edge of the sample graph, written "A-B". */
export interface NamedEdge {
  readonly name: string
  readonly weight: number
}

/**
 * The other edges that touch a or b (not a-b itself), in edge-list order.
 * Used for wrong options: a student who reads the wrong line gets one of these.
 */
export function nearbyEdges(a: VertexId, b: VertexId): NamedEdge[] {
  const touches = (v: VertexId, e: { from: VertexId; to: VertexId }) => e.from === v || e.to === v
  return SAMPLE_GRAPH.edges
    .filter((e) => touches(a, e) || touches(b, e))
    .filter((e) => !(touches(a, e) && touches(b, e)))
    .map((e) => ({ name: `${e.from}-${e.to}`, weight: e.weight }))
}

export function pathCost(path: readonly VertexId[]): number {
  let total = 0
  for (let i = 1; i < path.length; i++) total += weightBetween(path[i - 1], path[i])
  return total
}

/** Every path from `from` to `to` that never repeats a vertex, cheapest first. */
export function simplePaths(from: VertexId, to: VertexId): VertexId[][] {
  const paths: VertexId[][] = []
  const walk = (path: VertexId[]) => {
    const last = path[path.length - 1]
    if (last === to) {
      paths.push(path)
      return
    }
    for (const next of neighbours(last)) if (!path.includes(next)) walk([...path, next])
  }
  walk([from])
  return paths.sort((p, q) => pathCost(p) - pathCost(q) || p.length - q.length)
}

/** "A, D and B" style text for a path is in content/format.ts. This gives "A to D to B". */
export function pathWords(path: readonly VertexId[]): string {
  return path.join(' to ')
}
