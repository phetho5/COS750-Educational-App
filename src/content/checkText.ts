/*
  Wording for starting and finishing a check: the pass screen, and the
  messages when a check can't be started yet.
*/
import type { CheckId, ModuleId } from '../questions'
import { moduleInfo } from './modules'

/** Set to true once the group has reviewed this file's wording. */
export const CHECK_TEXT_REVIEWED = false

export const checkText = {
  locked: (name: string) => `${name} is still locked. Pass the check before it to open it.`,
  reviewFirst: (name: string) => `Before you try the ${name.toLowerCase()} again, do the short review. It only takes a few minutes.`,
  goToReview: 'Go to the review',
  backToMap: 'Back to the module map',
  score: (correct: number, total: number) => `You got ${correct} of ${total} right on the first try.`,
  passedTitle: 'Well done. You passed.',
  unlockedNext: (checkId: CheckId): string => {
    if (checkId === 'module-5') return 'The final check is now open.'
    const next = (Number(checkId.slice('module-'.length)) + 1) as ModuleId
    return `Module ${next}, ${moduleInfo(next).title}, is now open.`
  },
  nextButton: (checkId: CheckId): string => (checkId === 'module-5' ? 'Start the final check' : 'Go to the next module'),
  notSavingNote: "Your progress can't be saved in this browser, so it will be lost when you close the tab.",
}
