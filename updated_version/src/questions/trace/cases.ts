/*
  Finding the moments in a Dijkstra run that a question can ask about.

  A "case" is one such moment, with everything a question needs: the distance
  table just before the step, what has been visited, and the engine's answer.
*/
import type { DijkstraResult, DistanceTable, Graph, VertexId } from '../../engine'
import { compareVertices } from '../../engine'
import type { GraphLayout } from '../layouts'

/** The moment just before the engine picks its next vertex. */
export interface NextVertexCase {
  readonly kind: 'next-vertex'
  readonly graph: Graph
  /** The layout, with the letters this run uses. */
  readonly layout: GraphLayout
  readonly result: DijkstraResult
  /** Index in result.steps of the visit step this case asks about. */
  readonly stepIndex: number
  /** The distance table just before the visit. */
  readonly table: DistanceTable
  /** Vertices already visited, in order. */
  readonly visited: readonly VertexId[]
  readonly lastVisited: VertexId
  /** Unvisited vertices, alphabetically. */
  readonly unvisited: readonly VertexId[]
  /** The engine's answer: the vertex it visits next. */
  readonly answer: VertexId
}

/** The moment just before the engine checks one edge. */
export interface EdgeCheckCase {
  readonly kind: 'edge-check'
  readonly graph: Graph
  /** The layout, with the letters this run uses. */
  readonly layout: GraphLayout
  readonly result: DijkstraResult
  /** Index in result.steps of the check-edge step this case asks about. */
  readonly stepIndex: number
  /** The distance table just before the check. */
  readonly table: DistanceTable
  /** Vertices visited before the current one, in order. */
  readonly visited: readonly VertexId[]
  readonly current: VertexId
  readonly neighbour: VertexId
  readonly weight: number
  readonly currentDistance: number
  readonly oldDistance: number
  readonly candidate: number
  readonly updated: boolean
  /** The engine's answer: the neighbour's distance after the check. */
  readonly answer: number
}

/** The vertices visited before step `stepIndex`, in order. */
function visitedBefore(result: DijkstraResult, stepIndex: number): VertexId[] {
  return result.steps
    .slice(0, stepIndex)
    .filter((s) => s.kind === 'visit')
    .map((s) => (s.kind === 'visit' ? s.vertex : ''))
}

/**
 * Every visit except the first (visiting the start is not a real choice),
 * skipping visits where two unvisited vertices tied for the smallest distance.
 */
export function nextVertexCases(result: DijkstraResult, graph: Graph, layout: GraphLayout): NextVertexCase[] {
  const cases: NextVertexCase[] = []
  result.steps.forEach((step, stepIndex) => {
    if (step.kind !== 'visit' || step.vertex === result.start || step.tiedWith.length > 0) return

    const table = result.steps[stepIndex - 1].table
    const visited = visitedBefore(result, stepIndex)
    cases.push({
      kind: 'next-vertex',
      graph,
      layout,
      result,
      stepIndex,
      table,
      visited,
      lastVisited: visited[visited.length - 1],
      unvisited: Object.keys(table).filter((v) => !table[v].visited).sort(compareVertices),
      answer: step.vertex,
    })
  })
  return cases
}

/** Every edge check in the run. */
export function edgeCheckCases(result: DijkstraResult, graph: Graph, layout: GraphLayout): EdgeCheckCase[] {
  const cases: EdgeCheckCase[] = []
  result.steps.forEach((step, stepIndex) => {
    if (step.kind !== 'check-edge') return

    const table = result.steps[stepIndex - 1].table
    cases.push({
      kind: 'edge-check',
      graph,
      layout,
      result,
      stepIndex,
      table,
      visited: visitedBefore(result, stepIndex).filter((v) => v !== step.vertex),
      current: step.vertex,
      neighbour: step.neighbour,
      weight: step.weight,
      currentDistance: table[step.vertex].distance,
      oldDistance: step.oldDistance,
      candidate: step.candidate,
      updated: step.updated,
      answer: step.table[step.neighbour].distance,
    })
  })
  return cases
}
