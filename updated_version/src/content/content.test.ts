/*
  Checks the student-facing content in src/content/:
  - the text rules (no em-dashes or en-dashes), for every file;
  - every fact about the sample graph that a lesson or review states,
    checked against the engine and the graph, so wording can't teach
    something wrong.
*/
import { describe, expect, it } from 'vitest'
import { dijkstra, neighboursOf, SAMPLE_GRAPH, type CheckEdgeStep } from '../engine'
import { routeCost, weightBetween } from '../components/lessons/lessonLogic'
import { textRuleProblems } from '../test/textRules'
import * as checkText from './checkText'
import { splitBold } from './format'
import * as lectureQuestions from './lectureQuestions'
import * as lessons from './lessons'
import { GRAPH_PARTS, LESSONS, routesText } from './lessons'
import * as modules from './modules'
import * as questionUiText from './questionUiText'
import * as reviews from './reviews'
import { REVIEWS } from './reviews'
import * as summaryText from './summaryText'
import * as welcomeText from './welcomeText'
import * as yourTurnText from './yourTurnText'

const run = dijkstra(SAMPLE_GRAPH, 'A')
const finalDistance = (v: string) => run.finalTable[v].distance
const checkStep = (u: string, v: string) =>
  run.steps.find((s): s is CheckEdgeStep => s.kind === 'check-edge' && s.vertex === u && s.neighbour === v)!

describe('content text rules', () => {
  it.each([
    ['checkText', checkText],
    ['lectureQuestions', lectureQuestions],
    ['lessons', lessons],
    ['modules', modules],
    ['questionUiText', questionUiText],
    ['reviews', reviews],
    ['summaryText', summaryText],
    ['welcomeText', welcomeText],
    ['yourTurnText', yourTurnText],
  ])('%s has no em-dashes or en-dashes', (_, content) => {
    expect(textRuleProblems(content)).toEqual([])
  })

  it('every file with student text has a "reviewed" flag set to false until the group checks it', () => {
    expect(lessons.LESSONS_REVIEWED).toBe(false)
    expect(reviews.REVIEWS_REVIEWED).toBe(false)
    expect(summaryText.SUMMARY_TEXT_REVIEWED).toBe(false)
    expect(welcomeText.WELCOME_TEXT_REVIEWED).toBe(false)
    expect(checkText.CHECK_TEXT_REVIEWED).toBe(false)
    expect(questionUiText.QUESTION_UI_TEXT_REVIEWED).toBe(false)
    expect(yourTurnText.YOUR_TURN_TEXT_REVIEWED).toBe(false)
  })

  it('reads **bold** markers', () => {
    expect(splitBold('A **vertex** and an **edge**.')).toEqual([
      { text: 'A ', bold: false },
      { text: 'vertex', bold: true },
      { text: ' and an ', bold: false },
      { text: 'edge', bold: true },
      { text: '.', bold: false },
    ])
  })

  it('has balanced ** markers in every lesson paragraph', () => {
    for (const lesson of Object.values(LESSONS)) {
      for (const p of lesson.read) expect(p.split('**').length % 2, p).toBe(1)
    }
  })
})

describe('sample-graph facts in the lessons', () => {
  it('Module 1: A-D has weight 2, and A’s neighbours are B and D', () => {
    expect(weightBetween(SAMPLE_GRAPH, 'A', 'D')).toBe(2)
    expect(LESSONS[1].read.join(' ')).toContain('the edge between A and D has weight 2')
    expect(GRAPH_PARTS[2].caption).toContain('from A to D costs 2')
    expect(neighboursOf(SAMPLE_GRAPH, 'A').map((n) => n.vertex)).toEqual(['B', 'D'])
    expect(LESSONS[1].read.join(' ')).toContain("A's neighbours are B and D")
  })

  it('Module 3: A, D, C has length 2 + 8 = 10', () => {
    expect(routeCost(SAMPLE_GRAPH, ['A', 'D', 'C'])).toEqual({ route: ['A', 'D', 'C'], weights: [2, 8], total: 10 })
    expect(LESSONS[3].read.join(' ')).toContain('A, D, C has length 2 + 8 = 10')
  })

  it('Module 3 Watch: the shortest of the three routes to E matches the engine', () => {
    const costs = routesText.watchRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))
    const best = costs.reduce((a, b) => (b.total < a.total ? b : a))
    expect(best.total).toBe(finalDistance('E'))
    expect(best.route).toEqual(['A', 'D', 'C', 'E'])
    // The totals the Watch animation shows (4+5+6, 2+1+5+3+2 and 2+8+2).
    expect(costs.map((c) => c.total)).toEqual([15, 13, 12])
  })

  it("Module 3 Try: A, D, B, F is the shortest to F, and A, B, F (the trap) has the fewest edges", () => {
    const costs = routesText.tryRoutes.map((r) => routeCost(SAMPLE_GRAPH, r))
    const best = costs.reduce((a, b) => (b.total < a.total ? b : a))
    expect(best.route).toEqual(['A', 'D', 'B', 'F'])
    expect(best.total).toBe(finalDistance('F'))
    const fewest = costs.reduce((a, b) => (b.route.length < a.route.length ? b : a))
    expect(fewest.route).toEqual(['A', 'B', 'F'])
  })
})

describe('sample-graph facts in the reviews', () => {
  const answer = (moduleId: 1 | 2 | 3 | 4 | 5, i: 0 | 1) => {
    const q = REVIEWS[moduleId].practice[i]
    return q.options[q.correctIndex]
  }

  it('every practice question has a valid answer and at least two options', () => {
    for (const review of Object.values(REVIEWS)) {
      for (const q of review.practice) {
        expect(q.options.length).toBeGreaterThanOrEqual(2)
        expect(q.correctIndex).toBeGreaterThanOrEqual(0)
        expect(q.correctIndex).toBeLessThan(q.options.length)
        expect(new Set(q.options).size).toBe(q.options.length)
      }
    }
  })

  it('Module 1: two edges touch A', () => {
    expect(answer(1, 0)).toBe(String(neighboursOf(SAMPLE_GRAPH, 'A').length))
  })

  it("Module 2: row D, column B is D-B's weight, and C's list is D, E and F", () => {
    expect(answer(2, 0)).toBe(String(weightBetween(SAMPLE_GRAPH, 'D', 'B')))
    expect(answer(2, 1)).toBe(neighboursOf(SAMPLE_GRAPH, 'C').map((n) => n.vertex).join(', ').replace(/, (\w)$/, ' and $1'))
  })

  it('Module 3: A, B, F has length 9, and A, D, B, F has length 8', () => {
    expect(answer(3, 0)).toBe(String(routeCost(SAMPLE_GRAPH, ['A', 'B', 'F']).total))
    expect(routeCost(SAMPLE_GRAPH, ['A', 'D', 'B', 'F']).total).toBe(8)
    expect(answer(3, 1)).toBe('A, D, B, F')
  })

  it('Module 4: after A, D (2) beats B (4), and going through D makes B 3', () => {
    expect(run.visitOrder[1]).toBe('D')
    expect(answer(4, 0)).toBe('D')
    const db = checkStep('D', 'B')
    expect([db.oldDistance, db.candidate, db.updated]).toEqual([4, 3, true])
    expect(answer(4, 1)).toBe('Yes, to 3')
  })

  it('Module 5: visiting F (8), E becomes 8 + 6 = 14 and C stays 10', () => {
    const fe = checkStep('F', 'E')
    expect([fe.candidate - fe.weight, fe.weight, fe.oldDistance, fe.candidate]).toEqual([8, 6, Infinity, 14])
    expect(answer(5, 0)).toBe('14')
    const fc = checkStep('F', 'C')
    expect([fc.weight, fc.oldDistance, fc.updated]).toEqual([3, 10, false])
    expect(answer(5, 1)).toBe('C stays at 10')
  })
})
