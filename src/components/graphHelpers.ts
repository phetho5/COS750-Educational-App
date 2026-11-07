/*
  Pure helpers for drawing graphs. Kept out of the component so they can be
  tested on their own.
*/
import type { DistanceTable, VertexId } from '../engine'
import { spokenDistance } from '../content/format'

export type VertexState = 'unvisited' | 'current' | 'visited' | 'selected'
export type EdgePair = readonly [VertexId, VertexId]

/**
 * A key that names an edge. Undirected edges get the same key both ways
 * ("A-B" for A-B and B-A). Directed edges keep their direction.
 */
export function edgeKey(a: VertexId, b: VertexId, directed = false): string {
  if (directed) return `${a}>${b}`
  return a < b ? `${a}-${b}` : `${b}-${a}`
}

/**
 * The edges on the shortest paths found so far: each vertex joined to its
 * previous vertex. These are drawn as thick blue lines.
 */
export function pathEdges(table: DistanceTable | null): EdgePair[] {
  if (!table) return []
  return Object.entries(table).flatMap(([vertex, row]) => (row.previous ? [[row.previous, vertex] as const] : []))
}

/** Vertex states from the visited list and the current vertex. */
export function statesFrom(
  vertices: readonly VertexId[],
  visited: readonly VertexId[],
  current: VertexId | null,
  selected: VertexId | null = null,
): Record<VertexId, VertexState> {
  const states: Record<VertexId, VertexState> = {}
  for (const v of vertices) {
    if (v === current) states[v] = 'current'
    else if (visited.includes(v)) states[v] = 'visited'
    else if (v === selected) states[v] = 'selected'
    else states[v] = 'unvisited'
  }
  return states
}

/** What a screen reader says for a vertex, e.g. "Vertex B, visited, distance 3". */
export function vertexLabel(vertex: VertexId, state: VertexState, distance: number | undefined): string {
  const parts = [`Vertex ${vertex}`, state]
  if (distance !== undefined) parts.push(`distance ${spokenDistance(distance)}`)
  return parts.join(', ')
}
