/*
  Mastery rules. Every function here is pure: it reads a ProgressState and
  works something out, without changing anything.

  The rules (CLAUDE.md, plus the decisions in docs/handoff.md):
  - 80% or more on a check passes it. Each check has 5 questions, so 4 correct passes.
  - Only the first answer to each question counts.
  - Passing module n's check masters module n and unlocks module n + 1.
    Passing module 5 unlocks the final check. Module 1 is always open.
  - The attempt that counts is the best one (most correct; if two tie, the
    later one). So a module, once mastered, stays mastered even if a retry
    scores lower.
  - Below 80% on a module check, the student must do the review before
    retrying. The final check never needs a review: it always leads to the
    pre-lecture summary.
*/
import { CHECK_IDS, type CheckId, type ModuleId, type ObjectiveId } from '../questions'
import type { CheckAttempt, ModuleStatus, ProgressState } from './types'

/** The pass mark, as a whole-number percentage. */
export const PASS_PERCENT = 80

export const MODULE_IDS: readonly ModuleId[] = [1, 2, 3, 4, 5]
export const OBJECTIVE_IDS: readonly ObjectiveId[] = [1, 2, 3, 4, 5]

/** Module n's check tests only objective n (handoff D44), so it measures that objective. */
export function checkForObjective(objective: ObjectiveId): CheckId {
  return `module-${objective}`
}

export function correctCount(attempt: CheckAttempt): number {
  return attempt.answers.filter((a) => a.correct).length
}

/** The attempt's score as a whole-number percentage, e.g. 4 of 5 -> 80. An empty attempt scores 0. */
export function scorePercent(attempt: CheckAttempt): number {
  if (attempt.answers.length === 0) return 0
  return Math.round((correctCount(attempt) * 100) / attempt.answers.length)
}

/**
 * 80% or more passes. Compared with whole numbers (correct × 100 against
 * 80 × total) so no rounding can turn 79.6% into a pass. An attempt with
 * no answers never passes (otherwise 0 ≥ 0 would count as a pass).
 */
export function isPass(attempt: CheckAttempt): boolean {
  if (attempt.answers.length === 0) return false
  return correctCount(attempt) * 100 >= PASS_PERCENT * attempt.answers.length
}

/** The attempt that counts: the most correct answers, and the later one if two tie. Null if never tried. */
export function bestAttempt(attempts: readonly CheckAttempt[]): CheckAttempt | null {
  let best: CheckAttempt | null = null
  for (const attempt of attempts) {
    // `>=` (not `>`) so a later attempt with the same score replaces an earlier one.
    if (best === null || correctCount(attempt) >= correctCount(best)) best = attempt
  }
  return best
}

export function latestAttempt(state: ProgressState, checkId: CheckId): CheckAttempt | null {
  const attempts = state.attempts[checkId]
  return attempts.length > 0 ? attempts[attempts.length - 1] : null
}

/** True if any attempt at this check passed. */
export function hasPassed(state: ProgressState, checkId: CheckId): boolean {
  return state.attempts[checkId].some(isPass)
}

/** The check that has to be passed before this one opens, or null for module 1. */
export function prerequisiteOf(checkId: CheckId): CheckId | null {
  const index = CHECK_IDS.indexOf(checkId)
  return index > 0 ? CHECK_IDS[index - 1] : null
}

/**
 * Module 1 is always open. Every other check opens once the one before it is
 * passed, or when the demo switch has unlocked everything.
 */
export function isUnlocked(state: ProgressState, checkId: CheckId): boolean {
  if (state.demoUnlocked) return true
  const before = prerequisiteOf(checkId)
  return before === null || hasPassed(state, before)
}

/** Locked, in progress (open but not passed yet) or mastered. Used for modules and the final check. */
export function checkStatus(state: ProgressState, checkId: CheckId): ModuleStatus {
  if (!isUnlocked(state, checkId)) return 'locked'
  return hasPassed(state, checkId) ? 'mastered' : 'in-progress'
}

export function moduleStatus(state: ProgressState, moduleId: ModuleId): ModuleStatus {
  return checkStatus(state, `module-${moduleId}`)
}

export function needsReview(state: ProgressState, checkId: CheckId): boolean {
  return state.reviewDue.includes(checkId)
}

/** The student may start the check if it's unlocked and no review is waiting for it. */
export function canStartCheck(state: ProgressState, checkId: CheckId): boolean {
  return isUnlocked(state, checkId) && !needsReview(state, checkId)
}

/** Where the student goes after finishing an attempt at a check. */
export type AfterCheck = 'next-module' | 'review' | 'summary'

export function nextStepAfterCheck(checkId: CheckId, attempt: CheckAttempt): AfterCheck {
  if (checkId === 'final') return 'summary'
  return isPass(attempt) ? 'next-module' : 'review'
}

export interface ObjectiveMastery {
  readonly objective: ObjectiveId
  /** Whether the student has finished the check for this objective at least once. */
  readonly attempted: boolean
  /** Score on the attempt that counts, or 0 if not attempted. */
  readonly percent: number
  readonly mastered: boolean
}

/** Mastery of every learning objective, from the best attempt at its module check. */
export function objectiveMastery(state: ProgressState): ObjectiveMastery[] {
  return OBJECTIVE_IDS.map((objective) => {
    const best = bestAttempt(state.attempts[checkForObjective(objective)])
    return {
      objective,
      attempted: best !== null,
      percent: best ? scorePercent(best) : 0,
      mastered: best ? isPass(best) : false,
    }
  })
}
