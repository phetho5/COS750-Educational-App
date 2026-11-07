/*
  Checking a student's answer.

  The rule that matters most: an answer is only ever marked correct if it is
  in question.correctAnswers, which comes from the engine (trace questions)
  or the reviewed bank (concept questions). Nothing here guesses.
*/
import type { CheckResult, Question } from './types'

const INFINITY_WORDS = ['∞', 'inf', 'infinity']

/**
 * Turns what a student typed into a distance into a standard form:
 * "12", " 012 " -> "12"; "∞", "inf", "Infinity" -> "Infinity".
 * Returns null if it isn't a whole number 0 or more, or infinity.
 */
export function normalizeDistanceInput(raw: string): string | null {
  const text = raw.trim().toLowerCase()
  if (INFINITY_WORDS.includes(text)) return 'Infinity'
  if (!/^\d+$/.test(text)) return null
  return String(Number(text))
}

export const INVALID_NUMBER_FEEDBACK = 'Type a whole number, like 7. If the vertex hasn\'t been reached, type ∞ or "inf".'
export const EMPTY_ANSWER_FEEDBACK = 'Choose an answer first.'

/** Marks an answer. `answer` is an option id, a vertex name, or what the student typed. */
export function checkAnswer(question: Question, answer: string): CheckResult {
  const key = question.format === 'fill-in' ? normalizeDistanceInput(answer) : answer.trim()

  if (question.format === 'fill-in' && key === null) {
    return { status: 'invalid', feedback: answer.trim() === '' ? EMPTY_ANSWER_FEEDBACK : INVALID_NUMBER_FEEDBACK }
  }
  if (key === null || key === '') {
    return { status: 'invalid', feedback: EMPTY_ANSWER_FEEDBACK }
  }

  if (question.correctAnswers.includes(key)) {
    return { status: 'correct', feedback: question.correctFeedback }
  }

  const known = Object.hasOwn(question.wrongAnswers, key) ? question.wrongAnswers[key] : undefined
  return {
    status: 'wrong',
    misconception: known?.misconception ?? null,
    feedback: known?.feedback ?? question.fallbackWrongFeedback,
  }
}
