/* Wording for the Welcome screen and the module map (CLAUDE.md, Screens). */

/** Set to true once the group has reviewed this file's wording. */
export const WELCOME_TEXT_REVIEWED = false;

export const welcomeText = {
  eyebrow: "COS212 · Before the lecture",
  title: "Graphs and the shortest path",
  // The hook, word for word from CLAUDE.md.
  hook: "How does a navigation app find the quickest route from campus to the Gautrain station? Problems like this are solved with shortest path algorithms, and Dijkstra's algorithm is the classic one.",
  facts: [
    { term: "Time", value: "About 35 minutes" },
    { term: "Modules", value: "5, plus a final check" },
    { term: "Marks", value: "None, just practice" },
  ],
  start: "Start",
  graphCaption:
    "By the end, you'll be able to work out every number on this graph yourself.",
  objectivesTitle: "By the end, you will be able to:",
};

export const mapText = {
  eyebrow: "Your path",
  title: "Module map",
  intro:
    "Work through the modules in order. Each one ends with a short check. Score 80% or more to unlock the next one.",
  objectivesTitle: "Learning objectives",
  progressTitle: "Your progress",
  modulesComplete: (complete: number, total: number) =>
    `${complete} of ${total} modules mastered`,
  nextUp: "Next up",
  continueReview: (moduleId: number) => `Continue Module ${moduleId} review`,
  continueModule: (moduleId: number, title: string) =>
    `Continue Module ${moduleId}: ${title}`,
  continueFinal: "Start the final check",
  continueSummary: "See your pre-lecture summary",
  progressDone:
    "All five modules are mastered. Your pre-lecture summary is ready.",
  // Handoff D8: only the first answer counts, so the design's "hints never count against you" was misleading.
  objectivesNote:
    "Only your first answer to each check question counts. Hints are there to help you learn.",
  summaryButton: "See your pre-lecture summary",
  reset: "Reset progress",
  resetConfirm:
    "This clears every score, note and lecture question. Are you sure?",
  resetYes: "Yes, reset everything",
  resetNo: "Cancel",
  resetDone: "Your progress has been reset.",
  demoNote: "Demo mode: every module is open. Reset progress to turn it off.",
  notStarted: "Not started",
};

export const notFoundText = {
  title: "We couldn't find that page",
  body: "The link may be wrong or out of date.",
  back: "Go to the module map",
};
