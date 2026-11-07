// Runs before every test file.
import '@testing-library/jest-dom/vitest' // adds matchers like toBeInTheDocument()
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// We don't use Vitest globals, so React Testing Library can't clean up
// rendered components by itself. Do it after each test so tests stay independent.
afterEach(() => {
  cleanup()
})
