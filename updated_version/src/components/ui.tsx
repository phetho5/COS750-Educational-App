/*
  Small shared pieces of UI: buttons, cards, feedback banners and status
  badges. Screens use these so every button and card looks the same.
*/
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import type { ModuleStatus } from '../progress'
import { cx } from './classNames'
import { Icon, type IconName } from './Icon'
import styles from './ui.module.css'

type ButtonVariant = 'primary' | 'secondary' | 'text' | 'hint'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Icon before the label. */
  icon?: IconName
  /** Icon after the label (e.g. an arrow on "Next"). */
  iconAfter?: IconName
  large?: boolean
  /** Push the label and the icon to opposite ends (the design's Check button). */
  spread?: boolean
}

export function Button({
  variant = 'primary',
  icon,
  iconAfter,
  large,
  spread,
  className,
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant], large && styles.large, spread && styles.spread, className)}
      {...rest}
    >
      {icon && <Icon name={icon} />}
      <span>{children}</span>
      {iconAfter && <Icon name={iconAfter} />}
    </button>
  )
}

export function Card({ children, flush, className }: { children: ReactNode; flush?: boolean; className?: string }) {
  return <div className={cx(styles.card, flush && styles.cardFlush, className)}>{children}</div>
}

type FeedbackKind = 'correct' | 'wrong' | 'info'

const FEEDBACK_ICON: Record<FeedbackKind, { name: IconName; color: string }> = {
  correct: { name: 'circleCheck', color: 'var(--color-good)' },
  wrong: { name: 'circleCross', color: 'var(--color-bad-icon)' },
  info: { name: 'info', color: 'var(--color-blue-dark)' },
}

const FEEDBACK_LEAD: Record<FeedbackKind, string> = {
  correct: 'Correct.',
  wrong: 'Not quite.',
  info: '',
}

/**
 * The green "Correct." / red "Not quite." banner. The words say whether the
 * answer was right, so the colour is never the only signal.
 */
export function Feedback({ kind, children, action }: { kind: FeedbackKind; children: ReactNode; action?: ReactNode }) {
  const icon = FEEDBACK_ICON[kind]
  return (
    <div className={cx(styles.feedback, styles[kind])}>
      <Icon name={icon.name} color={icon.color} />
      <div className={styles.feedbackBody}>
        <p>
          {FEEDBACK_LEAD[kind] && <strong>{FEEDBACK_LEAD[kind]}</strong>} {children}
        </p>
        {action}
      </div>
    </div>
  )
}

const STATUS: Record<ModuleStatus | 'review', { label: string; icon: IconName; className: string }> = {
  mastered: { label: 'Mastered', icon: 'check', className: styles.badgeMastered },
  'in-progress': { label: 'In progress', icon: 'halfCircle', className: styles.badgeProgress },
  locked: { label: 'Locked', icon: 'lock', className: styles.badgeLocked },
  review: { label: 'Review', icon: 'restart', className: styles.badgeReview },
}

export function StatusBadge({ status }: { status: ModuleStatus | 'review' }) {
  const s = STATUS[status]
  return (
    <span className={cx(styles.badge, s.className)}>
      <Icon name={s.icon} size={18} strokeWidth={status === 'mastered' ? 2.5 : 2} />
      {s.label}
    </span>
  )
}
