// Small helpers for building progress states in tests, so each test can say
// "module 1 was passed 4 of 5" in one line.
import type { CheckId, ObjectiveId } from '../questions'
import { initialProgress } from '../progress/state'
import type { AnswerRecord, CheckAttempt, ProgressState } from '../progress/types'

/** An attempt with `correct` right answers out of `total`. Wrong answers get the given misconceptions, in order. */
export function attempt(
  correct: number,
  total = 5,
  misconceptions: (string | null)[] = [],
  objective: ObjectiveId = 1,
): CheckAttempt {
  const answers: AnswerRecord[] = []
  for (let i = 0; i < total; i++) {
    const isCorrect = i < correct
    answers.push({
      questionId: `q${i}`,
      typeKey: 'test:type',
      objective,
      correct: isCorrect,
      misconception: isCorrect ? null : (misconceptions[i - correct] ?? null),
    })
  }
  return { answers }
}

/** The starting state with these attempts added (and anything else overridden). */
export function stateWith(
  attempts: Partial<Record<CheckId, CheckAttempt[]>>,
  rest: Partial<Omit<ProgressState, 'attempts' | 'version'>> = {},
): ProgressState {
  const start = initialProgress()
  return { ...start, ...rest, attempts: { ...start.attempts, ...attempts } }
}

/** Every module check passed up to and including module `upTo`. */
export function passedUpTo(upTo: number): Partial<Record<CheckId, CheckAttempt[]>> {
  const attempts: Partial<Record<CheckId, CheckAttempt[]>> = {}
  for (let m = 1; m <= upTo; m++) attempts[`module-${m}` as CheckId] = [attempt(5, 5, [], m as ObjectiveId)]
  return attempts
}
