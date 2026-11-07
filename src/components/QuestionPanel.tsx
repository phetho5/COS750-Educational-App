/*
  Shows one question of any format and lets the student answer it:
  - multiple choice and predict: pick an option
  - select vertex: select a vertex on the graph
  - fill in: type a distance into the table

  Marking always goes through checkAnswer(), so only the question's own
  correct answers (from the engine or the reviewed bank) are ever marked
  correct. A wrong answer opens the hint ladder. An unreadable answer
  ("invalid", e.g. letters in a number box) shows a message but isn't wrong.

  The parent decides what a result means (only the first answer counts in a
  check), so every readable result is passed up through onResult.
  Give this component `key={question.id}` so a new question starts fresh.
*/
import { useState, type ReactNode } from 'react'
import { checkAnswer, type CheckResult, type Question } from '../questions'
import { questionUiText as t } from '../content/questionUiText'
import { listText } from '../content/format'
import { cx } from './classNames'
import { DistanceTable } from './DistanceTable'
import { pathEdges, statesFrom } from './graphHelpers'
import { GraphView, type VertexBadge } from './GraphView'
import { HintLadder } from './HintLadder'
import { Icon } from './Icon'
import { Button, Card, Feedback } from './ui'
import ui from './ui.module.css'
import styles from './QuestionPanel.module.css'

interface QuestionPanelProps {
  question: Question
  /** Called with every readable result (correct or wrong), in order. */
  onResult?: (result: CheckResult) => void
  /** Shown inside the green banner once the answer is correct (e.g. "Next question"). */
  afterCorrect?: ReactNode
  /** Shown once all four hints are open. Leave out to hide the button. */
  onNewQuestion?: () => void
  /** Heading level for the prompt: h1 on a check screen, h2 inside a lesson. */
  headingLevel?: 1 | 2
}

export function QuestionPanel({ question: q, onResult, afterCorrect, onNewQuestion, headingLevel = 1 }: QuestionPanelProps) {
  const [answer, setAnswer] = useState('')
  const [result, setResult] = useState<CheckResult | null>(null)
  const [mistake, setMistake] = useState('')
  const [hintLevel, setHintLevel] = useState(0)
  const [subAnswers, setSubAnswers] = useState<Record<number, number>>({})

  const isCorrect = result?.status === 'correct'
  const canCheck = !isCorrect && answer.trim() !== ''

  function choose(value: string) {
    if (isCorrect) return
    setAnswer(value)
    setResult(null) // a new answer clears the old feedback, but the hints stay open
  }

  function check() {
    const r = checkAnswer(q, answer)
    setResult(r)
    if (r.status === 'invalid') return
    onResult?.(r)
    if (r.status === 'wrong') {
      setMistake(r.feedback)
      setHintLevel((level) => Math.max(level, 1))
    }
  }

  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  const graph = q.view && <QuestionGraph question={q} answer={answer} result={result} onSelect={choose} />

  return (
    <div className={cx(ui.columns, !q.view && styles.single)}>
      {graph && <div className={ui.mainColumn}>{graph}</div>}

      <div className={cx(ui.sideColumn, styles.panel)}>
        <div className={styles.prompt}>
          {q.lead && <p className={styles.lead}>{q.lead}</p>}
          <Heading className={styles.question}>{q.prompt}</Heading>
        </div>

        {(q.format === 'multiple-choice' || q.format === 'predict') && (
          <Options question={q} answer={answer} result={result} onChoose={choose} />
        )}

        {q.format === 'select-vertex' && (
          <div className={styles.selectHint}>
            <Icon name="cursor" color="var(--color-blue)" />
            <span>{answer ? t.yourChoice(answer) : t.selectHint}</span>
          </div>
        )}

        {q.format === 'fill-in' && q.view?.table && q.fillTarget && (
          <DistanceTable
            table={q.view.table}
            vertices={q.view.graph.vertices}
            current={q.view.current}
            previousText={{ [q.fillTarget]: isCorrect ? (q.view.current ?? '?') : '?' }}
            editable={{
              [q.fillTarget]: {
                value: answer,
                onChange: choose,
                ariaLabel: `Distance for ${q.fillTarget}`,
                mark: result?.status === 'correct' ? 'right' : result?.status === 'wrong' ? 'wrong' : null,
              },
            }}
          />
        )}

        <div aria-live="polite" className={styles.feedback}>
          {result?.status === 'correct' && (
            <Feedback kind="correct" action={afterCorrect}>
              {result.feedback}
            </Feedback>
          )}
          {result?.status === 'wrong' && <Feedback kind="wrong">{t.wrongBanner}</Feedback>}
          {result?.status === 'invalid' && <Feedback kind="info">{result.feedback}</Feedback>}
        </div>

        {!isCorrect && (
          <Button spread iconAfter="check" onClick={check} disabled={!canCheck} className={styles.check}>
            {t.checkButton}
          </Button>
        )}

        {hintLevel > 0 && !isCorrect && (
          <HintLadder
            hints={q.hints}
            level={hintLevel}
            onOpenNext={() => setHintLevel((level) => Math.min(4, level + 1))}
            mistake={mistake}
            subAnswers={subAnswers}
            onSubAnswer={(i, j) => setSubAnswers((s) => ({ ...s, [i]: j }))}
            onNewQuestion={onNewQuestion}
          />
        )}
      </div>
    </div>
  )
}

function Options({ question, answer, result, onChoose }: { question: Question; answer: string; result: CheckResult | null; onChoose: (id: string) => void }) {
  const locked = result?.status === 'correct'
  return (
    <div role="radiogroup" aria-label="Answer options" className={styles.options}>
      {question.options.map((option) => {
        const selected = answer === option.id
        const mark = selected && result ? (result.status === 'correct' ? 'right' : result.status === 'wrong' ? 'wrong' : null) : null
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={locked && !selected}
            className={cx(styles.option, selected && styles.optionSelected, mark === 'right' && styles.optionRight, mark === 'wrong' && styles.optionWrong)}
            onClick={() => onChoose(option.id)}
          >
            <span className={styles.dot} aria-hidden="true">
              <span />
            </span>
            <span className={styles.optionLabel}>{option.label}</span>
            {mark === 'right' && (
              <span className={styles.markRight}>
                <Icon name="check" />
                Correct
              </span>
            )}
            {mark === 'wrong' && (
              <span className={styles.markWrong}>
                <Icon name="cross" color="var(--color-bad-icon)" />
                Your answer
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

function QuestionGraph({ question: q, answer, result, onSelect }: { question: Question; answer: string; result: CheckResult | null; onSelect: (v: string) => void }) {
  const view = q.view!
  const isSelect = q.format === 'select-vertex'
  const checked = result !== null && result.status !== 'invalid'
  const selected = isSelect && answer && !checked ? answer : null
  const badges: Record<string, VertexBadge> = {}
  if (isSelect && answer && checked) badges[answer] = result.status === 'correct' ? 'right' : 'wrong'
  const locked = result?.status === 'correct'
  const distances = view.table ? Object.fromEntries(view.graph.vertices.map((v) => [v, view.table![v].distance])) : null

  return (
    <>
      <Card>
        <GraphView
          graph={view.graph}
          wide={view.wide}
          narrow={view.narrow}
          start={view.table ? 'A' : null}
          label="Question graph"
          description={q.lead}
          states={statesFrom(view.graph.vertices, view.visited, view.current, selected)}
          distances={distances}
          checkingEdge={view.checkingEdge}
          pathEdges={pathEdges(view.table)}
          badges={badges}
          onVertex={isSelect && !locked ? onSelect : undefined}
          selectable={view.selectable}
        />
      </Card>
      {view.table && (
        <p className={styles.visited}>
          {t.visitedSoFar} <strong>{view.visited.length ? listText(view.visited) : t.noneYet}</strong>
          {view.current && ` · ${t.visitingNow(view.current)}`}
        </p>
      )}
    </>
  )
}
