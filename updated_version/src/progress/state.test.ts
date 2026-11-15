import { describe, expect, it } from 'vitest'
import { buildCheck, checkAnswer, newQuestionLike, type CheckId, type CheckResult, type Question } from '../questions'
import { STARTER_LECTURE_QUESTIONS } from '../content/lectureQuestions'
import { attempt, passedUpTo, stateWith } from '../test/progressFixtures'
import { canStartCheck, latestAttempt, moduleStatus } from './mastery'
import {
  addLectureQuestion,
  answerRecord,
  completeReview,
  finishCheck,
  initialProgress,
  rememberShown,
  removeLectureQuestion,
  setThinkNote,
} from './state'

/** A real check, answered with real results from checkAnswer: the first `correct` right, the rest wrong. */
function answeredCheck(checkId: CheckId, correct: number, seed = 11): { questions: Question[]; results: CheckResult[] } {
  const questions = buildCheck(checkId, seed)
  const results = questions.map((q, i) =>
    checkAnswer(q, i < correct ? q.correctAnswers[0] : Object.keys(q.wrongAnswers)[0]),
  )
  return { questions, results }
}

describe('initialProgress', () => {
  it('starts with no attempts, reviews or notes, nothing unlocked for the demo, and the three starter questions', () => {
    const state = initialProgress()
    expect(Object.values(state.attempts).every((a) => a.length === 0)).toBe(true)
    expect(state.reviewDue).toEqual([])
    expect(state.lastShown).toEqual({})
    expect(state.thinkNotes).toEqual({})
    expect(state.demoUnlocked).toBe(false)
    expect(state.lectureQuestions).toEqual(STARTER_LECTURE_QUESTIONS)
    expect(state.lectureQuestions).toHaveLength(3)
  })

  it('gives a new object each time, so a reset never shares old state', () => {
    expect(initialProgress()).not.toBe(initialProgress())
    expect(initialProgress().attempts).not.toBe(initialProgress().attempts)
  })
})

describe('answerRecord', () => {
  const [question] = buildCheck('module-5', 3)

  it('records a correct first answer with no misconception', () => {
    const record = answerRecord(question, checkAnswer(question, question.correctAnswers[0]))
    expect(record).toEqual({
      questionId: question.id,
      typeKey: question.typeKey,
      objective: 5,
      correct: true,
      misconception: null,
    })
  })

  it("records a wrong first answer with the answer's misconception", () => {
    const [wrongKey, info] = Object.entries(question.wrongAnswers)[0]
    const record = answerRecord(question, checkAnswer(question, wrongKey))
    expect(record.correct).toBe(false)
    expect(record.misconception).toBe(info.misconception)
    expect(record.misconception).not.toBeNull()
  })

  it('refuses an invalid result, which is not an answer yet', () => {
    expect(() => answerRecord(question, { status: 'invalid', feedback: 'Type a number' })).toThrow(/invalid/)
  })
})

describe('finishCheck', () => {
  it('records a pass, which masters the module and opens the next one', () => {
    const { questions, results } = answeredCheck('module-1', 4)
    const state = finishCheck(initialProgress(), 'module-1', questions, results)
    expect(state.attempts['module-1']).toHaveLength(1)
    expect(latestAttempt(state, 'module-1')?.answers.map((a) => a.correct)).toEqual([true, true, true, true, false])
    expect(moduleStatus(state, 1)).toBe('mastered')
    expect(moduleStatus(state, 2)).toBe('in-progress')
    expect(state.reviewDue).toEqual([])
  })

  it('makes a review due after a fail, which blocks a retry until the review is done', () => {
    const { questions, results } = answeredCheck('module-1', 3)
    const failed = finishCheck(initialProgress(), 'module-1', questions, results)
    expect(failed.reviewDue).toEqual(['module-1'])
    expect(canStartCheck(failed, 'module-1')).toBe(false)
    expect(() => finishCheck(failed, 'module-1', questions, results)).toThrow(/isn't open/)

    const reviewed = completeReview(failed, 'module-1')
    expect(canStartCheck(reviewed, 'module-1')).toBe(true)
  })

  it('makes a review due when a mastered module is retried and failed, but it stays mastered', () => {
    const start = stateWith(passedUpTo(1))
    const { questions, results } = answeredCheck('module-1', 1)
    const state = finishCheck(start, 'module-1', questions, results)
    expect(moduleStatus(state, 1)).toBe('mastered')
    expect(state.reviewDue).toEqual(['module-1'])
  })

  it('never makes a review due for the final check', () => {
    const { questions, results } = answeredCheck('final', 0)
    const state = finishCheck(stateWith(passedUpTo(5)), 'final', questions, results)
    expect(state.reviewDue).toEqual([])
    expect(state.attempts.final).toHaveLength(1)
  })

  it('keeps other reviews that are due', () => {
    const start = stateWith({ ...passedUpTo(1), 'module-2': [attempt(5)] }, { reviewDue: ['module-1'] })
    const { questions, results } = answeredCheck('module-3', 5)
    expect(finishCheck(start, 'module-3', questions, results).reviewDue).toEqual(['module-1'])
  })

  it('remembers the concept versions shown, so the next attempt avoids them', () => {
    const { questions, results } = answeredCheck('module-1', 5)
    const state = finishCheck(initialProgress(), 'module-1', questions, results)
    for (const q of questions) expect(state.lastShown[q.concept!.groupId]).toBe(q.concept!.versionId)

    const retry = buildCheck('module-1', 999, state.lastShown)
    for (const q of retry) expect(q.concept!.versionId).not.toBe(state.lastShown[q.concept!.groupId])
  })

  it('refuses a locked check', () => {
    const { questions, results } = answeredCheck('module-2', 5)
    expect(() => finishCheck(initialProgress(), 'module-2', questions, results)).toThrow(/isn't open/)
  })

  it('refuses the wrong number of questions or answers', () => {
    const { questions, results } = answeredCheck('module-1', 5)
    expect(() => finishCheck(initialProgress(), 'module-1', questions.slice(1), results.slice(1))).toThrow(/5 questions/)
    expect(() => finishCheck(initialProgress(), 'module-1', questions, results.slice(1))).toThrow(/5 questions/)
  })

  it("doesn't change the state it was given", () => {
    const start = initialProgress()
    const snapshot = structuredClone(start)
    const { questions, results } = answeredCheck('module-1', 2)
    finishCheck(start, 'module-1', questions, results)
    expect(start).toEqual(snapshot)
  })
})

describe('rememberShown', () => {
  it('remembers the version of a practice question from after the hint ladder', () => {
    const [question] = buildCheck('module-1', 5)
    const practice = newQuestionLike(question, 6)
    const state = rememberShown(initialProgress(), [practice])
    expect(state.lastShown[practice.concept!.groupId]).toBe(practice.concept!.versionId)
  })
})

describe('notes and lecture questions', () => {
  const noQuestions = stateWith({}, { lectureQuestions: [] })

  it('saves a Think about it answer exactly as typed', () => {
    const state = setThinkNote(initialProgress(), 'graph-vs-list', 'A graph can branch ')
    expect(state.thinkNotes).toEqual({ 'graph-vs-list': 'A graph can branch ' })
    expect(setThinkNote(state, 'graph-vs-list', 'New text').thinkNotes['graph-vs-list']).toBe('New text')
  })

  it('adds trimmed lecture questions and ignores blank ones', () => {
    let state = addLectureQuestion(noQuestions, '  Why no negative weights?  ')
    state = addLectureQuestion(state, '   ')
    state = addLectureQuestion(state, 'What about ties?')
    expect(state.lectureQuestions).toEqual(['Why no negative weights?', 'What about ties?'])
  })

  it('lets the student remove a starter question', () => {
    const state = removeLectureQuestion(initialProgress(), 0)
    expect(state.lectureQuestions).toEqual(STARTER_LECTURE_QUESTIONS.slice(1))
  })

  it('removes a lecture question by its position', () => {
    let state = addLectureQuestion(noQuestions, 'First')
    state = addLectureQuestion(state, 'Second')
    state = addLectureQuestion(state, 'Third')
    expect(removeLectureQuestion(state, 1).lectureQuestions).toEqual(['First', 'Third'])
    expect(removeLectureQuestion(state, 7).lectureQuestions).toEqual(['First', 'Second', 'Third'])
  })
})
