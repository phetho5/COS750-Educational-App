/*
  The review after scoring below 80% on a module check (CLAUDE.md): extra
  explanation, easier practice, then a retry. The retry opens once both
  practice questions are answered correctly (the design). Starting the check
  marks the review as done (completeReview), so the check can begin.
*/
import { useState } from 'react'
import type { CheckId, ModuleId } from '../questions'
import { completeReview, correctCount, latestAttempt, needsReview, scorePercent } from '../progress'
import { REVIEWS, reviewUiText as t } from '../content/reviews'
import { navigate } from '../routing/router'
import { paths } from '../routing/routes'
import { cx } from '../components/classNames'
import { Icon } from '../components/Icon'
import { useProgress } from '../components/progressContext'
import { Button, Card, Feedback, StatusBadge } from '../components/ui'
import ui from '../components/ui.module.css'
import styles from './ReviewScreen.module.css'

export function ReviewScreen({ checkId }: { checkId: CheckId }) {
  const { progress, update } = useProgress()
  const moduleId = Number(checkId.slice('module-'.length)) as ModuleId
  const review = REVIEWS[moduleId]
  const [picks, setPicks] = useState<Record<number, number>>({})

  if (!needsReview(progress, checkId)) {
    return (
      <div className={`${ui.page} ${styles.review}`}>
        <h1 className={ui.pageTitle}>{t.title}</h1>
        <Feedback kind="info">{t.noReviewDue}</Feedback>
        <div className={ui.row}>
          <Button onClick={() => navigate(paths.module(moduleId))}>{t.backToModule}</Button>
        </div>
      </div>
    )
  }

  const attempt = latestAttempt(progress, checkId)
  const practiceDone = review.practice.every((q, i) => picks[i] === q.correctIndex)

  function retry() {
    update((p) => completeReview(p, checkId))
    navigate(paths.check(checkId))
  }

  return (
    <div className={`${ui.page} ${styles.review}`}>
      <div className={ui.pageHeader}>
        <p className={ui.eyebrow}>{t.eyebrow}</p>
        <h1 className={ui.pageTitle}>{t.title}</h1>
      </div>

      <div className={styles.top}>
        {attempt && (
          <div className={`${ui.card} ${styles.score}`}>
            <span className={styles.percent}>{scorePercent(attempt)}%</span>
            <p>{t.score(correctCount(attempt), attempt.answers.length)}</p>
          </div>
        )}
        <div className={styles.locked}>
          <StatusBadge status="locked" />
          <p>
            <strong>{t.nextLocked(t.nextLockedFor(moduleId))}</strong>
          </p>
        </div>
      </div>

      <ol className={styles.steps}>
        <li>
          <Card>
            <div className={styles.step}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>1</span>
                {t.anotherWayTitle}
              </h2>
              <p className={styles.text}>{review.anotherWay}</p>
              <div className={styles.rules}>
                {review.rules.map((rule, i) => (
                  <p key={rule}>
                    <strong>{t.rule(i + 1)}</strong> {rule}
                  </p>
                ))}
              </div>
              <Button variant="text" className={styles.selfStart} onClick={() => navigate(paths.module(moduleId))}>
                {t.rereadModule}
              </Button>
            </div>
          </Card>
        </li>

        <li>
          <Card>
            <div className={styles.step}>
              <h2 className={styles.stepTitle}>
                <span className={styles.stepNumber}>2</span>
                {t.practiceTitle}
              </h2>
              {review.practice.map((q, i) => {
                const pick = picks[i]
                const right = pick === q.correctIndex
                return (
                  <div key={q.prompt} className={styles.practice}>
                    <p id={`practice-${i}`}>{q.prompt}</p>
                    <div role="group" aria-labelledby={`practice-${i}`} className={ui.row}>
                      {q.options.map((option, j) => (
                        <button
                          key={option}
                          type="button"
                          aria-pressed={pick === j}
                          className={cx(styles.option, pick === j && (right ? styles.right : styles.wrong))}
                          onClick={() => setPicks((p) => ({ ...p, [i]: j }))}
                        >
                          {option}
                        </button>
                      ))}
                    </div>
                    {pick !== undefined && (
                      <p className={styles.feedback} aria-live="polite">
                        <Icon name={right ? 'check' : 'cross'} size={20} color={right ? 'var(--color-good)' : 'var(--color-bad-icon)'} />
                        <strong className={right ? styles.good : styles.bad}>{right ? t.right : t.wrong}</strong>
                        <span>{right ? q.why : t.tryOther}</span>
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </Card>
        </li>

        <li>
          <Card>
            <div className={styles.retry}>
              <div className={styles.step}>
                <h2 className={styles.stepTitle}>
                  <span className={styles.stepNumber}>3</span>
                  {t.retryTitle}
                </h2>
                <p className={`${ui.small} ${ui.muted}`}>{practiceDone ? t.retryReady : t.retryLocked}</p>
              </div>
              <Button iconAfter="arrowRight" disabled={!practiceDone} onClick={retry}>
                {t.startCheck}
              </Button>
            </div>
          </Card>
        </li>
      </ol>
    </div>
  )
}
