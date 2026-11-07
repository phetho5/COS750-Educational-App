/*
  The facts the pre-lecture summary shows (CLAUDE.md): mastery per
  objective, strengths, what to review and questions to bring to the lecture.

  This file only works out WHICH objectives and mistakes to show. The words
  the student reads (e.g. the review advice for each misconception) belong in
  src/content/ and are added with the summary screen in step 5.
*/
import { CHECK_IDS, type MisconceptionId, type ObjectiveId } from '../questions'
import { bestAttempt, isPass, objectiveMastery, scorePercent, type ObjectiveMastery } from './mastery'
import type { ProgressState } from './types'

export interface MisconceptionToReview {
  readonly misconception: MisconceptionId
  /** How many first answers showed this mistake, in the attempts that count. */
  readonly count: number
  /** The objectives of the questions where it showed up, in order. */
  readonly objectives: readonly ObjectiveId[]
}

export interface PreLectureSummary {
  readonly objectives: readonly ObjectiveMastery[]
  /** Score on the best final check attempt, or null if not taken yet. */
  readonly finalCheck: { readonly percent: number; readonly passed: boolean } | null
  /** Objectives at 80% or more. */
  readonly strengths: readonly ObjectiveId[]
  /** Objectives below 80%, including ones not attempted yet. */
  readonly objectivesToReview: readonly ObjectiveId[]
  /** Mistakes from the attempts that count, most frequent first. */
  readonly misconceptionsToReview: readonly MisconceptionToReview[]
  readonly lectureQuestions: readonly string[]
  /** "Think about it" answers that aren't blank. */
  readonly thinkNotes: readonly { readonly boxId: string; readonly text: string }[]
}

/**
 * Collects the misconceptions behind wrong first answers in the attempt that
 * counts for each check (the best one, see mastery.ts). Mistakes from earlier
 * attempts the student has since improved on are left out.
 */
export function misconceptionsToReview(state: ProgressState): MisconceptionToReview[] {
  const found = new Map<MisconceptionId, { count: number; objectives: ObjectiveId[] }>()

  for (const checkId of CHECK_IDS) {
    const best = bestAttempt(state.attempts[checkId])
    for (const answer of best?.answers ?? []) {
      if (answer.correct || answer.misconception === null) continue
      const entry = found.get(answer.misconception) ?? { count: 0, objectives: [] }
      entry.count += 1
      if (!entry.objectives.includes(answer.objective)) entry.objectives.push(answer.objective)
      found.set(answer.misconception, entry)
    }
  }

  return [...found.entries()]
    .map(([misconception, entry]) => ({ misconception, count: entry.count, objectives: entry.objectives }))
    .sort((a, b) => b.count - a.count || a.misconception.localeCompare(b.misconception))
}

export function preLectureSummary(state: ProgressState): PreLectureSummary {
  const objectives = objectiveMastery(state)
  const finalBest = bestAttempt(state.attempts.final)

  return {
    objectives,
    finalCheck: finalBest ? { percent: scorePercent(finalBest), passed: isPass(finalBest) } : null,
    strengths: objectives.filter((o) => o.mastered).map((o) => o.objective),
    objectivesToReview: objectives.filter((o) => !o.mastered).map((o) => o.objective),
    misconceptionsToReview: misconceptionsToReview(state),
    lectureQuestions: state.lectureQuestions,
    thinkNotes: Object.entries(state.thinkNotes)
      .filter(([, text]) => text.trim() !== '')
      .map(([boxId, text]) => ({ boxId, text })),
  }
}
