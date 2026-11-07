import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { YourTurn } from './YourTurn'

const check = () => userEvent.click(screen.getByRole('button', { name: 'Check' }))
const pick = (v: string) => userEvent.click(screen.getByRole('button', { name: new RegExp(`^Vertex ${v},`) }))
const type = (v: string, value: string) => userEvent.type(screen.getByLabelText(`New distance for ${v}`), value)

describe('YourTurn', () => {
  it('starts with A and D visited, and only unvisited vertices selectable', () => {
    render(<YourTurn />)
    expect(screen.getByText(/We've already visited A and D/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()
    const selectable = screen.getAllByRole('button', { name: /^Vertex / }).map((b) => b.getAttribute('aria-label'))
    expect(selectable).toEqual([
      'Vertex B, unvisited, distance 3',
      'Vertex C, unvisited, distance 10',
      'Vertex E, unvisited, distance infinity',
      'Vertex F, unvisited, distance infinity',
    ])
  })

  it('lets the student trace the whole graph, with feedback after each Check', async () => {
    render(<YourTurn doneAction={<button>Start the Module 5 check</button>} />)

    await pick('C')
    await check()
    expect(screen.getByText(/C has distance 10/)).toBeInTheDocument()

    await pick('B')
    await check()
    expect(screen.getByText(/Now update its unvisited neighbour: F/)).toBeInTheDocument()
    await type('F', '5')
    await check()
    expect(screen.getByText(/5 is only the weight of edge B-F/)).toBeInTheDocument()
    await userEvent.clear(screen.getByLabelText('New distance for F'))
    await type('F', '8')
    await check()
    expect(screen.getByText(/F is now 8 via B/)).toBeInTheDocument()

    await pick('F')
    await check()
    await type('E', '14') // C left empty: it keeps 10
    await check()
    expect(screen.getByText(/E is now 14 via F/)).toBeInTheDocument()

    await pick('C')
    await check()
    await type('E', '12')
    await check()

    await pick('E')
    await check()
    expect(screen.getByRole('heading', { name: "Well done. You traced Dijkstra's algorithm." })).toBeInTheDocument()
    expect(screen.getByText('Visit order: A, D, B, F, C, E. Final distances: A 0, B 3, C 10, D 2, E 12, F 8.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Start the Module 5 check' })).toBeInTheDocument()
  })

  it('starts over from A and D', async () => {
    render(<YourTurn />)
    await pick('B')
    await check()
    await userEvent.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.queryByLabelText('New distance for F')).not.toBeInTheDocument()
    expect(screen.getByText('Step 1 of 2 · Choose')).toBeInTheDocument()
  })
})
