import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { buildCheck, generateTraceQuestion, type Question } from '../questions'
import { QuestionPanel } from './QuestionPanel'

const choice = generateTraceQuestion({ skill: 'next-vertex', format: 'multiple-choice', objective: 5, seed: 3 })
const fill = generateTraceQuestion({ skill: 'new-distance', format: 'fill-in', objective: 5, seed: 4 })
const select = generateTraceQuestion({ skill: 'next-vertex', format: 'select-vertex', objective: 5, seed: 5 })

function labelOf(q: Question, id: string) {
  return q.options.find((o) => o.id === id)!.label
}

const firstWrong = (q: Question) => Object.keys(q.wrongAnswers)[0]

describe('QuestionPanel: multiple choice', () => {
  it('marks the correct option correct and shows what comes next', async () => {
    const onResult = vi.fn()
    render(<QuestionPanel question={choice} onResult={onResult} afterCorrect={<button>Next question</button>} />)
    expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled()

    await userEvent.click(screen.getByRole('radio', { name: labelOf(choice, choice.correctAnswers[0]) }))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByText('Correct.')).toBeInTheDocument()
    expect(screen.getByText(choice.correctFeedback)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Next question' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Check' })).not.toBeInTheDocument()
    expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ status: 'correct' }))
  })

  it('opens the hint ladder after a wrong answer, one level at a time', async () => {
    const onNewQuestion = vi.fn()
    render(<QuestionPanel question={choice} onNewQuestion={onNewQuestion} />)
    const wrong = firstWrong(choice)

    await userEvent.click(screen.getByRole('radio', { name: labelOf(choice, wrong) }))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))

    expect(screen.getByText('Not quite.')).toBeInTheDocument()
    expect(screen.getByText('1 of 4 opened')).toBeInTheDocument()
    expect(screen.getByText(choice.hints.nudge)).toBeInTheDocument()
    // Hint 2 is the feedback for this exact wrong answer, and isn't shown yet.
    expect(screen.queryByText(choice.wrongAnswers[wrong].feedback)).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Show next hint: What went wrong' }))
    expect(screen.getByText(choice.wrongAnswers[wrong].feedback)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show next hint: A worked example' }))
    expect(screen.getByText(choice.hints.workedExample)).toBeInTheDocument()

    expect(screen.queryByRole('button', { name: 'Try a new question like this' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Show next hint: Smaller steps' }))
    expect(screen.getByText('4 of 4 opened')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Try a new question like this' }))
    expect(onNewQuestion).toHaveBeenCalledOnce()
  })

  it('checks the smaller-step questions in hint 4', async () => {
    render(<QuestionPanel question={choice} />)
    await userEvent.click(screen.getByRole('radio', { name: labelOf(choice, firstWrong(choice)) }))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    for (const title of ['What went wrong', 'A worked example', 'Smaller steps']) {
      await userEvent.click(screen.getByRole('button', { name: `Show next hint: ${title}` }))
    }
    const sub = choice.hints.subSteps[0]
    const group = screen.getByRole('group', { name: 'Options for step 1' })
    const buttons = group.querySelectorAll('button')
    const wrongIndex = sub.correctIndex === 0 ? 1 : 0
    await userEvent.click(buttons[wrongIndex])
    expect(screen.getByText('Have another look and try a different option.')).toBeInTheDocument()
    await userEvent.click(buttons[sub.correctIndex])
    expect(screen.getByText(sub.explanation)).toBeInTheDocument()
  })

  it('keeps the hints open and lets the student answer again after a wrong answer', async () => {
    render(<QuestionPanel question={choice} />)
    await userEvent.click(screen.getByRole('radio', { name: labelOf(choice, firstWrong(choice)) }))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    await userEvent.click(screen.getByRole('radio', { name: labelOf(choice, choice.correctAnswers[0]) }))
    expect(screen.queryByText('Not quite.')).not.toBeInTheDocument()
    expect(screen.getByText('1 of 4 opened')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText('Correct.')).toBeInTheDocument()
  })
})

describe('QuestionPanel: fill in', () => {
  it("shows a message for an answer that isn't a number, without marking it wrong or opening hints", async () => {
    const onResult = vi.fn()
    render(<QuestionPanel question={fill} onResult={onResult} />)
    await userEvent.type(screen.getByLabelText(`Distance for ${fill.fillTarget}`), 'abc')
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(screen.getByText(/Type a whole number/)).toBeInTheDocument()
    expect(screen.queryByText('Not quite.')).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Hints' })).not.toBeInTheDocument()
    expect(onResult).not.toHaveBeenCalled()
  })

  it('marks the engine’s distance correct and a misconception wrong', async () => {
    const onResult = vi.fn()
    render(<QuestionPanel question={fill} onResult={onResult} />)
    const input = screen.getByLabelText(`Distance for ${fill.fillTarget}`)
    await userEvent.type(input, firstWrong(fill) === 'Infinity' ? 'inf' : firstWrong(fill))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'wrong' }))

    await userEvent.clear(input)
    await userEvent.type(input, fill.correctAnswers[0])
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(onResult).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'correct' }))
  })
})

describe('QuestionPanel: select on the graph', () => {
  it('lets the student select a vertex and marks it with a tick or cross badge', async () => {
    const { container } = render(<QuestionPanel question={select} />)
    const wrong = firstWrong(select)
    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^Vertex ${wrong},`) }))
    expect(screen.getByText(`Your choice: ${wrong}. Select another vertex to change it.`)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(container.querySelector('[data-badge="wrong"]')).not.toBeNull()

    await userEvent.click(screen.getByRole('button', { name: new RegExp(`^Vertex ${select.correctAnswers[0]},`) }))
    await userEvent.click(screen.getByRole('button', { name: 'Check' }))
    expect(container.querySelector('[data-badge="right"]')).not.toBeNull()
    // Once correct, the vertices can't be changed any more.
    expect(screen.queryByRole('button', { name: /^Vertex / })).not.toBeInTheDocument()
  })
})

describe('QuestionPanel: concept questions', () => {
  it('shows a concept question without a graph in one column', async () => {
    const terms = buildCheck('module-1', 2).find((q) => q.concept?.groupId === 'm1-terms')!
    render(<QuestionPanel question={terms} />)
    expect(screen.getByRole('heading', { level: 1, name: terms.prompt })).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(terms.options.length)
  })
})
