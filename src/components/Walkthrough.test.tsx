import { act, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Walkthrough } from './Walkthrough'

const stepLine = () => screen.getByText(/^Step \d+ of 16/).textContent

afterEach(() => {
  vi.useRealTimers()
})

describe('Walkthrough', () => {
  it('starts at the set-up step with Back disabled', () => {
    render(<Walkthrough />)
    expect(stepLine()).toBe('Step 1 of 16 · Set up')
    expect(screen.getByRole('button', { name: 'Back' })).toBeDisabled()
    expect(screen.getByText(/We start at A/, { selector: 'p' })).toBeInTheDocument()
  })

  it('moves with Next and Back, and with the arrow keys', async () => {
    render(<Walkthrough />)
    await userEvent.click(screen.getByRole('button', { name: 'Next' }))
    expect(stepLine()).toBe('Step 2 of 16 · Visit A')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(stepLine()).toBe('Step 3 of 16 · Visit A: check A-B')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    await userEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(stepLine()).toBe('Step 1 of 16 · Set up')
  })

  it('shows the table update when B goes from 4 to 3', async () => {
    render(<Walkthrough />)
    for (let i = 0; i < 5; i++) fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(stepLine()).toBe('Step 6 of 16 · Visit D: check D-B')
    expect(screen.getByRole('row', { name: /^B/ })).toHaveTextContent('B3was 4D')
    // Pseudocode: the update line (10) is highlighted.
    const current = screen.getAllByRole('listitem').filter((li) => li.getAttribute('aria-current') === 'step')
    expect(current.map((li) => li.textContent)).toEqual([
      '8        alt ← dist[u] + weight(u, v)',
      '9        if alt < dist[v]:',
      '10            dist[v] ← alt;  prev[v] ← u',
    ])
  })

  it('plays through to the end on its own, then stops', () => {
    vi.useFakeTimers()
    render(<Walkthrough />)
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => vi.advanceTimersByTime(2400 * 3))
    expect(stepLine()).toBe('Step 4 of 16 · Visit A: check A-D')
    act(() => vi.advanceTimersByTime(2400 * 20))
    expect(stepLine()).toBe('Step 16 of 16 · Finished')
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument()
  })

  it('plays faster at 2× and can be paused and restarted', () => {
    vi.useFakeTimers()
    render(<Walkthrough />)
    fireEvent.change(screen.getByLabelText('Speed'), { target: { value: '2' } })
    fireEvent.click(screen.getByRole('button', { name: 'Play' }))
    act(() => vi.advanceTimersByTime(1200 * 2))
    expect(stepLine()).toMatch(/^Step 3 of 16/)
    fireEvent.click(screen.getByRole('button', { name: 'Pause' }))
    act(() => vi.advanceTimersByTime(10000))
    expect(stepLine()).toMatch(/^Step 3 of 16/)
    fireEvent.click(screen.getByRole('button', { name: 'Restart' }))
    expect(stepLine()).toBe('Step 1 of 16 · Set up')
  })

  it('ignores arrow keys another control has already used (e.g. the Watch/Read/Try tabs)', () => {
    render(<Walkthrough />)
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight', cancelable: true, bubbles: true })
    event.preventDefault()
    act(() => {
      window.dispatchEvent(event)
    })
    expect(stepLine()).toBe('Step 1 of 16 · Set up')
    // The same key, not used by anything else, does move on.
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }))
    })
    expect(stepLine()).toBe('Step 2 of 16 · Visit A')
  })

  it('hides and shows the pseudocode', async () => {
    render(<Walkthrough />)
    const toggle = screen.getByRole('button', { name: /Pseudocode/ })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(toggle)
    expect(screen.queryByRole('list', { name: 'Dijkstra pseudocode' })).not.toBeInTheDocument()
  })
})
