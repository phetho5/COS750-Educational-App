/*
  The five modules and the learning objectives (CLAUDE.md, Learning path and
  Learning objectives). Module n teaches objective n.
*/
import type { ModuleId, ObjectiveId } from '../questions'

export interface ModuleInfo {
  readonly id: ModuleId
  readonly title: string
  /** One line under the title on the module map. */
  readonly subtitle: string
}

export const MODULES: readonly ModuleInfo[] = [
  { id: 1, title: 'What is a graph?', subtitle: 'Vertices, edges and weights' },
  { id: 2, title: 'Representing graphs', subtitle: 'Adjacency matrix and adjacency list' },
  { id: 3, title: 'The shortest path problem', subtitle: 'What "shortest" means' },
  { id: 4, title: "Dijkstra's algorithm", subtitle: 'A guided walkthrough' },
  { id: 5, title: 'Your turn', subtitle: "Trace Dijkstra's algorithm yourself" },
]

export const FINAL_CHECK_INFO = {
  title: 'Final check and summary',
  subtitle: '5 questions, then your pre-lecture summary',
}

export function moduleInfo(id: ModuleId): ModuleInfo {
  return MODULES[id - 1]
}

export interface ObjectiveInfo {
  readonly id: ObjectiveId
  /** The full objective, as on the Welcome screen. */
  readonly text: string
  /** A short name for progress bars. */
  readonly short: string
}

export const OBJECTIVES: readonly ObjectiveInfo[] = [
  { id: 1, text: 'Describe a graph using the terms vertex, edge, weight, directed and undirected.', short: 'Describe a graph' },
  { id: 2, text: 'Represent a small graph as an adjacency matrix and an adjacency list.', short: 'Matrix and list' },
  { id: 3, text: 'Explain what the shortest path problem is.', short: 'Shortest path problem' },
  { id: 4, text: "Explain step by step how Dijkstra's algorithm finds shortest paths.", short: 'How Dijkstra works' },
  { id: 5, text: "Trace Dijkstra's algorithm on a small weighted graph.", short: 'Trace Dijkstra' },
]

export function objectiveInfo(id: ObjectiveId): ObjectiveInfo {
  return OBJECTIVES[id - 1]
}
