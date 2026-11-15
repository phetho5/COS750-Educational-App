import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Header } from './Header'

const themeKey = 'cos750-color-theme'

describe('appearance switch', () => {
  beforeEach(() => {
    document.documentElement.dataset.theme = 'dark'
    window.localStorage.removeItem(themeKey)
  })

  afterEach(() => {
    document.documentElement.dataset.theme = 'dark'
    window.localStorage.removeItem(themeKey)
  })

  it('changes the appearance without navigating and remembers the choice', async () => {
    const user = userEvent.setup()
    render(<Header />)

    await user.click(screen.getByRole('button', { name: 'Switch to light mode' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(window.localStorage.getItem(themeKey)).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Switch to dark mode' }))
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(window.localStorage.getItem(themeKey)).toBe('dark')
  })

  it('reads the theme restored before React starts', () => {
    document.documentElement.dataset.theme = 'light'
    render(<Header />)
    expect(screen.getByRole('button', { name: 'Switch to dark mode' })).toBeInTheDocument()
  })
})
