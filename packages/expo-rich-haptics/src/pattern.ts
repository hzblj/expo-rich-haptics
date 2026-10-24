import type {HapticPrimitive} from './names'

export type HapticEvent = {
  /**
   * What plays: `click`, `tick`, `lowTick` and `thud` are taps; `spin`, `quickRise`, `slowRise` and `quickFall` have a
   * shape over time.
   */
  primitive: HapticPrimitive
  /** When it starts, in milliseconds from the start of the pattern. `0` by default. */
  at?: number
  /** How strong it is, from 0 to 1. `1` by default. */
  intensity?: number
}

/** Events on one timeline, in any order. An empty pattern, or one whose every event has no intensity, plays nothing. */
export type HapticPattern = readonly HapticEvent[]

/** An event as the native module takes it: every field set, in range, in order. */
export type NativeHapticEvent = Required<HapticEvent>

export const clampIntensity = (value: number): number => Math.min(Math.max(value, 0), 1)

/**
 * Sets every field, clamps intensities to 0 to 1 and scales them by `scale`, rounds start times to whole
 * milliseconds no earlier than 0, drops silent events and sorts the rest by start time (events that start together
 * keep their order). Non-finite numbers fall back to the defaults.
 */
export const normalizePattern = (pattern: HapticPattern, scale?: number): NativeHapticEvent[] => {
  const factor = scale !== undefined && Number.isFinite(scale) ? clampIntensity(scale) : 1

  return pattern
    .map(({at, intensity, primitive}) => ({
      at: at !== undefined && Number.isFinite(at) ? Math.max(0, Math.round(at)) : 0,
      intensity: clampIntensity(intensity !== undefined && Number.isFinite(intensity) ? intensity : 1) * factor,
      primitive,
    }))
    .filter(event => event.intensity > 0)
    .sort((a, b) => a.at - b.at)
}
