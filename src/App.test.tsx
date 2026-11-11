import { act, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { navigate } from './routing/router'

describe('App', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders the app title', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: 'Graphs and the shortest path' })).toBeInTheDocument()
  })

  // Bug B11: newer browsers return a Promise from window.scrollTo. The scroll-to-top
  // effect used to return that Promise, and React crashed calling it as a clean-up
  // function on the next page. jsdom's scrollTo returns nothing, so we copy the browser.
  it('keeps working when scrollTo returns a Promise, as newer browsers do', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation((() => Promise.resolve()) as unknown as typeof window.scrollTo)
    window.history.pushState(null, '', '/')
    render(<App />)

    act(() => navigate('/map'))
    act(() => navigate('/'))

    expect(window.scrollTo).toHaveBeenCalledTimes(3)
    expect(screen.getByRole('heading', { level: 1, name: 'Graphs and the shortest path' })).toBeInTheDocument()
  })
})
