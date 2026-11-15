export type LearningMode = "support" | "challenge";

export const LEARNING_MODE_STORAGE_KEY = "cos212-learning-mode";

/** Read the mode preference separately from scored progress so it can change without resetting progress. */
export function readLearningMode(
  storage: Pick<Storage, "getItem"> | null = safeStorage(),
): LearningMode {
  if (!storage) return "support";
  try {
    const value = storage.getItem(LEARNING_MODE_STORAGE_KEY);
    return value === "challenge" ? "challenge" : "support";
  } catch {
    return "support";
  }
}

/** Save a valid mode preference; if storage is unavailable, the in-memory choice still applies. */
export function writeLearningMode(
  mode: LearningMode,
  storage: Pick<Storage, "setItem"> | null = safeStorage(),
): void {
  if (!storage) return;
  try {
    storage.setItem(LEARNING_MODE_STORAGE_KEY, mode);
  } catch {
    // The preference remains active in memory for the current app session.
  }
}

function safeStorage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}
