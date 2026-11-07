/*
  The trace generator must never mark a wrong answer as correct.

  These tests generate hundreds of questions and check each one against an
  answer worked out independently from the question's own graph and table,
  and against a fresh run of the engine.
*/
import { describe, expect, it } from 'vitest'
import { dijkstra, type CheckEdgeStep, type Graph } from '../../engine'
import { allStrings, textRuleProblems } from '../../test/textRules'
import { checkAnswer } from '../answers'
import { layoutById, LAYOUTS, MAX_WEIGHT, MIN_WEIGHT } from '../layouts'
import type { Question } from '../types'
import { edgeCheckCases, nextVertexCases } from './cases'
import { edgeCheckMistakes, MIN_MISTAKES, nextVertexMistakes } from './misconceptions'
import { FALLBACK_GRAPH, FALLBACK_LAYOUT } from './fallback'
import { fallbackQuestion, generateTraceQuestion, type TraceRequest } from './generator'

const SEEDS = Array.from({ length: 300 }, (_, i) => i * 7919 + 1)

type RequestShape = Omit<TraceRequest, 'seed'>
const SHAPES: RequestShape[] = [
  { skill: 'next-vertex', format: 'multiple-choice', objective: 4 },
  { skill: 'next-vertex', format: 'select-vertex', objective: 5 },
  { skill: 'new-distance', format: 'fill-in', objective: 5 },
  { skill: 'predict-update', format: 'predict', objective: 4 },
]

const generate = (shape: RequestShape, seed: number) => generateTraceQuestion({ ...shape, seed } as TraceRequest)

/**
 * Questions for every seed, generated once and shared by the tests below.
 * Questions from the fixed fallback graph are included, so they get every check too.
 */
const questionsFor = new Map(
  SHAPES.map((shape) => [
    shape,
    [
      ...SEEDS.map((seed) => generate(shape, seed)),
      ...[1, 2, 3, 4, 5].map((seed) => fallbackQuestion({ ...shape, seed } as TraceRequest)),
    ],
  ]),
)
const all = (shape: RequestShape) => questionsFor.get(shape)!

function edgeWeight(graph: Graph, a: string, b: string): number {
  const edge = graph.edges.find((e) => (e.from === a && e.to === b) || (e.from === b && e.to === a))
  if (!edge) throw new Error(`No edge ${a}-${b}`)
  return edge.weight
}

/** The start vertex of the question's layout. */
const startOf = (q: Question) => layoutById(q.view!.layoutId).start

describe('next-vertex questions', () => {
  const both = [...all(SHAPES[0]), ...all(SHAPES[1])]

  it('have the answer an independent check gives: the unvisited vertex with the smallest distance', () => {
    for (const q of both) {
      const { table, visited } = q.view!
      const unvisited = Object.keys(table!).filter((v) => !visited.includes(v))
      const smallest = Math.min(...unvisited.map((v) => table![v].distance))
      const closest = unvisited.filter((v) => table![v].distance === smallest)
      expect(closest, q.id).toEqual([q.correctAnswers[0]])
    }
  })

  it('agree with a fresh run of the engine', () => {
    for (const q of both) {
      const { graph, visited } = q.view!
      const { visitOrder } = dijkstra(graph, startOf(q))
      expect(visitOrder.slice(0, visited.length), q.id).toEqual(visited)
      expect(visitOrder[visited.length], q.id).toBe(q.correctAnswers[0])
    }
  })

  it('never ask about a tie for the smallest distance', () => {
    // Covered by the first test: `closest` has exactly one vertex.
    expect(both.length).toBeGreaterThan(0)
  })

  it('never ask about visiting the start vertex', () => {
    for (const q of both) expect(q.view!.visited.length, q.id).toBeGreaterThanOrEqual(1)
  })
})

describe('multiple-choice next-vertex questions', () => {
  it('offer the answer plus at least two wrong options, each tied to a misconception', () => {
    for (const q of all(SHAPES[0])) {
      const ids = q.options.map((o) => o.id)
      expect(new Set(ids).size, q.id).toBe(ids.length)
      expect(ids, q.id).toContain(q.correctAnswers[0])
      const wrong = ids.filter((id) => !q.correctAnswers.includes(id))
      expect(wrong.length, q.id).toBeGreaterThanOrEqual(2)
      for (const id of wrong) expect(q.wrongAnswers[id]?.misconception, `${q.id} ${id}`).toBeTruthy()
    }
  })
})

describe('select-vertex next-vertex questions', () => {
  it('let the student select only unvisited vertices, with feedback for every wrong one', () => {
    for (const q of all(SHAPES[1])) {
      const { selectable, visited } = q.view!
      for (const v of visited) expect(selectable, q.id).not.toContain(v)
      for (const v of selectable) {
        if (v === q.correctAnswers[0]) continue
        expect(q.wrongAnswers[v]?.feedback, `${q.id} ${v}`).toBeTruthy()
      }
    }
  })

  it('tie at least two wrong vertices to misconceptions', () => {
    for (const q of all(SHAPES[1])) {
      const tied = Object.values(q.wrongAnswers).filter((w) => w.misconception !== null)
      expect(tied.length, q.id).toBeGreaterThanOrEqual(2)
    }
  })
})

describe('new-distance and predict questions', () => {
  const both = [...all(SHAPES[2]), ...all(SHAPES[3])]

  /** min(old, current + weight), worked out from the question's own graph and table. */
  function expectedDistance(q: Question): number {
    const [current, neighbour] = q.view!.checkingEdge!
    const table = q.view!.table!
    return Math.min(table[neighbour].distance, table[current].distance + edgeWeight(q.view!.graph, current, neighbour))
  }

  it('show the current vertex and the edge being checked', () => {
    for (const q of both) {
      expect(q.view!.current, q.id).toBe(q.view!.checkingEdge![0])
      expect(q.view!.visited, q.id).not.toContain(q.view!.current)
    }
  })

  it('agree with a fresh run of the engine', () => {
    for (const q of both) {
      const [current, neighbour] = q.view!.checkingEdge!
      const step = dijkstra(q.view!.graph, startOf(q)).steps.find(
        (s): s is CheckEdgeStep => s.kind === 'check-edge' && s.vertex === current && s.neighbour === neighbour,
      )!
      expect(step.table[neighbour].distance, q.id).toBe(expectedDistance(q))
    }
  })

  it('fill-in: the correct answer is the independently worked-out distance', () => {
    for (const q of all(SHAPES[2])) {
      expect(q.correctAnswers, q.id).toEqual([String(expectedDistance(q))])
      expect(q.fillTarget, q.id).toBe(q.view!.checkingEdge![1])
    }
  })

  it('fill-in: at least two different wrong answers come from the brief\'s misconceptions', () => {
    const counted = ['dist-keep-old', 'dist-edge-only', 'dist-always-update']
    for (const q of all(SHAPES[2])) {
      const tied = Object.values(q.wrongAnswers).filter((w) => counted.includes(w.misconception ?? ''))
      expect(tied.length, q.id).toBeGreaterThanOrEqual(2)
    }
  })

  it('predict: the correct option says the right thing happens', () => {
    for (const q of all(SHAPES[3])) {
      const [, neighbour] = q.view!.checkingEdge!
      const old = q.view!.table![neighbour].distance
      const expected = expectedDistance(q)
      const correct = q.options.find((o) => o.id === q.correctAnswers[0])!
      if (expected === old) {
        expect(correct.id, q.id).toBe('stays')
        expect(correct.label, q.id).toContain('stays at')
      } else {
        expect(correct.id, q.id).toBe(`changes-to-${expected}`)
        expect(correct.label, q.id).toBe(`${neighbour} changes to ${expected}`)
      }
    }
  })

  it('predict: at least two wrong options, each tied to a misconception, none meaning the same as the answer', () => {
    for (const q of all(SHAPES[3])) {
      const wrong = q.options.filter((o) => !q.correctAnswers.includes(o.id))
      expect(wrong.length, q.id).toBeGreaterThanOrEqual(2)
      for (const o of wrong) expect(q.wrongAnswers[o.id]?.misconception, `${q.id} ${o.id}`).toBeTruthy()
      const labels = q.options.map((o) => o.label)
      expect(new Set(labels).size, q.id).toBe(labels.length)
    }
  })

  it('predict: asks about both kinds of step, ones that change and ones that don\'t', () => {
    const outcomes = new Set(all(SHAPES[3]).map((q) => q.correctAnswers[0] === 'stays'))
    expect(outcomes).toEqual(new Set([true, false]))
  })
})

describe('every trace question', () => {
  const everything = SHAPES.flatMap(all)

  it('never lists a correct answer as a wrong answer', () => {
    for (const q of everything) {
      for (const answer of q.correctAnswers) expect(q.wrongAnswers[answer], q.id).toBeUndefined()
    }
  })

  it('is marked correct by checkAnswer only for the correct answer', () => {
    for (const q of everything) {
      for (const answer of q.correctAnswers) expect(checkAnswer(q, answer).status, q.id).toBe('correct')
      for (const [answer, info] of Object.entries(q.wrongAnswers)) {
        const typed = answer === 'Infinity' ? '∞' : answer
        expect(checkAnswer(q, typed), `${q.id} ${answer}`).toMatchObject({
          status: 'wrong',
          misconception: info.misconception,
        })
      }
    }
  })

  it('uses whole-number weights from 1 to 9', () => {
    for (const q of everything) {
      for (const edge of q.view!.graph.edges) {
        expect(Number.isInteger(edge.weight)).toBe(true)
        expect(edge.weight).toBeGreaterThanOrEqual(MIN_WEIGHT)
        expect(edge.weight).toBeLessThanOrEqual(MAX_WEIGHT)
      }
    }
  })

  it('has a full hint ladder with valid sub-steps', () => {
    for (const q of everything) {
      expect(q.hints.nudge, q.id).not.toBe('')
      expect(q.hints.workedExample, q.id).not.toBe('')
      expect(q.hints.subSteps.length, q.id).toBeGreaterThanOrEqual(2)
      for (const sub of q.hints.subSteps) {
        expect(sub.options.length, `${q.id} ${sub.prompt}`).toBeGreaterThanOrEqual(2)
        expect(new Set(sub.options).size, `${q.id} ${sub.prompt}`).toBe(sub.options.length)
        expect(sub.options[sub.correctIndex], `${q.id} ${sub.prompt}`).toBeDefined()
      }
    }
  })

  it('follows the text rules: no em-dashes or en-dashes, and no unfilled values', () => {
    for (const q of everything) {
      expect(textRuleProblems(q), q.id).toEqual([])
      for (const text of allStrings(q)) {
        expect(text, q.id).not.toMatch(/undefined|NaN|\[object/)
        expect(text, q.id).not.toMatch(/\bInfinity\b(?! *$)/) // Infinity only as an answer key, never in a sentence
      }
    }
  })

  it('is marked as not yet reviewed', () => {
    for (const q of everything) expect(q.reviewed).toBe(false)
  })

  it('can draw every vertex: each one has a position at both sizes', () => {
    for (const q of everything) {
      for (const v of q.view!.graph.vertices) {
        expect(q.view!.wide.positions[v], `${q.id} ${v}`).toBeDefined()
        expect(q.view!.narrow.positions[v], `${q.id} ${v}`).toBeDefined()
      }
    }
  })

  it('always starts at A', () => {
    for (const q of everything) expect(dijkstra(q.view!.graph, 'A').visitOrder[0]).toBe('A')
  })

  it('uses every layout across the seeds', () => {
    expect(new Set(everything.map((q) => q.trace!.layoutId))).toEqual(new Set(LAYOUTS.map((l) => l.id)))
  })
})

describe('seeds', () => {
  it('give exactly the same question for the same seed', () => {
    for (const shape of SHAPES) expect(generate(shape, 123)).toEqual(generate(shape, 123))
  })

  it('give different questions for different seeds', () => {
    for (const shape of SHAPES) {
      const distinct = new Set(all(shape).map((q) => JSON.stringify([q.view!.graph.edges, q.lead])))
      expect(distinct.size).toBeGreaterThan(SEEDS.length * 0.9)
    }
  })

  it('can force a layout', () => {
    const q = generateTraceQuestion({ skill: 'new-distance', format: 'fill-in', seed: 5, objective: 5, layoutId: 'kite' })
    expect(q.trace!.layoutId).toBe('kite')
    expect(q.view!.graph.vertices).toEqual(['A', 'B', 'C', 'D', 'E'])
  })
})

describe('requests', () => {
  it('reject a skill asked in a format it does not support', () => {
    expect(() =>
      generateTraceQuestion({ skill: 'new-distance', format: 'multiple-choice', seed: 1, objective: 5 } as unknown as TraceRequest),
    ).toThrow(/can't be asked as/)
  })
})

describe('the fixed fallback graph', () => {
  // If 50 random attempts all fail, the generator uses this graph, so it must
  // have usable steps for every skill (bug B2: the sample graph did not).
  const result = dijkstra(FALLBACK_GRAPH, FALLBACK_LAYOUT.start)

  it('matches the hand-checked run in fallback.ts', () => {
    expect(result.visitOrder).toEqual(['A', 'F', 'D', 'C', 'E', 'B'])
    expect(result.steps.some((s) => s.kind === 'visit' && s.tiedWith.length > 0)).toBe(false)
  })

  it('has usable next-vertex steps', () => {
    const usable = nextVertexCases(result, FALLBACK_GRAPH, FALLBACK_LAYOUT).filter(
      (c) => nextVertexMistakes(c).length >= MIN_MISTAKES,
    )
    expect(usable.length).toBeGreaterThanOrEqual(2)
  })

  it('has usable edge checks that change a distance and ones that do not', () => {
    const usable = edgeCheckCases(result, FALLBACK_GRAPH, FALLBACK_LAYOUT).filter(
      (c) => edgeCheckMistakes(c).length >= MIN_MISTAKES,
    )
    expect(usable.some((c) => c.updated)).toBe(true)
    expect(usable.some((c) => !c.updated)).toBe(true)
  })

  it('has a position for every vertex, and its edges match the ladder shape', () => {
    const ladder = layoutById('ladder')
    const shape = (l: typeof ladder) =>
      l.edges.map(([a, b]) => [l.wide.positions[a], l.wide.positions[b]].map((p) => `${p.x},${p.y}`).sort().join(' ')).sort()
    expect(shape(FALLBACK_LAYOUT)).toEqual(shape(ladder))
  })
})
