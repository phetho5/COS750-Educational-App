/*
  True when the screen is narrower than 720px (phones). Graphs then switch to
  their narrow layout, with bigger vertices and text, as in the design.
*/
import { useSyncExternalStore } from 'react'

const QUERY = '(max-width: 719px)'

function mediaQuery(): MediaQueryList | null {
  // jsdom (tests) and very old browsers have no matchMedia: assume a laptop.
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY) : null
}

function subscribe(onChange: () => void): () => void {
  const mq = mediaQuery()
  mq?.addEventListener('change', onChange)
  return () => mq?.removeEventListener('change', onChange)
}

export function useIsNarrow(): boolean {
  return useSyncExternalStore(subscribe, () => mediaQuery()?.matches ?? false)
}
