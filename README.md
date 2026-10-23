# @hzblj/expo-rich-haptics

[![npm](https://img.shields.io/npm/v/@hzblj/expo-rich-haptics.svg)](https://www.npmjs.com/package/@hzblj/expo-rich-haptics)
[![license](https://img.shields.io/npm/l/@hzblj/expo-rich-haptics.svg)](https://github.com/hzblj/expo-rich-haptics/blob/main/LICENSE)

Haptics for Expo that feel like the platform. Name what happened and each platform plays its own feedback for it, or compose a pattern of your own from Android's haptic primitives, which iOS plays through Core Haptics.

- iOS: UIKit's feedback generators for names, Core Haptics for patterns
- Android: the system's haptic feedback constants for names, composition primitives for patterns, never a vibrator buzz
- Names for what happened (`selection`, `toggleOn`, `thresholdActivate`...), with Android 14's constants and fallbacks for every older version
- `intensity` on both platforms
- Synchronous calls, nothing to await
- `useHapticFeedback()`, a hook in the spirit of SwiftUI's `sensoryFeedback`
- One switch for an app's own Haptics setting

## Install

```sh
npx expo install @hzblj/expo-rich-haptics
```

Requires Expo SDK 57 or newer and a [development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go doesn't include this native module, so haptics stay silent there.

## Usage

```ts
import {haptics, useHapticFeedback} from '@hzblj/expo-rich-haptics'

haptics.success()                    // a name you know: one function per haptic
haptics.play(haptic)                 // a name that arrives as data
haptics.light({intensity: 0.6})      // impacts scale
haptics.prepare('selection')         // iOS: warm the Taptic Engine as a gesture begins
haptics.setEnabled(userPreference)   // the app's own Haptics setting

// Plays on every change of a value, never on mount.
useHapticFeedback(selectedTab, 'selection')
useHapticFeedback(quantity, (previous, next) => (next > previous ? 'tick' : 'soft'))
```

`setEnabled` is not persisted: call it at start-up with the stored preference.

## Haptics

| Name | For |
| --- | --- |
| `selection` | A choice changed: a segment, a chip, a picker row. |
| `tick` | One step of a continuous gesture: a slider detent, a scrubbed value. |
| `toggleOn`, `toggleOff` | A switch flipped. |
| `success`, `warning`, `error` | How a task ended. |
| `longPress`, `dragStart` | A long press was recognised; an item lifted to be dragged. |
| `thresholdActivate`, `thresholdDeactivate` | A gesture crossed its commit point, or went back over it. |
| `keyPress` | A key of the app's own keypad. |
| `soft`, `light`, `medium`, `rigid`, `heavy` | A collision none of the names above describes. `intensity` scales them. |

`HAPTICS` lists every name.

## Patterns

A pattern is a list of events on one timeline. Each event is a primitive, the time it starts in milliseconds and its intensity from 0 to 1.

```ts
import {type HapticPattern, haptics} from '@hzblj/expo-rich-haptics'

const heartbeat: HapticPattern = [
  {primitive: 'thud'},
  {at: 140, intensity: 0.6, primitive: 'thud'},
]

const charge: HapticPattern = [
  {primitive: 'slowRise'},
  {at: 500, primitive: 'click'},
]

haptics.play(heartbeat)
haptics.play(heartbeat, {intensity: 0.5})   // scales every event
haptics.prepare(heartbeat)                  // iOS: start the haptic engine ahead of it
```

| Primitive | Feels like |
| --- | --- |
| `click` | A crisp click. |
| `tick` | A tiny, sharp tick. |
| `lowTick` | A tick with a lower, duller feel. |
| `thud` | A heavy knock that falls away. |
| `spin` | A short whirl that swells and fades. |
| `quickRise`, `slowRise` | A rise to full strength, in about 150 or 500 ms. |
| `quickFall` | A fall from full strength, in about 100 ms. |

`at` defaults to 0 and `intensity` to 1. Events can come in any order. Events without intensity are dropped, so an empty pattern plays nothing. `HAPTIC_PRIMITIVES` lists every primitive.

The primitives are Android's own, and each Android device plays them as its manufacturer tuned them. iOS builds each one from Core Haptics events and curves, and plays every event on its own player, so events can overlap.

## Platform behavior

### iOS

- Names play through `UISelectionFeedbackGenerator`, `UIImpactFeedbackGenerator` and `UINotificationFeedbackGenerator`, one generator per kind for the app's lifetime. They follow the System Haptics setting.
- Patterns play through one `CHHapticEngine` that plays haptics only, with no audio session, and shuts the hardware down when idle.
- Hardware without a Taptic Engine (iPad, the simulator) plays nothing.

### Android

- Names play through `View.performHapticFeedback` on the current activity's window. Android 14 added constants that say what happened (`TOGGLE_ON`, `SEGMENT_TICK`, `GESTURE_THRESHOLD_ACTIVATE`...). An older OS, or a device that doesn't implement one, plays the nearest older constant instead. Every name plays on every version.
- Patterns play as one `VibrationEffect.Composition` of primitives on Android 11 and newer, with touch feedback attributes, so they follow the user's touch feedback setting. A primitive the device lacks is replaced by the nearest one it has (`lowTick` by `tick`, `thud` by `click`...). Before Android 16 a primitive that should start while the previous one still plays waits for it to finish.
- A device without primitives (or Android 10 and older) plays each event of a pattern as the nearest system haptic, at its time.
- `warning` plays two clicks, the second softer, where the device has primitives. Android has no warning constant, so elsewhere it plays the same rejection as `error`.
- An impact given an `intensity` plays as a scaled primitive where the device has them. Without one, it plays the system constant.
- Nothing ever plays as a vibrator waveform. The package declares the `VIBRATE` permission that compositions need. It is a normal permission, granted at install without a prompt.
- Nothing plays while the app has no activity in the foreground.

Haptics are felt, not seen: the simulator and the emulator play nothing. Check them on a device.

## License

MIT © Jan Blazej
