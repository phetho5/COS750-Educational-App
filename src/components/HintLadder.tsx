/*
  The hint ladder (CLAUDE.md, the core feature). A wrong answer opens level
  1. The student opens the next level one at a time:
    1. a nudge
    2. what went wrong (the feedback for the student's own wrong answer)
    3. a worked example of a similar step
    4. the task broken into smaller questions
  When all four are open, the student can ask for a new question of the
  same type.
*/
import type { Hints } from '../questions'
import { HINT_TITLES, questionUiText as t } from '../content/questionUiText'
import { cx } from './classNames'
import { Icon } from './Icon'
import { Button } from './ui'
import styles from './HintLadder.module.css'

interface HintLadderProps {
  hints: Hints
  /** How many levels are open (1 to 4). */
  level: number
  onOpenNext: () => void
  /** Hint 2: the feedback for the student's latest wrong answer. */
  mistake: string
  /** Hint 4: the option the student picked for each sub-question, by index. */
  subAnswers: Readonly<Record<number, number>>
  onSubAnswer: (subIndex: number, optionIndex: number) => void
  /** Shown once all four levels are open. */
  onNewQuestion?: () => void
}

export function HintLadder(props: HintLadderProps) {
  const { hints, level, onOpenNext, mistake, subAnswers, onSubAnswer, onNewQuestion } = props
  const texts = [hints.nudge, mistake, hints.workedExample, null]

  return (
    <section aria-label="Hints" className={styles.ladder}>
      <div className={styles.header}>
        <h2 className={styles.title}>Hints</h2>
        <p className={styles.count}>{t.hintsOpened(level)}</p>
      </div>
      <ol className={styles.levels}>
        {HINT_TITLES.map((title, i) => {
          const n = i + 1
          const open = level >= n
          return (
            <li key={title} className={styles.level}>
              <div className={styles.rail} aria-hidden="true">
                <span className={cx(styles.number, open && styles.numberOpen)}>{n}</span>
                {n < 4 && <span className={styles.line} />}
              </div>
              <div className={styles.body}>
                {open && (
                  <div className={styles.hint}>
                    <Icon name="bulb" color="var(--color-hint)" />
                    <div className={styles.hintText}>
                      <p className={styles.hintTitle}>
                        Hint {n} · {title}
                      </p>
                      {texts[i] && <p>{texts[i]}</p>}
                      {n === 4 && <SubSteps hints={hints} answers={subAnswers} onAnswer={onSubAnswer} />}
                    </div>
                  </div>
                )}
                {n === level + 1 && (
                  <Button variant="hint" icon="bulb" onClick={onOpenNext}>
                    {t.showNextHint(title)}
                  </Button>
                )}
                {n > level + 1 && <p className={styles.later}>{title}</p>}
              </div>
            </li>
          )
        })}
      </ol>
      {level >= 4 && onNewQuestion && (
        <Button iconAfter="arrowRight" onClick={onNewQuestion} className={styles.newQuestion}>
          {t.newQuestion}
        </Button>
      )}
    </section>
  )
}

function SubSteps({ hints, answers, onAnswer }: { hints: Hints; answers: Readonly<Record<number, number>>; onAnswer: (i: number, j: number) => void }) {
  return (
    <ol className={styles.subSteps}>
      {hints.subSteps.map((sub, i) => {
        const chosen = answers[i]
        const answered = chosen !== undefined
        const right = chosen === sub.correctIndex
        return (
          <li key={i} className={styles.subStep}>
            <p>
              <strong>{i + 1}.</strong> {sub.prompt}
            </p>
            <div className={styles.subOptions} role="group" aria-label={`Options for step ${i + 1}`}>
              {sub.options.map((option, j) => {
                const selected = chosen === j
                return (
                  <button
                    key={j}
                    type="button"
                    aria-pressed={selected}
                    className={cx(styles.subOption, selected && (j === sub.correctIndex ? styles.subRight : styles.subWrong))}
                    onClick={() => onAnswer(i, j)}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
            {answered && (
              <p className={styles.subFeedback} aria-live="polite">
                <Icon name={right ? 'check' : 'cross'} size={20} color={right ? 'var(--color-good)' : 'var(--color-bad-icon)'} />
                <strong className={right ? styles.good : styles.bad}>{right ? t.subStepRight : t.subStepWrong}</strong>
                <span>{right ? sub.explanation : t.subStepTryAgain}</span>
              </p>
            )}
          </li>
        )
      })}
    </ol>
  )
}
