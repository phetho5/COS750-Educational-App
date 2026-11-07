/*
  A very small router built on the browser's History API.

  Why not React Router? The brief allows no extra dependencies, and we only
  need two things: change the URL without reloading the page, and re-render
  when the URL changes (including the browser's Back and Forward buttons).

  Refreshing a page works because the host (Vercel) sends every URL to
  index.html (see vercel.json). The app then reads the path and shows the
  right screen.
*/
import { useSyncExternalStore } from 'react'

// pushState doesn't fire any event, so we fire our own to tell subscribers.
const NAVIGATE_EVENT = 'cos212:navigate'

/** Go to a path inside the app, adding an entry to the browser history. */
export function navigate(path: string): void {
  if (path === window.location.pathname) return
  window.history.pushState(null, '', path)
  window.dispatchEvent(new Event(NAVIGATE_EVENT))
}

/** Calls `onChange` whenever the path changes. Returns an unsubscribe function. */
export function subscribeToPath(onChange: () => void): () => void {
  window.addEventListener('popstate', onChange) // Back and Forward buttons
  window.addEventListener(NAVIGATE_EVENT, onChange) // our navigate()
  return () => {
    window.removeEventListener('popstate', onChange)
    window.removeEventListener(NAVIGATE_EVENT, onChange)
  }
}

function getPath(): string {
  return window.location.pathname
}

/** React hook: the current path. The component re-renders when it changes. */
export function useCurrentPath(): string {
  return useSyncExternalStore(subscribeToPath, getPath)
}
