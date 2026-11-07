/*
  The starting state, and every way progress can change.

  Each function takes the current state and returns a NEW state. Nothing is
  changed in place, so React can tell that something changed, and a test can
  compare before and after.
*/
import {
  CHECK_LENGTH,
  shownVersions,
  type CheckId,
  type CheckResult,
  type Question,
} from '../questions'
import { canStartCheck, isPass } from './mastery'
import { PROGRESS_VERSION, type AnswerRecord, type CheckAttempt, type ProgressState } from './types'

/** A student who hasn't started. Also what Reset progress returns to. */
export function initialProgress(): ProgressState {
  return {
    version: PROGRESS_VERSION,
    // No attempts yet at any check. TypeScript checks that every CheckId is listed.
    attempts: { 'module-1': [], 'module-2': [], 'module-3': [], 'module-4': [], 'module-5': [], final: [] },
    reviewDue: [],
    lastShown: {},
    thinkNotes: {},
    lectureQuestions: [],
  }
}

/**
 * Turns a question and the result of the student's FIRST answer into a
 * record. An "invalid" result (e.g. letters in a number box) isn't an answer
 * yet, so the screen must not pass one in.
 */
export function answerRecord(question: Question, firstResult: CheckResult): AnswerRecord {
  if (firstResult.status === 'invalid') {
    throw new Error(`Question ${question.id}: an invalid answer isn't a first answer. Record the first readable one.`)
  }
  return {
    questionId: question.id,
    typeKey: question.typeKey,
    objective: question.objective,
    correct: firstResult.status === 'correct',
    misconception: firstResult.status === 'wrong' ? firstResult.misconception : null,
  }
}

/**
 * Records a finished attempt at a check.
 * - `questions` are the check's questions, in order, and `firstResults` the
 *   result of the student's first answer to each one.
 * - Remembers which concept versions were shown, so the next attempt avoids them.
 * - Below 80% on a module check, a review becomes due. A pass clears it.
 *
 * Throws if the screen passes in something that can't be a real attempt:
 * the wrong number of answers, an invalid answer, or a check that isn't open.
 */
export function finishCheck(
  state: ProgressState,
  checkId: CheckId,
  questions: readonly Question[],
  firstResults: readonly CheckResult[],
): ProgressState {
  if (questions.length !== CHECK_LENGTH || firstResults.length !== CHECK_LENGTH) {
    throw new Error(`A check has ${CHECK_LENGTH} questions and answers. Got ${questions.length} and ${firstResults.length}.`)
  }
  if (!canStartCheck(state, checkId)) {
    throw new Error(`Check ${checkId} isn't open (locked, or a review is due), so it can't be recorded.`)
  }

  const attempt: CheckAttempt = { answers: questions.map((q, i) => answerRecord(q, firstResults[i])) }
  const otherReviews = state.reviewDue.filter((id) => id !== checkId)
  const reviewNowDue = checkId !== 'final' && !isPass(attempt)

  return {
    ...state,
    attempts: { ...state.attempts, [checkId]: [...state.attempts[checkId], attempt] },
    reviewDue: reviewNowDue ? [...otherReviews, checkId] : otherReviews,
    lastShown: { ...state.lastShown, ...shownVersions(questions) },
  }
}

/** The student finished the review for a check, so they may retry it. */
export function completeReview(state: ProgressState, checkId: CheckId): ProgressState {
  return { ...state, reviewDue: state.reviewDue.filter((id) => id !== checkId) }
}

/**
 * Remembers concept versions shown outside a check attempt, such as the
 * "new question of the same type" after the hint ladder, so the next check
 * doesn't show the same version straight away.
 */
export function rememberShown(state: ProgressState, questions: readonly Question[]): ProgressState {
  return { ...state, lastShown: { ...state.lastShown, ...shownVersions(questions) } }
}

/** Saves a "Think about it" answer exactly as typed (trimming while typing would eat spaces). */
export function setThinkNote(state: ProgressState, boxId: string, text: string): ProgressState {
  return { ...state, thinkNotes: { ...state.thinkNotes, [boxId]: text } }
}

/** Adds a lecture question. Blank questions are ignored. */
export function addLectureQuestion(state: ProgressState, text: string): ProgressState {
  const question = text.trim()
  if (question === '') return state
  return { ...state, lectureQuestions: [...state.lectureQuestions, question] }
}

export function removeLectureQuestion(state: ProgressState, index: number): ProgressState {
  return { ...state, lectureQuestions: state.lectureQuestions.filter((_, i) => i !== index) }
}
