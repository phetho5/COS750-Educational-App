import type { DistanceTable, Graph, VertexId } from '../../engine'
import type { GraphLayout } from '../layouts'
import type { GraphView } from '../types'

/** What to draw for a trace question, using the layout's (possibly shuffled) letters. */
export function viewFor(
  layout: GraphLayout,
  graph: Graph,
  parts: {
    table: DistanceTable
    visited: readonly VertexId[]
    current: VertexId | null
    checkingEdge: readonly [VertexId, VertexId] | null
    selectable: readonly VertexId[]
  },
): GraphView {
  return { layoutId: layout.id, wide: layout.wide, narrow: layout.narrow, graph, ...parts }
}
