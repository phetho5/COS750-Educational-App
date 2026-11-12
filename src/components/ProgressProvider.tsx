/*
  Holds the student's progress in React state and saves every change through
  the progress store (src/progress/storage.ts), which falls back to memory if
  localStorage isn't available.

  The store and React state always hold the same object: update() works out
  the new state once, saves it, then hands the same object to React.
*/
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { createProgressStore, type ProgressState, type ProgressStore } from '../progress'
import { readLearningMode, writeLearningMode, type LearningMode } from '../progress/learningMode'
import { ProgressContext, type ProgressContextValue } from './progressContext'

interface ProgressProviderProps {
  children: ReactNode
  /** Tests pass their own store. The app uses the browser's localStorage. */
  store?: ProgressStore
}

export function ProgressProvider({ children, store: givenStore }: ProgressProviderProps) {
  // Created once, on first render: loads saved progress or starts fresh.
  const [store] = useState(() => givenStore ?? createProgressStore())
  const [progress, setProgress] = useState<ProgressState>(() => store.get())
  const [learningMode, setLearningModeState] = useState<LearningMode>(readLearningMode)

  const update = useCallback(
    (change: (current: ProgressState) => ProgressState) => {
      const next = change(store.get())
      store.set(next)
      setProgress(next)
    },
    [store],
  )

  const reset = useCallback(() => setProgress(store.reset()), [store])
  const setLearningMode = useCallback((mode: LearningMode) => {
    setLearningModeState(mode)
    writeLearningMode(mode)
  }, [])

  const value = useMemo<ProgressContextValue>(
    () => ({ progress, update, reset, isSaving: store.isSaving(), learningMode, setLearningMode }),
    [progress, update, reset, store, learningMode, setLearningMode],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
