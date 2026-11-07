/*
  Saving progress to localStorage, with an in-memory fallback.

  How it works:
  - The store keeps the current progress in memory. That copy is what the app
    reads, so the app never depends on storage working.
  - Every change is also written to localStorage as a backup, so progress
    survives a page refresh.
  - Every localStorage call is wrapped in try/catch (CLAUDE.md). Storage can
    be missing or fail: private browsing, storage full, cookies blocked, or
    even reading `window.localStorage` itself can throw. When it fails, the
    app carries on with the in-memory copy, and progress lasts until the tab
    is closed.
  - Saved data is checked field by field when it's loaded. Anything corrupt,
    from an older version or otherwise unexpected resets to a fresh start,
    because half-trusted progress could unlock a module the student hasn't
    passed.
*/
import { CHECK_IDS, type CheckId } from '../questions'
import { OBJECTIVE_IDS } from './mastery'
import { initialProgress } from './state'
import { PROGRESS_VERSION, type AnswerRecord, type CheckAttempt, type ProgressState } from './types'

export const STORAGE_KEY = 'cos212-progress'

/** The parts of the browser's Storage we use. Tests pass in a fake. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>

/** The browser's localStorage, or null if it can't be reached. */
export function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null // e.g. a SecurityError when the browser blocks storage
  }
}

// ---- Checking saved data -------------------------------------------------

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return isRecord(value) && Object.values(value).every((v) => typeof v === 'string')
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isCheckId(value: unknown): value is CheckId {
  return CHECK_IDS.includes(value as CheckId)
}

function isAnswerRecord(value: unknown): value is AnswerRecord {
  if (!isRecord(value)) return false
  const { questionId, typeKey, objective, correct, misconception } = value
  return (
    typeof questionId === 'string' &&
    typeof typeKey === 'string' &&
    OBJECTIVE_IDS.includes(objective as AnswerRecord['objective']) &&
    typeof correct === 'boolean' &&
    (misconception === null || typeof misconception === 'string') &&
    // A correct answer can't have a misconception.
    !(correct && misconception !== null)
  )
}

function isCheckAttempt(value: unknown): value is CheckAttempt {
  return isRecord(value) && Array.isArray(value.answers) && value.answers.length > 0 && value.answers.every(isAnswerRecord)
}

function isAttempts(value: unknown): value is ProgressState['attempts'] {
  if (!isRecord(value)) return false
  const keys = Object.keys(value)
  return (
    keys.length === CHECK_IDS.length &&
    keys.every(isCheckId) &&
    CHECK_IDS.every((id) => Array.isArray(value[id]) && (value[id] as unknown[]).every(isCheckAttempt))
  )
}

/**
 * Reads saved progress. Returns null if there's nothing usable: missing, not
 * JSON, another version, or any field with the wrong shape.
 */
export function parseProgress(saved: string | null): ProgressState | null {
  if (saved === null) return null

  let data: unknown
  try {
    data = JSON.parse(saved)
  } catch {
    return null
  }

  if (!isRecord(data) || data.version !== PROGRESS_VERSION) return null
  const { attempts, reviewDue, lastShown, thinkNotes, lectureQuestions } = data
  const valid =
    isAttempts(attempts) &&
    Array.isArray(reviewDue) &&
    reviewDue.every((id) => isCheckId(id) && id !== 'final') &&
    new Set(reviewDue).size === reviewDue.length &&
    isStringRecord(lastShown) &&
    isStringRecord(thinkNotes) &&
    isStringArray(lectureQuestions)
  if (!valid) return null

  // Rebuild the object from the checked fields only, so stray extra fields are dropped.
  return { version: PROGRESS_VERSION, attempts, reviewDue: reviewDue as CheckId[], lastShown, thinkNotes, lectureQuestions }
}

// ---- The store ---------------------------------------------------------

export interface ProgressStore {
  /** The current progress (the in-memory copy). */
  get(): ProgressState
  /** Replaces the progress and tries to save it. */
  set(next: ProgressState): void
  /** Reset progress: back to a fresh start, and the fresh start is saved over the old progress. */
  reset(): ProgressState
  /** False if the last read or write to storage failed, so progress won't survive closing the tab. */
  isSaving(): boolean
}

/** Creates the store, loading any saved progress. Pass null to keep progress in memory only. */
export function createProgressStore(storage: StorageLike | null = browserStorage()): ProgressStore {
  let saving = storage !== null
  let current = load()

  function load(): ProgressState {
    if (storage === null) return initialProgress()
    try {
      return parseProgress(storage.getItem(STORAGE_KEY)) ?? initialProgress()
    } catch {
      saving = false
      return initialProgress()
    }
  }

  function write(state: ProgressState): void {
    if (storage === null) return
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state))
      saving = true
    } catch {
      saving = false // e.g. storage full. Keep going with the in-memory copy.
    }
  }

  function set(next: ProgressState): void {
    current = next
    write(next)
  }

  return {
    get: () => current,
    set,
    // Saving a fresh start (rather than removing the key) means the same
    // write path, and its failure handling, is used for a reset too.
    reset() {
      set(initialProgress())
      return current
    },
    isSaving: () => saving,
  }
}
