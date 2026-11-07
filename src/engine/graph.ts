/*
  Helpers for reading a graph: checking it is valid and finding neighbours.
*/
import type { Graph, VertexId } from './types'

/** Thrown when a graph can't be used with Dijkstra's algorithm. */
export class GraphError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GraphError'
  }
}

/** Alphabetical order for vertex names. Used everywhere we need a fixed order, including breaking ties. */
export function compareVertices(a: VertexId, b: VertexId): number {
  if (a < b) return -1
  if (a > b) return 1
  return 0
}

/**
 * Throws a GraphError if the graph or start vertex can't be used.
 * Dijkstra's algorithm is only correct when no edge weight is negative.
 */
export function validateGraph(graph: Graph, start: VertexId): void {
  const vertices = new Set(graph.vertices)

  if (vertices.size !== graph.vertices.length) {
    throw new GraphError('Each vertex name must appear only once.')
  }
  if (graph.vertices.some((v) => v === '')) {
    throw new GraphError('A vertex name cannot be empty.')
  }
  if (!vertices.has(start)) {
    throw new GraphError(`The start vertex "${start}" is not in the graph.`)
  }

  for (const edge of graph.edges) {
    const name = `${edge.from}-${edge.to}`
    if (!vertices.has(edge.from) || !vertices.has(edge.to)) {
      throw new GraphError(`Edge ${name} uses a vertex that is not in the graph.`)
    }
    if (!Number.isFinite(edge.weight)) {
      throw new GraphError(`Edge ${name} needs a weight that is a real number.`)
    }
    if (edge.weight < 0) {
      throw new GraphError(
        `Edge ${name} has a negative weight (${edge.weight}). Dijkstra's algorithm needs every weight to be 0 or more.`,
      )
    }
  }
}

export interface Neighbour {
  readonly vertex: VertexId
  readonly weight: number
}

/**
 * The vertices you can travel to directly from `vertex`, in alphabetical order.
 * In a directed graph only edges that start at `vertex` count.
 */
export function neighboursOf(graph: Graph, vertex: VertexId): Neighbour[] {
  const result: Neighbour[] = []
  for (const edge of graph.edges) {
    if (edge.from === vertex) {
      result.push({ vertex: edge.to, weight: edge.weight })
    } else if (!graph.directed && edge.to === vertex) {
      result.push({ vertex: edge.from, weight: edge.weight })
    }
  }
  return result.sort((a, b) => compareVertices(a.vertex, b.vertex))
}
