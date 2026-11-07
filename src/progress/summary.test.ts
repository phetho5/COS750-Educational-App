import { describe, expect, it } from 'vitest'
import { attempt, passedUpTo, stateWith } from '../test/progressFixtures'
import { initialProgress } from './state'
import { misconceptionsToReview, preLectureSummary } from './summary'

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
