import {haptics} from '@hzblj/expo-rich-haptics'
import {Box, RnIcon, RnText, spring, useAppTheme, useReducedMotion} from '@hzblj/kara-ui'
import {useCallback, useEffect, useState} from 'react'
import type {LayoutChangeEvent} from 'react-native'
import {Gesture, GestureDetector} from 'react-native-gesture-handler'
import Animated, {interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming} from 'react-native-reanimated'
import {scheduleOnRN} from 'react-native-worklets'

import {CodeBlock, Section} from '../ui'

const TRACK = 64
const KNOB = 52
const INSET = (TRACK - KNOB) / 2
/** How far along the knob has to be for a release to confirm. */
const THRESHOLD = 0.8
/** How long the confirmed state stays before the control resets. */
const DONE_MS = 1600
/** Screen readers can't slide: activating the knob pays at once. */
const ACCESSIBILITY_ACTIONS = [{name: 'activate'}]
/** Built on the JS thread: the gesture's worklets can read a config, not call kara's `spring`. */
const SETTLE = spring('smooth')

/**
 * Slide to pay: the knob follows the finger, the haptic marks the commit point both ways, and a release past it
 * confirms with success. The finger drives it, so it moves with motion reduced too; only the settle afterwards jumps.
 */
export const SlideToConfirm = () => {
  const theme = useAppTheme()
  const reducedMotion = useReducedMotion()
  const [confirmed, setConfirmed] = useState(false)
  const travel = useSharedValue(0)
  const offset = useSharedValue(0)
  const armed = useSharedValue(false)

  const settle = useCallback(
    (to: number) => {
      'worklet'
      offset.value = reducedMotion ? withTiming(to, {duration: 0}) : withSpring(to, SETTLE)
    },
    [offset, reducedMotion]
  )

  const confirm = () => {
    haptics.success()
    setConfirmed(true)
  }

  useEffect(() => {
    if (!confirmed) {
      return
    }

    const timer = setTimeout(() => {
      setConfirmed(false)
      armed.value = false
      settle(0)
    }, DONE_MS)

    return () => clearTimeout(timer)
  }, [armed, confirmed, settle])

  // Horizontal only: a mostly vertical drag is left to the page's scroll view.
  const pan = Gesture.Pan()
    .enabled(!confirmed)
    .activeOffsetX([-8, 8])
    .failOffsetY([-16, 16])
    .onBegin(() => {
      scheduleOnRN(haptics.prepare, 'thresholdActivate')
    })
    .onUpdate(event => {
      const position = Math.min(Math.max(event.translationX, 0), travel.value)
      const past = travel.value > 0 && position >= travel.value * THRESHOLD

      offset.value = position

      if (past !== armed.value) {
        armed.value = past
        scheduleOnRN(past ? haptics.thresholdActivate : haptics.thresholdDeactivate)
      }
    })
    // Finalize rather than end: a drag the scroll view took over still settles.
    .onFinalize(() => {
      if (armed.value) {
        settle(travel.value)
        scheduleOnRN(confirm)
      } else {
        settle(0)
      }
    })

  const knob = useAnimatedStyle(() => ({transform: [{translateX: offset.value}]}))
  const label = useAnimatedStyle(() => ({
    opacity: travel.value > 0 ? interpolate(offset.value, [0, travel.value * THRESHOLD], [1, 0], 'clamp') : 1,
  }))

  const measure = (event: LayoutChangeEvent) => {
    travel.value = Math.max(0, event.nativeEvent.layout.width - KNOB - INSET * 2)
  }

  return (
    <Section
      caption="thresholdActivate as the knob passes the commit point, thresholdDeactivate if it slides back, success once it lets go past it. On iOS, haptics.prepare warms the Taptic Engine as the finger lands."
      title="Slide to pay"
    >
      <Box
        bg={confirmed ? 'fill.success.base' : 'fill.tertiary'}
        animate
        borderRadius="full"
        h={TRACK}
        justify="center"
        onLayout={measure}
      >
        <Animated.View pointerEvents="none" style={[{alignItems: 'center', paddingLeft: KNOB}, label]}>
          <RnText color="content.secondary" variant="subheadlineMedium">
            Slide to pay
          </RnText>
        </Animated.View>
        {confirmed ? (
          <Box absolute align="center" justify="center" pointerEvents="none">
            <RnText color="content.success" variant="subheadlineMedium">
              Paid
            </RnText>
          </Box>
        ) : null}
        <GestureDetector gesture={pan}>
          <Animated.View
            accessibilityActions={ACCESSIBILITY_ACTIONS}
            accessibilityHint="Slide to the end to pay"
            accessibilityLabel="Slide to pay"
            accessibilityRole="button"
            accessible
            onAccessibilityAction={() => {
              if (!confirmed) {
                settle(travel.value)
                confirm()
              }
            }}
            style={[
              {
                alignItems: 'center',
                backgroundColor: theme.color(confirmed ? 'fill.success.primary' : 'fill.accent.primary'),
                borderRadius: KNOB / 2,
                height: KNOB,
                justifyContent: 'center',
                left: INSET,
                position: 'absolute',
                width: KNOB,
              },
              knob,
            ]}
          >
            <RnIcon color="content.on.accent" name={confirmed ? 'check' : 'arrow-forward'} size="s24" />
          </Animated.View>
        </GestureDetector>
      </Box>
      <CodeBlock
        code={
          "// The finger lands\nhaptics.prepare('thresholdActivate')\n\n// Past the commit point, and back\nhaptics.thresholdActivate()\nhaptics.thresholdDeactivate()\n\n// Let go past it\nhaptics.success()"
        }
      />
    </Section>
  )
}
