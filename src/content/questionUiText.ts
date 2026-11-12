/*
  The fixed wording around every question: type labels, the hint ladder's
  titles and the short lines on the feedback banners. The question's own
  wording lives with the question (traceText.ts and the concept bank).
*/
import type { CheckId, QuestionFormat } from "../questions";

/** Set to true once the group has reviewed this file's wording. */
export const QUESTION_UI_TEXT_REVIEWED = false;

export const FORMAT_LABEL: Record<QuestionFormat, string> = {
  "multiple-choice": "Multiple choice",
  "select-vertex": "Select on the graph",
  "fill-in": "Fill in the table",
  predict: "Predict the next step",
};

/** The four hint levels (CLAUDE.md: nudge, explanation, worked example, smaller questions). */
export const HINT_TITLES = [
  "A nudge",
  "What went wrong",
  "A worked example",
  "Smaller steps",
] as const;

export const questionUiText = {
  /** On the red banner after a wrong answer. The specific feedback is hint 2. */
  wrongBanner: (mode: "support" | "challenge") =>
    mode === "support"
      ? "Have a look at the hint below, then try again. You can open more hints one at a time."
      : "Not quite. Try once more from memory, or reveal a hint when you want help.",
  revealHint: "Reveal a hint",
  practiceChip: "New question · same type",
  supportMode: "Support mode",
  challengeMode: "Challenge mode",
  largerGraph: "Larger graph · 8 vertices",
  checkButton: "Check",
  nextQuestion: "Next question",
  seeResults: "See your results",
  newQuestion: "Try a new question like this",
  hintsOpened: (n: number) => `${n} of 4 opened`,
  showNextHint: (title: string) => `Show next hint: ${title}`,
  subStepRight: "Correct.",
  subStepWrong: "Not quite.",
  subStepTryAgain: "Have another look and try a different option.",
  selectHint:
    "Select a vertex on the graph. With a keyboard, use Tab to move and Enter to select.",
  yourChoice: (v: string) =>
    `Your choice: ${v}. Select another vertex to change it.`,
  visitedSoFar: "Visited so far:",
  visitingNow: (v: string) => `visiting ${v} now`,
  noneYet: "none yet",
  assessmentNote(checkId: CheckId, total: number, passCount: number): string {
    const scoring =
      checkId === "final"
        ? "Your first answer to each question is recorded for your pre-lecture summary."
        : `Get at least ${passCount} of ${total} right to pass. Only your first answer to each question counts toward your score.`;
    return `${scoring} Hints and practice questions help you learn but do not affect your score.`;
  },
};

/** "Module 2 check" or "Final check". */
export function checkName(checkId: CheckId): string {
  return checkId === "final"
    ? "Final check"
    : `Module ${checkId.slice("module-".length)} check`;
}
