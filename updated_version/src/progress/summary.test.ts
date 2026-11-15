import { describe, expect, it } from 'vitest'
import { attempt, passedUpTo, stateWith } from '../test/progressFixtures'
import { initialProgress } from './state'
import { MISCONCEPTION_REVIEW, OBJECTIVE_REVIEW } from '../content/summaryText'
import { misconceptionsToReview, preLectureSummary, reviewItems } from './summary'

describe('misconceptionsToReview', () => {
  it('is empty for a new student', () => {
    expect(misconceptionsToReview(initialProgress())).toEqual([])
  })

  it('counts mistakes across checks, most frequent first, ties in id order', () => {
    const state = stateWith({
      'module-4': [attempt(3, 5, ['next-alphabetical', 'dist-keep-old'], 4)],
      'module-5': [attempt(3, 5, ['dist-keep-old', 'dist-edge-only'], 5)],
    })
    expect(misconceptionsToReview(state)).toEqual([
      { misconception: 'dist-keep-old', count: 2, objectives: [4, 5] },
      { misconception: 'dist-edge-only', count: 1, objectives: [5] },
      { misconception: 'next-alphabetical', count: 1, objectives: [4] },
    ])
  })

  it('uses only the attempt that counts, leaving out mistakes the student has since fixed', () => {
    const state = stateWith({ 'module-1': [attempt(2, 5, ['old-a', 'old-b', 'old-c']), attempt(4, 5, ['still-wrong'])] })
    expect(misconceptionsToReview(state).map((m) => m.misconception)).toEqual(['still-wrong'])
  })

  it('includes mistakes from the final check', () => {
    const state = stateWith({ ...passedUpTo(5), final: [attempt(4, 5, ['final-mistake'])] })
    expect(misconceptionsToReview(state).map((m) => m.misconception)).toEqual(['final-mistake'])
  })

  it('skips wrong answers that matched no known misconception', () => {
    const state = stateWith({ 'module-1': [attempt(3, 5, [null, 'known'])] })
    expect(misconceptionsToReview(state).map((m) => m.misconception)).toEqual(['known'])
  })
})

describe('preLectureSummary', () => {
  it('splits objectives into strengths and things to review', () => {
    const state = stateWith({
      'module-1': [attempt(5)],
      'module-2': [attempt(4)],
      'module-3': [attempt(3)],
    })
    const summary = preLectureSummary(state)
    expect(summary.strengths).toEqual([1, 2])
    expect(summary.objectivesToReview).toEqual([3, 4, 5])
    expect(summary.objectives.map((o) => o.percent)).toEqual([100, 80, 60, 0, 0])
  })

  it('reports the best final check score, or null before it is taken', () => {
    expect(preLectureSummary(stateWith(passedUpTo(5))).finalCheck).toBeNull()
    const state = stateWith({ ...passedUpTo(5), final: [attempt(3), attempt(2)] })
    expect(preLectureSummary(state).finalCheck).toEqual({ percent: 60, passed: false })
  })

  it('includes lecture questions and only the Think about it answers that are not blank', () => {
    const state = stateWith({}, {
      lectureQuestions: ['Why no negative weights?'],
      thinkNotes: { 'graph-vs-list': 'A graph can branch.', 'empty-box': '   ' },
    })
    const summary = preLectureSummary(state)
    expect(summary.lectureQuestions).toEqual(['Why no negative weights?'])
    expect(summary.thinkNotes).toEqual([{ boxId: 'graph-vs-list', text: 'A graph can branch.' }])
  })
})

describe('reviewItems', () => {
  it('is empty when every objective is mastered and there were no mistakes', () => {
    expect(reviewItems(preLectureSummary(stateWith(passedUpTo(5))))).toEqual([])
  })

  it('gives core Dijkstra mistakes their own line, pointing to the walkthrough', () => {
    const state = stateWith({ ...passedUpTo(4), 'module-5': [attempt(4, 5, ['dist-edge-only'], 5)] })
    expect(reviewItems(preLectureSummary(state))).toEqual([{ text: MISCONCEPTION_REVIEW['dist-edge-only'], moduleId: 4 }])
  })

  it("groups other mistakes under their objective's line, and lists objectives below 80%", () => {
    const state = stateWith({
      ...passedUpTo(2),
      'module-1': [attempt(4, 5, ['m1-terms-lines'], 1)],
      'module-3': [attempt(3, 5, ['m3-fewest-always', 'next-alphabetical'], 3)],
    })
    const items = reviewItems(preLectureSummary(state))
    expect(items[0]).toEqual({ text: MISCONCEPTION_REVIEW['next-alphabetical'], moduleId: 4 })
    expect(items.slice(1).map((i) => i.moduleId)).toEqual([1, 3, 4, 5])
    expect(items[1].text).toBe(OBJECTIVE_REVIEW[1])
  })

  it('has a line for every core trace misconception', () => {
    for (const id of ['next-alphabetical', 'next-discovery-order', 'next-lightest-edge', 'dist-keep-old', 'dist-edge-only', 'dist-always-update', 'dist-own-distance']) {
      expect(MISCONCEPTION_REVIEW[id]).toBeTruthy()
    }
  })
})
