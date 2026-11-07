/*
  Steps through a fixed number of steps: back, next, restart, and play/pause
  at a chosen speed. Used by the walkthrough and the Watch animations.
*/
import { useCallback, useEffect, useState } from 'react'

export const SPEEDS = [0.5, 1, 2] as const
export type Speed = (typeof SPEEDS)[number]

export interface StepPlayer {
  step: number
  total: number
  playing: boolean
  speed: Speed
  atStart: boolean
  atEnd: boolean
  next: () => void
  back: () => void
  restart: () => void
  goTo: (step: number) => void
  togglePlay: () => void
  playFromStart: () => void
  setSpeed: (speed: Speed) => void
}

/** `msPerStep` is the time per step at 1× speed. */
export function useStepPlayer(total: number, msPerStep = 2400): StepPlayer {
  const [step, setStep] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [speed, setSpeed] = useState<Speed>(1)
  const last = total - 1

  const goTo = useCallback((n: number) => setStep(Math.max(0, Math.min(last, n))), [last])

  // While playing, move one step forward on a timer, and stop at the end.
  useEffect(() => {
    if (!playing) return
    const timer = window.setInterval(() => {
      setStep((s) => {
        if (s >= last) {
          setPlaying(false)
          return s
        }
        return s + 1
      })
    }, msPerStep / speed)
    return () => window.clearInterval(timer)
  }, [playing, speed, last, msPerStep])

  return {
    step,
    total,
    playing,
    speed,
    atStart: step === 0,
    atEnd: step === last,
    next: () => goTo(step + 1),
    back: () => goTo(step - 1),
    restart: () => {
      setPlaying(false)
      setStep(0)
    },
    goTo: (n: number) => {
      setPlaying(false)
      goTo(n)
    },
    togglePlay: () => {
      if (playing) {
        setPlaying(false)
        return
      }
      if (step >= last) setStep(0) // play again from the start
      setPlaying(true)
    },
    playFromStart: () => {
      setStep(0)
      setPlaying(true)
    },
    setSpeed,
  }
}
