/**
 * Every haptic by name, named for what happened rather than how it feels. `ios/Haptic.swift` and
 * `android/.../Haptic.kt` accept exactly these and map each to the platform's own feedback.
 */
export const HAPTICS = [
  'selection',
  'tick',
  'soft',
  'light',
  'medium',
  'rigid',
  'heavy',
  'success',
  'warning',
  'error',
  'toggleOn',
  'toggleOff',
  'longPress',
  'dragStart',
  'thresholdActivate',
  'thresholdDeactivate',
  'keyPress',
] as const

export type Haptic = (typeof HAPTICS)[number]

/**
 * The primitives a pattern is made of: Android's own composition primitives, which iOS builds from Core Haptics
 * events. `ios/HapticPrimitive.swift` and `android/.../HapticPrimitive.kt` accept exactly these.
 */
export const HAPTIC_PRIMITIVES = [
  'click',
  'tick',
  'lowTick',
  'thud',
  'spin',
  'quickRise',
  'slowRise',
  'quickFall',
] as const

export type HapticPrimitive = (typeof HAPTIC_PRIMITIVES)[number]
