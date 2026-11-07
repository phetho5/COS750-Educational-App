import { describe, expect, it } from 'vitest'
import { SAMPLE_GRAPH, type Graph } from '../engine'
import { textRuleProblems } from '../test/textRules'
import {
  currentVertex,
  neighboursToUpdate,
  pickVertex,
  startYourTurn,
  submitDistances,
  visitedSoFar,
  type YourTurnState,
} from './yourTurn'

const start = () => startYourTurn(SAMPLE_GRAPH, 'A')

/** Picks the right vertex, then types the engine's distances for its neighbours. */
function doRight(state: YourTurnState): YourTurnState {
  const vertex = state.result.visitOrder[state.done]
  let s = pickVertex(state, vertex).state
  if (s.phase === 'update') {
    const typed: Record<string, string> = {}
    // The right answers here are from the sample graph in CLAUDE.md, checked by hand.
    for (const v of neighboursToUpdate(s)) typed[v] = String(SAMPLE_FINAL_STEPWISE[vertex][v])
    s = submitDistances(s, typed).state
  }
  return s
}

// What each neighbour's distance is after its vertex is visited (sample graph, hand-checked).
const SAMPLE_FINAL_STEPWISE: Record<string, Record<string, number>> = {
  B: { F: 8 }, // 3 + 5
  F: { C: 10, E: 14 }, // C stays 10 (8 + 3 = 11 isn't smaller); E is 8 + 6
  C: { E: 12 }, // 10 + 2 beats 14
}

describe('Your turn on the sample graph', () => {
  it('starts with A and D visited and B, C at 3 and 10', () => {
    const s = start()
    expect(visitedSoFar(s)).toEqual(['A', 'D'])
    expect(s.phase).toBe('pick')
    expect(s.table.B.distance).toBe(3)
    expect(s.table.C.distance).toBe(10)
    expect(s.table.E.distance).toBe(Infinity)
    expect(s.table.F.distance).toBe(Infinity)
  })

  it('accepts B as the next vertex and asks for F', () => {
    const move = pickVertex(start(), 'B')
    expect(move.feedback.ok).toBe(true)
    expect(move.feedback.text).toContain('B has the smallest distance (3)')
    expect(currentVertex(move.state)).toBe('B')
    expect(neighboursToUpdate(move.state)).toEqual(['F'])
  })

  it('explains a wrong pick: a bigger distance, or a vertex not reached yet', () => {
    const bigger = pickVertex(start(), 'C')
    expect(bigger.feedback.ok).toBe(false)
    expect(bigger.feedback.text).toContain('C has distance 10')
    expect(bigger.state).toEqual(start())
    expect(pickVertex(start(), 'E').feedback.text).toContain("E hasn't been reached yet")
  })

  it('accepts F = 3 + 5 = 8 and rejects the edge weight alone', () => {
    const s = pickVertex(start(), 'B').state
    const wrong = submitDistances(s, { F: '5' })
    expect(wrong.feedback.ok).toBe(false)
    expect(wrong.feedback.text).toContain('5 is only the weight of edge B-F')
    const right = submitDistances(s, { F: '8' })
    expect(right.feedback.ok).toBe(true)
    expect(right.feedback.text).toContain('F is now 8 via B')
    expect(right.state.phase).toBe('pick')
    expect(right.state.changed).toEqual({ F: Infinity })
  })

  it('keeps C at 10 when F is visited: 11 is wrong, 10 or an empty box is right', () => {
    let s = doRight(start()) // B
    s = pickVertex(s, 'F').state
    const eleven = submitDistances(s, { C: '11', E: '14' })
    expect(eleven.feedback.ok).toBe(false)
    expect(eleven.feedback.text).toContain('8 + 3 = 11')
    expect(eleven.feedback.text).toContain("smaller than C's current 10")
    expect(submitDistances(s, { C: '10', E: '14' }).feedback.ok).toBe(true)
    expect(submitDistances(s, { C: '', E: '14' }).feedback.ok).toBe(true)
  })

  it('updates E from 14 to 12 when C is visited, and rejects keeping 14', () => {
    let s = doRight(doRight(start())) // B, F
    s = pickVertex(s, 'C').state
    expect(s.table.E.distance).toBe(14)
    expect(submitDistances(s, { E: '' }).feedback.text).toContain("compare it with E's current 14")
    const right = submitDistances(s, { E: '12' })
    expect(right.feedback.ok).toBe(true)
    expect(right.state.changed).toEqual({ E: 14 })
  })

  it('finishes with E, which has nothing to update, and the final distances', () => {
    let s = start()
    for (let i = 0; i < 3; i++) s = doRight(s) // B, F, C
    const last = pickVertex(s, 'E')
    expect(last.feedback.text).toContain('no unvisited neighbours')
    expect(last.state.phase).toBe('done')
    expect(visitedSoFar(last.state)).toEqual(['A', 'D', 'B', 'F', 'C', 'E'])
    const distances = Object.fromEntries(Object.entries(last.state.table).map(([v, row]) => [v, row.distance]))
    expect(distances).toEqual({ A: 0, B: 3, C: 10, D: 2, E: 12, F: 8 })
  })

  it('says when a box has something that is not a number', () => {
    const s = pickVertex(start(), 'B').state
    const move = submitDistances(s, { F: 'eight' })
    expect(move.feedback.ok).toBe(false)
    expect(move.feedback.text).toContain('needs a whole number')
    expect(move.state).toBe(s)
  })

  it('refuses moves in the wrong phase', () => {
    expect(() => submitDistances(start(), {})).toThrow()
    expect(() => pickVertex(pickVertex(start(), 'B').state, 'F')).toThrow()
  })

  it('follows the text rules in all feedback', () => {
    const texts = [
      pickVertex(start(), 'C').feedback.text,
      pickVertex(start(), 'E').feedback.text,
      submitDistances(pickVertex(start(), 'B').state, { F: '5' }).feedback.text,
    ]
    expect(textRuleProblems(texts)).toEqual([])
  })
})

describe('Your turn on another graph', () => {
  it('explains a tie: alphabetical order wins', () => {
    const graph: Graph = {
      vertices: ['A', 'B', 'C'],
      directed: false,
      edges: [
        { from: 'A', to: 'B', weight: 2 },
        { from: 'A', to: 'C', weight: 2 },
      ],
    }
    const s = startYourTurn(graph, 'A', 1)
    expect(pickVertex(s, 'C').feedback.text).toContain('C and B have the same distance')
    expect(pickVertex(s, 'B').feedback.ok).toBe(true)
  })
})
