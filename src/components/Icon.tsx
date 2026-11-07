/*
  The design's line icons (24 × 24, drawn with strokes). Our fonts have no
  ✓, ✕ or arrows (handoff stage 1, item 11), so every tick, cross and arrow
  in the app is one of these SVGs. Icons are decorative (aria-hidden): the
  text next to them always says the same thing in words.
*/
import type { CSSProperties } from 'react'

const PATHS = {
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  chevronLeft: <path d="m15 18-6-6 6-6" />,
  chevronRight: <path d="m9 18 6-6-6-6" />,
  chevronDown: <path d="m6 9 6 6 6-6" />,
  check: <path d="M20 6 9 17l-5-5" />,
  cross: <path d="M18 6 6 18M6 6l12 12" />,
  restart: (
    <>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </>
  ),
  play: <path d="M7 4v16l13-8z" />,
  pause: <path d="M9 5v14M15 5v14" />,
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </>
  ),
  halfCircle: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3a9 9 0 0 1 0 18z" style={{ fill: 'currentColor', stroke: 'none' }} />
    </>
  ),
  bulb: (
    <>
      <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
      <path d="M9 18h6" />
      <path d="M10 22h4" />
    </>
  ),
  cursor: <path d="m3 3 7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />,
  circleCheck: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m8 12 3 3 5-6" />
    </>
  ),
  circleCross: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </>
  ),
  watch: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="m10 8 6 4-6 4z" />
    </>
  ),
  read: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  try: <path d="m4 4 7 17 2.5-7.5L21 11z" />,
  info: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 16v-5M12 8h.01" />
    </>
  ),
} as const

export type IconName = keyof typeof PATHS

interface IconProps {
  name: IconName
  size?: number
  /** Stroke colour. Defaults to the text colour around the icon. */
  color?: string
  strokeWidth?: number
  style?: CSSProperties
}

export function Icon({ name, size = 24, color = 'currentColor', strokeWidth = 2, style }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
      style={{
        fill: 'none',
        stroke: color,
        strokeWidth,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        flex: 'none',
        ...style,
      }}
    >
      {PATHS[name]}
    </svg>
  )
}

/** The filled blue tick used for "visited" in tables (a circle with a white tick). */
export function VisitedTick({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" focusable="false" style={{ flex: 'none' }}>
      <circle cx="12" cy="12" r="11" fill="var(--color-blue)" />
      <path
        d="m7 12.5 3.2 3.2L17 9"
        fill="none"
        stroke="#ffffff"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
