/*
  The shape of a student's saved progress.

  Only facts are stored (which answers were right on the first try, which
  reviews are waiting). Everything else, such as a module's status or an
  objective's percentage, is worked out from these facts by the rules in
  mastery.ts. That way the saved data can never disagree with the rules.
*/
import type { CheckId, LastShown, MisconceptionId, ObjectiveId } from '../questions'

/**
 * Bump this whenever ProgressState changes shape. Saved data with any other
 * version is thrown away and the student starts again (see storage.ts).
 */
export const PROGRESS_VERSION = 1

/** The student's first answer to one check question. Only the first answer counts (handoff D8). */
export interface AnswerRecord {
  readonly questionId: string
  /** Which type of question it was, e.g. "trace:new-distance:fill-in". */
  readonly typeKey: string
  readonly objective: ObjectiveId
  readonly correct: boolean
  /** The specific mistake, if the answer was wrong and matched a known misconception. */
  readonly misconception: MisconceptionId | null
}

/** One finished attempt at a check: the first answer to each of its questions, in order. */
export interface CheckAttempt {
  readonly answers: readonly AnswerRecord[]
}

export interface ProgressState {
  readonly version: typeof PROGRESS_VERSION
  /** Every finished attempt at each check, oldest first. */
  readonly attempts: Readonly<Record<CheckId, readonly CheckAttempt[]>>
  /** Module checks the student scored below 80% on and hasn't reviewed yet. They can't retry until they do. */
  readonly reviewDue: readonly CheckId[]
  /** Concept group id -> version shown last time, so a retry never repeats it. */
  readonly lastShown: LastShown
  /** "Think about it" answers, keyed by the box's id. Not marked. */
  readonly thinkNotes: Readonly<Record<string, string>>
  /** The student's own questions to bring to the lecture. */
  readonly lectureQuestions: readonly string[]
}

/** The three statuses on the module map (CLAUDE.md). */
export type ModuleStatus = 'locked' | 'in-progress' | 'mastered'
