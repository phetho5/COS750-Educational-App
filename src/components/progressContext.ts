/*
  The student's progress, shared with every screen through React context.
  ProgressProvider (ProgressProvider.tsx) supplies it. Screens call
  useProgress() to read it and change it.
*/
import { createContext, useContext } from 'react'
import type { ProgressState } from '../progress'

export interface ProgressContextValue {
  progress: ProgressState
  /** Apply a change, e.g. update((p) => completeReview(p, 'module-2')). Saved straight away. */
  update: (change: (current: ProgressState) => ProgressState) => void
  /** Reset progress: back to a fresh start. */
  reset: () => void
  /** False if progress can't be saved, so it won't survive closing the tab. */
  isSaving: boolean
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useProgress(): ProgressContextValue {
  const value = useContext(ProgressContext)
  if (!value) throw new Error('useProgress() must be used inside <ProgressProvider>.')
  return value
}
