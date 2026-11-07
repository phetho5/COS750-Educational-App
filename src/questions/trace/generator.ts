/*
  The trace question generator.

  1. Pick a fixed layout, shuffle its letters (the start stays A) and give
     its edges random weights from 1 to 9.
  2. Run the Dijkstra engine on it. The engine's steps are the answers.
  3. Find the steps that make a fair question:
     - no tie for the smallest distance (next-vertex questions), and
     - at least two misconceptions that give a different answer from the
       correct one (CLAUDE.md, question generation).
  4. Pick one of those steps and build the question.
  If no step qualifies, try new letters and weights. Everything uses a seeded
  random number generator, so the same seed always gives the same question.
*/
import { dijkstra, type Graph } from '../../engine'
import { LAYOUTS, layoutById, withRandomWeights, withShuffledLabels, type GraphLayout, type LayoutId } from '../layouts'
import { createRng, type Rng } from '../random'
import type { ObjectiveId, Question } from '../types'
import { edgeCheckCases, nextVertexCases, type EdgeCheckCase, type NextVertexCase } from './cases'
import { buildNewDistanceQuestion, buildPredictQuestion } from './edgeCheckQuestion'
import { edgeCheckMistakes, MIN_MISTAKES, nextVertexMistakes } from './misconceptions'
import { FALLBACK_GRAPH, FALLBACK_LAYOUT } from './fallback'
import { buildNextVertexQuestion } from './nextVertexQuestion'

export type TraceSkill = 'next-vertex' | 'new-distance' | 'predict-update'

/** Which question formats each skill can be asked in. */
export const TRACE_FORMATS = {
  'next-vertex': ['multiple-choice', 'select-vertex'],
  'new-distance': ['fill-in'],
  'predict-update': ['predict'],
} as const

export type TraceRequest =
  | { skill: 'next-vertex'; format: 'multiple-choice' | 'select-vertex'; seed: number; objective: ObjectiveId; layoutId?: LayoutId }
  | { skill: 'new-distance'; format: 'fill-in'; seed: number; objective: ObjectiveId; layoutId?: LayoutId }
  | { skill: 'predict-update'; format: 'predict'; seed: number; objective: ObjectiveId; layoutId?: LayoutId }

/** How many sets of random letters and weights to try before using the fixed fallback graph. */
const MAX_ATTEMPTS = 50

function usableNextVertexCases(graph: Graph, layout: GraphLayout): NextVertexCase[] {
  const result = dijkstra(graph, layout.start)
  return nextVertexCases(result, graph, layout).filter((c) => nextVertexMistakes(c).length >= MIN_MISTAKES)
}

function usableEdgeCheckCases(graph: Graph, layout: GraphLayout): EdgeCheckCase[] {
  const result = dijkstra(graph, layout.start)
  return edgeCheckCases(result, graph, layout).filter((c) => edgeCheckMistakes(c).length >= MIN_MISTAKES)
}

/** Every case in the run (usable or not), for picking a worked example from a different step. */
function allCasesFor(c: NextVertexCase | EdgeCheckCase) {
  return c.kind === 'next-vertex'
    ? nextVertexCases(c.result, c.graph, c.layout)
    : edgeCheckCases(c.result, c.graph, c.layout)
}

function build(request: TraceRequest, c: NextVertexCase | EdgeCheckCase, rng: Rng): Question {
  const { seed, objective } = request
  if (request.skill === 'next-vertex' && c.kind === 'next-vertex') {
    return buildNextVertexQuestion(c, request.format, allCasesFor(c) as NextVertexCase[], rng, seed, objective)
  }
  if (c.kind === 'edge-check') {
    const parts = { c, others: allCasesFor(c) as EdgeCheckCase[], rng, seed, objective }
    if (request.skill === 'new-distance') return buildNewDistanceQuestion(parts)
    if (request.skill === 'predict-update') return buildPredictQuestion(parts)
  }
  throw new Error(`Case ${c.kind} doesn't match skill ${request.skill}.`)
}

function findCases(request: TraceRequest, graph: Graph, layout: GraphLayout): (NextVertexCase | EdgeCheckCase)[] {
  return request.skill === 'next-vertex' ? usableNextVertexCases(graph, layout) : usableEdgeCheckCases(graph, layout)
}

export function generateTraceQuestion(request: TraceRequest): Question {
  const allowed: readonly string[] = TRACE_FORMATS[request.skill]
  if (!allowed.includes(request.format)) {
    throw new Error(`Skill ${request.skill} can't be asked as ${request.format}.`)
  }

  const rng = createRng(request.seed)
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shape = request.layoutId ? layoutById(request.layoutId) : rng.pick(LAYOUTS)
    const layout = withShuffledLabels(shape, rng)
    const graph = withRandomWeights(layout, rng)
    const cases = findCases(request, graph, layout)
    if (cases.length > 0) return build(request, rng.pick(cases), rng)
  }

  // Practically never reached: each attempt works 30% to 57% of the time, so
  // 50 failures in a row is about a 1 in 100 million chance.
  return fallbackQuestion(request, rng)
}

/**
 * A question from the fixed fallback graph, which a test proves has usable
 * steps for every skill. Exported so the tests can check these questions too.
 */
export function fallbackQuestion(request: TraceRequest, rng: Rng = createRng(request.seed)): Question {
  const cases = findCases(request, FALLBACK_GRAPH, FALLBACK_LAYOUT)
  return build(request, rng.pick(cases), rng)
}
