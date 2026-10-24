import {Platform} from 'react-native'

import {ExpoRichHaptics} from './ExpoRichHapticsModule'
import {HAPTICS, type Haptic} from './names'
import {clampIntensity, type HapticPattern, normalizePattern} from './pattern'

/** A haptic by name, or a pattern of your own. */
export type HapticFeedback = Haptic | HapticPattern

export type HapticOptions = {
  /**
   * Scales the feedback, from 0 to 1: every event of a pattern, or an impact (`soft`, `light`, `medium`, `rigid`,
   * `heavy`). The other names have a fixed strength and ignore it.
   */
  intensity?: number
}

type HapticShorthands = {readonly [K in Haptic]: (options?: HapticOptions) => void}

let enabled = true

const play = (feedback: HapticFeedback, options?: HapticOptions): void => {
  if (!enabled || ExpoRichHaptics === null) {
    return
  }

  if (typeof feedback === 'string') {
    const intensity = options?.intensity
    ExpoRichHaptics.play?.(
      feedback,
      intensity !== undefined && Number.isFinite(intensity) ? clampIntensity(intensity) : null
    )
    return
  }

  const events = normalizePattern(feedback, options?.intensity)

  if (events.length > 0) {
    ExpoRichHaptics.playPattern?.(events)
  }
}

const prepare = (feedback: HapticFeedback): void => {
  if (!enabled || Platform.OS !== 'ios' || ExpoRichHaptics === null) {
    return
  }

  if (typeof feedback === 'string') {
    ExpoRichHaptics.prepare?.(feedback)
  } else {
    ExpoRichHaptics.preparePattern?.()
  }
}

const shorthands = Object.fromEntries(
  HAPTICS.map(haptic => [haptic, (options?: HapticOptions) => play(haptic, options)])
) as HapticShorthands

/**
 * Haptics that feel like the platform. A name plays the system's own feedback (UIKit's feedback generators on iOS,
 * `HapticFeedbackConstants` on Android); a pattern plays Android's composition primitives, which iOS builds with
 * Core Haptics. Never a raw vibration, and every call is synchronous, with nothing to await.
 *
 * ```ts
 * haptics.success()                    // a name you know: one function per haptic
 * haptics.play(haptic)                 // a name that arrives as data
 * haptics.light({intensity: 0.6})      // impacts scale
 * haptics.play([                       // a pattern of your own
 *   {primitive: 'thud'},
 *   {at: 140, intensity: 0.6, primitive: 'thud'},
 * ])
 * haptics.prepare('selection')         // iOS: warm the Taptic Engine as a gesture begins
 * haptics.setEnabled(userPreference)   // the app's own Haptics setting
 * ```
 *
 * Haptics are silent where the build does not include the native module (Expo Go, Jest).
 */
export const haptics = {
  ...shorthands,
  /** Whether haptics play: `true` until `setEnabled(false)`. */
  isEnabled: (): boolean => enabled,
  /** Plays a haptic by name or a pattern, at once. */
  play,
  /**
   * iOS: readies the hardware to play `feedback` within the next few seconds. Call it when the gesture that will
   * play it begins. Android has nothing to warm up.
   */
  prepare,
  /**
   * Switches every haptic played through this package on or off, for an app's own "Haptics" setting. Not persisted:
   * call it at start-up with the stored preference.
   */
  setEnabled: (value: boolean): void => {
    enabled = value
  },
}
