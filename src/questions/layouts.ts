/*
  Fixed graph layouts for trace questions.

  A layout is a graph's shape: which vertices there are, where they are drawn
  and which pairs are joined by edges. It has no weights. Each trace question
  takes a layout and gives its edges random weights, so the drawing always
  looks good but the numbers change.

  Positions are in SVG units. "wide" is for laptops, "narrow" for phones
  (the design switches below 720px). No two edges cross in any layout.
*/
import type { Graph, VertexId } from '../engine'
import { compareVertices, SAMPLE_GRAPH } from '../engine'
import type { Rng } from './random'

export type LayoutId = 'sample' | 'kite' | 'ladder'

export interface Point {
  readonly x: number
  readonly y: number
}

export interface LayoutSize {
  readonly viewBox: string
  readonly positions: Readonly<Record<VertexId, Point>>
}

export interface GraphLayout {
  readonly id: LayoutId
  readonly start: VertexId
  readonly vertices: readonly VertexId[]
  /** Pairs of vertices joined by an edge. */
  readonly edges: readonly (readonly [VertexId, VertexId])[]
  readonly wide: LayoutSize
  readonly narrow: LayoutSize
}

const WIDE_VIEWBOX = '0 0 610 410'
const NARROW_VIEWBOX = '0 0 400 410'

/** The sample graph's shape, with the positions from the design. */
const SAMPLE_LAYOUT: GraphLayout = {
  id: 'sample',
  start: 'A',
  vertices: SAMPLE_GRAPH.vertices,
  edges: SAMPLE_GRAPH.edges.map((e) => [e.from, e.to] as const),
  wide: {
    viewBox: WIDE_VIEWBOX,
    positions: {
      A: { x: 70, y: 210 },
      B: { x: 230, y: 90 },
      C: { x: 400, y: 330 },
      D: { x: 230, y: 330 },
      E: { x: 540, y: 210 },
      F: { x: 400, y: 90 },
    },
  },
  narrow: {
    viewBox: NARROW_VIEWBOX,
    positions: {
      A: { x: 40, y: 210 },
      B: { x: 140, y: 95 },
      C: { x: 260, y: 325 },
      D: { x: 140, y: 325 },
      E: { x: 360, y: 210 },
      F: { x: 260, y: 95 },
    },
  },
}

/*
  Kite: 5 vertices, 7 edges.

        B ------- D
      / |       / \
    A   |     /     E
      \ |   /     /
        C -------
*/
const KITE_LAYOUT: GraphLayout = {
  id: 'kite',
  start: 'A',
  vertices: ['A', 'B', 'C', 'D', 'E'],
  edges: [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['C', 'E'],
    ['D', 'E'],
  ],
  wide: {
    viewBox: WIDE_VIEWBOX,
    positions: {
      A: { x: 70, y: 210 },
      B: { x: 250, y: 90 },
      C: { x: 250, y: 330 },
      D: { x: 450, y: 90 },
      E: { x: 540, y: 210 },
    },
  },
  narrow: {
    viewBox: NARROW_VIEWBOX,
    positions: {
      A: { x: 40, y: 210 },
      B: { x: 163, y: 95 },
      C: { x: 163, y: 325 },
      D: { x: 299, y: 95 },
      E: { x: 360, y: 210 },
    },
  },
}

/*
  Ladder: 6 vertices, 9 edges.

    A ----- C ----- E
    |     / |     / |
    |   /   |   /   |
    B ----- D ----- F
*/
const LADDER_LAYOUT: GraphLayout = {
  id: 'ladder',
  start: 'A',
  vertices: ['A', 'B', 'C', 'D', 'E', 'F'],
  edges: [
    ['A', 'B'],
    ['A', 'C'],
    ['B', 'C'],
    ['B', 'D'],
    ['C', 'D'],
    ['C', 'E'],
    ['D', 'E'],
    ['D', 'F'],
    ['E', 'F'],
  ],
  wide: {
    viewBox: WIDE_VIEWBOX,
    positions: {
      A: { x: 70, y: 90 },
      B: { x: 70, y: 330 },
      C: { x: 305, y: 90 },
      D: { x: 305, y: 330 },
      E: { x: 540, y: 90 },
      F: { x: 540, y: 330 },
    },
  },
  narrow: {
    viewBox: NARROW_VIEWBOX,
    positions: {
      A: { x: 40, y: 95 },
      B: { x: 40, y: 325 },
      C: { x: 200, y: 95 },
      D: { x: 200, y: 325 },
      E: { x: 360, y: 95 },
      F: { x: 360, y: 325 },
    },
  },
}

export const LAYOUTS: readonly GraphLayout[] = [SAMPLE_LAYOUT, KITE_LAYOUT, LADDER_LAYOUT]

export function layoutById(id: LayoutId): GraphLayout {
  const layout = LAYOUTS.find((l) => l.id === id)
  if (!layout) throw new Error(`Unknown layout "${id}".`)
  return layout
}

/**
 * The same layout with its letters shuffled. The start keeps its letter (A),
 * the shape and positions stay fixed, and the other letters move around.
 *
 * Why: in the fixed layouts the letters run outwards from A, and the engine
 * checks neighbours alphabetically, so "alphabetical order" and "the order
 * vertices were first reached" almost always picked the same wrong vertex.
 * Then hardly any next-vertex step had the two different wrong answers the
 * brief requires (docs/handoff.md, bug B2). Shuffling the letters separates them.
 */
export function withShuffledLabels(layout: GraphLayout, rng: Rng): GraphLayout {
  const others = layout.vertices.filter((v) => v !== layout.start)
  const shuffled = rng.shuffle(others)
  const newName = new Map<VertexId, VertexId>([[layout.start, layout.start]])
  others.forEach((v, i) => newName.set(v, shuffled[i]))
  const rename = (v: VertexId) => newName.get(v)!

  const renameSize = (size: LayoutSize): LayoutSize => ({
    viewBox: size.viewBox,
    positions: Object.fromEntries(Object.entries(size.positions).map(([v, point]) => [rename(v), point])),
  })

  return {
    ...layout,
    vertices: layout.vertices.map(rename).sort(compareVertices),
    edges: layout.edges.map(([a, b]) => [rename(a), rename(b)] as const),
    wide: renameSize(layout.wide),
    narrow: renameSize(layout.narrow),
  }
}

/** Random whole-number weights from 1 to 9, one per edge, as the brief asks. */
export const MIN_WEIGHT = 1
export const MAX_WEIGHT = 9

/** The layout's shape as an undirected graph with a random weight on each edge. */
export function withRandomWeights(layout: GraphLayout, rng: Rng): Graph {
  return {
    vertices: layout.vertices,
    directed: false,
    edges: layout.edges.map(([from, to]) => ({ from, to, weight: rng.int(MIN_WEIGHT, MAX_WEIGHT) })),
  }
}
