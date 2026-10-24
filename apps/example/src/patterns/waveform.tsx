import type {HapticPattern, HapticPrimitive} from '@hzblj/expo-rich-haptics'
import {Box, curve, timing, useAppTheme, useReducedMotion} from '@hzblj/kara-ui'
import {type Ref, useImperativeHandle, useMemo} from 'react'
import Animated, {
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated'

/**
 * Roughly how each primitive feels over time, to draw it: how long it lasts and its strength along the way (0 to 1
 * of its length in, 0 to 1 out). A sketch of the feel, not a measurement: each device plays its own.
 */
const SHAPES: Record<HapticPrimitive, {envelope: (t: number) => number; length: number}> = {
  click: {envelope: () => 1, length: 24},
  lowTick: {envelope: () => 0.45, length: 24},
  quickFall: {envelope: t => 1 - t, length: 100},
  quickRise: {envelope: t => t, length: 150},
  slowRise: {envelope: t => t, length: 500},
  spin: {envelope: t => Math.sin(Math.PI * t), length: 160},
  thud: {envelope: t => (1 - t) ** 2, length: 90},
  tick: {envelope: () => 0.6, length: 16},
}

const BARS = 44
const HEIGHT = 44
const MIN_BAR = 4
const IDLE_OPACITY = 0.28
/** How long the bars stay lit once the pattern has played. They fade back over `slow` (400 ms). */
const HOLD_MS = 150
const FADE_MS = 400

/** How long a pattern plays, by the sketch: the end of its last event. */
const lengthOf = (pattern: HapticPattern) =>
  Math.max(1, ...pattern.map(({at = 0, primitive}) => at + SHAPES[primitive].length))

/** The pattern sampled into bars: each bar takes the strongest event that overlaps its slice of time. */
const sample = (pattern: HapticPattern) => {
  const total = lengthOf(pattern)
  const slice = total / BARS

  return Array.from({length: BARS}, (_, index) => {
    const start = index * slice
    const end = start + slice
    let amplitude = 0

    for (const {at = 0, intensity = 1, primitive} of pattern) {
      const {envelope, length} = SHAPES[primitive]

      if (at < end && at + length > start) {
        const middle = Math.min(Math.max((start + end) / 2, at), at + length)
        amplitude = Math.max(amplitude, Math.min(Math.max(intensity, 0), 1) * envelope((middle - at) / length))
      }
    }

    return amplitude
  })
}

type BarProps = {
  color: string
  fade: SharedValue<number>
  height: number
  position: number
  progress: SharedValue<number>
}

const Bar = ({color, fade, height, position, progress}: BarProps) => {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value >= position ? IDLE_OPACITY + (1 - IDLE_OPACITY) * fade.value : IDLE_OPACITY,
  }))

  return <Animated.View style={[{backgroundColor: color, borderRadius: 2, height, width: 3}, style]} />
}

export type WaveformHandle = {
  /** Lights the bars along the pattern as it plays, then lets them fade back. */
  play: () => void
}

/**
 * A pattern drawn as the bars of a waveform, one slice of time each. `play()` lights them from left to right in time
 * with the haptic; with motion reduced they light all at once instead.
 */
export const Waveform = ({pattern, ref}: {pattern: HapticPattern; ref?: Ref<WaveformHandle>}) => {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const color = theme.colorString('fill.accent.primary')
  const bars = useMemo(() => sample(pattern), [pattern])
  const progress = useSharedValue(-1)
  const fade = useSharedValue(1)

  useImperativeHandle(
    ref,
    () => ({
      play: () => {
        const total = lengthOf(pattern)
        const lit = total + HOLD_MS

        fade.value = 1
        progress.value = reducedMotion ? 1 : 0
        progress.value = withSequence(
          withTiming(1, {duration: reducedMotion ? 0 : total, easing: curve('linear')}),
          withDelay(lit + FADE_MS - (reducedMotion ? 0 : total), withTiming(-1, {duration: 0}))
        )
        // Back to full only once the bars are idle again, so none of them flashes on the way.
        fade.value = withSequence(
          withDelay(lit, withTiming(0, timing('slow', 'out'))),
          withDelay(50, withTiming(1, {duration: 0}))
        )
      },
    }),
    [fade, pattern, progress, reducedMotion]
  )

  return (
    <Box align="center" row h={HEIGHT} justify="space-between">
      {bars.map((amplitude, index) => (
        <Bar
          color={color}
          fade={fade}
          height={MIN_BAR + amplitude * (HEIGHT - MIN_BAR)}
          key={index}
          position={(index + 0.5) / BARS}
          progress={progress}
        />
      ))}
    </Box>
  )
}
