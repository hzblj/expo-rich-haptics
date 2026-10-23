import {useEffect, useRef} from 'react'

import {type HapticFeedback, haptics} from './haptics'

/** Picks the feedback for one change of a trigger, or none to stay silent for that change. */
export type HapticResolver<T> = (previous: T, next: T) => HapticFeedback | false | null | undefined

/**
 * Plays feedback whenever `trigger` changes, never on mount, like SwiftUI's `sensoryFeedback(_:trigger:)`. Give it a
 * haptic or a pattern, or a function of the previous and next value that picks one per change. Changes are compared
 * with `Object.is`, so a trigger is a primitive or a stable reference.
 *
 * ```ts
 * useHapticFeedback(tab, 'selection')
 * useHapticFeedback(quantity, (before, after) => (after > before ? 'tick' : 'soft'))
 * useHapticFeedback(payment.status, (_, status) => (status === 'paid' ? 'success' : status === 'failed' && 'error'))
 * ```
 */
export const useHapticFeedback = <T>(trigger: T, feedback: HapticFeedback | HapticResolver<T>): void => {
  const previous = useRef(trigger)

  useEffect(() => {
    const before = previous.current

    if (Object.is(before, trigger)) {
      return
    }

    previous.current = trigger
    const next = typeof feedback === 'function' ? feedback(before, trigger) : feedback

    if (next) {
      haptics.play(next)
    }
  }, [feedback, trigger])
}
