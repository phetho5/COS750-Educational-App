import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { navigate, subscribeToPath, useCurrentPath } from './router'

function ShowPath() {
  return <p>{useCurrentPath()}</p>
}

afterEach(() => {
  window.history.replaceState(null, '', '/')
})

describe('navigate', () => {
  it('changes the URL path without reloading', () => {
    navigate('/map')
    expect(window.location.pathname).toBe('/map')
  })

  it('tells subscribers about the change', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeToPath(onChange)
    navigate('/map')
    expect(onChange).toHaveBeenCalledTimes(1)
    unsubscribe()
  })

  it('does nothing when already on that path', () => {
    navigate('/map')
    const lengthBefore = window.history.length
    const onChange = vi.fn()
    const unsubscribe = subscribeToPath(onChange)
    navigate('/map')
    expect(onChange).not.toHaveBeenCalled()
    expect(window.history.length).toBe(lengthBefore)
    unsubscribe()
  })

  it('stops notifying after unsubscribe', () => {
    const onChange = vi.fn()
    const unsubscribe = subscribeToPath(onChange)
    unsubscribe()
    navigate('/map')
    expect(onChange).not.toHaveBeenCalled()
  })
})

describe('useCurrentPath', () => {
  it('re-renders with the new path after navigate', () => {
    render(<ShowPath />)
    expect(screen.getByText('/')).toBeInTheDocument()
    act(() => navigate('/walkthrough'))
    expect(screen.getByText('/walkthrough')).toBeInTheDocument()
  })

  it('re-renders when the browser goes back (popstate)', () => {
    render(<ShowPath />)
    act(() => navigate('/walkthrough'))
    act(() => {
      // jsdom doesn't fire popstate for history.back(), so simulate what the browser does.
      window.history.replaceState(null, '', '/')
      window.dispatchEvent(new PopStateEvent('popstate'))
    })
    expect(screen.getByText('/')).toBeInTheDocument()
  })
})
