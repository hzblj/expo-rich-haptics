# @hzblj/expo-rich-haptics

Haptics that feel like the platform: the JavaScript API (`src/` → `build/`) and the `ExpoRichHaptics` module (`ios/`,
`android/`). No config plugin. Built for `@hzblj/kara-ui` (`../kara-ui`), whose components play through it, but
nothing here may know about kara.

| Path | What it is |
| --- | --- |
| `src/names.ts` | `HAPTICS` and `HAPTIC_PRIMITIVES`, the names the native enums accept, exactly. |
| `src/haptics.ts` | `haptics`: `play`, `prepare`, `setEnabled`, `isEnabled` and one shorthand per name. Synchronous, silent without the module (Expo Go, Jest). |
| `src/pattern.ts` | `HapticPattern`, `normalizePattern` (defaults, clamping, `intensity` scaling, sorting, silent events dropped) and `clampIntensity`. Pure, so `test/` runs it in Node. |
| `src/useHapticFeedback.ts` | Plays on every change of a trigger (`Object.is`), never on mount: a feedback, or a resolver of the previous and next value. |
| `ios/Haptic.swift`, `ios/ExpoRichHapticsModule.swift` | A name → UIKit generator (`FeedbackGenerators`, one per kind for the app's lifetime), on the main queue. |
| `ios/HapticPrimitive.swift`, `ios/PatternPlayer.swift` | Each primitive built from Core Haptics events and curves; one `CHHapticEngine`, haptics only, on its own queue, every event on its own player. |
| `android/.../Haptic.kt`, `HapticPrimitive.kt` | A name → a chain of `HapticFeedbackConstants` (Android 14's first, older ones after), or a composition; a primitive → its substitute and its system fallback. |
| `android/.../HapticPlayer.kt` | `performHapticFeedback` on the activity's decor view, or one `VibrationEffect.Composition` with touch attributes. |

**The names exist three times.** `src/names.ts`, `ios/Haptic.swift` + `ios/HapticPrimitive.swift` and the Kotlin enums
must list the same strings: a name JS sends that native does not know fails the argument conversion. Add one in all
three, with its fallbacks on Android.

**Never a vibrator waveform.** An unsupported haptic degrades to an older `HapticFeedbackConstants` value, a substitute
primitive or nothing, never to `Vibrator.vibrate` with timings or amplitudes: they ignore the user's touch feedback
setting and feel cheap. The `VIBRATE` permission in the manifest is for compositions only.

**Synchronous by design.** Every function returns at once and the feedback plays on the next main-queue turn (the
pattern engine on its own queue). No promises: a haptic that arrives late is worse than one that does not arrive.

**Optional members on the module type.** `ExpoRichHapticsModule.ts` declares each function optional, so a JS bundle
newer than the native build it runs on (an OTA update) finds a function missing instead of crashing.

**Tests.** `yarn test` (node:test over `test/`, the pattern normalization). The native side has no unit tests: the
simulator and the emulator play nothing, so the example on a device is the check.

Code style follows `@hzblj/biome-config`. Docs copy (README, JSDoc, changesets) has no em dashes.
