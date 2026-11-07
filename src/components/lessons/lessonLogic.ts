/*
  The small rules behind the lesson activities, kept apart from the
  components so they can be tested. Every answer is worked out from the
  graph, never typed in by hand.
*/
import { neighboursOf, type Graph, type VertexId } from '../../engine'
import { listText } from '../../content/format'
import { neighboursTryText, routesText } from '../../content/lessons'

export interface ActivityFeedback {
  ok: boolean
  text: string
}

/** Module 1, Try: feedback for the vertices selected as neighbours of `target`. */
export function neighboursFeedback(graph: Graph, target: VertexId, selected: readonly VertexId[]): ActivityFeedback {
  const t = neighboursTryText
  const answer = neighboursOf(graph, target).map((n) => n.vertex)
  const extra = selected.filter((v) => !answer.includes(v))
  const missing = answer.filter((v) => !selected.includes(v))
  if (extra.length > 0) return { ok: false, text: t.extra(extra[0], target) }
  if (missing.length === answer.length) return { ok: false, text: t.noneYet(target) }
  if (missing.length > 0) return { ok: false, text: t.missing(target) }
  return { ok: true, text: t.right(target, listText(answer)) }
}

/** The weight of the edge between a and b, or null if they aren't joined. */
export function weightBetween(graph: Graph, a: VertexId, b: VertexId): number | null {
  const edge = graph.edges.find((e) => (e.from === a && e.to === b) || (!graph.directed && e.from === b && e.to === a))
  return edge ? edge.weight : null
}

export interface RouteCost {
  route: readonly VertexId[]
  weights: number[]
  total: number
}

/** The weight of each edge on a route, and the total. Throws if two neighbours on the route aren't joined. */
export function routeCost(graph: Graph, route: readonly VertexId[]): RouteCost {
  const weights = route.slice(1).map((v, i) => {
    const w = weightBetween(graph, route[i], v)
    if (w === null) throw new Error(`Route ${route.join(', ')}: ${route[i]} and ${v} aren't joined by an edge.`)
    return w
  })
  return { route, weights, total: weights.reduce((a, b) => a + b, 0) }
}

/** The index of the cheapest route (the first one if two tie). */
export function cheapestRoute(costs: readonly RouteCost[]): number {
  return costs.reduce((best, c, i) => (c.total < costs[best].total ? i : best), 0)
}

/** Module 3, Try: feedback for the chosen route. */
export function routeFeedback(costs: readonly RouteCost[], chosen: number): ActivityFeedback {
  const t = routesText
  const c = costs[chosen]
  const sum = t.routeCost(c.route, c.weights, c.total)
  if (chosen === cheapestRoute(costs)) return { ok: true, text: t.tryRight(sum) }
  const fewest = Math.min(...costs.map((x) => x.route.length))
  return { ok: false, text: c.route.length === fewest ? t.tryFewest(sum) : t.tryOther(sum) }
}
