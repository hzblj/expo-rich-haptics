import {NativeModule, requireOptionalNativeModule} from 'expo'

import type {Haptic} from './names'
import type {NativeHapticEvent} from './pattern'

// Optional members: a JS bundle newer than the native build it runs on (an OTA update) finds the module without them.
declare class ExpoRichHapticsNativeModule extends NativeModule {
  play?(haptic: Haptic, intensity: number | null): void
  playPattern?(events: NativeHapticEvent[]): void
  prepare?(haptic: Haptic): void
  preparePattern?(): void
}

export const ExpoRichHaptics = requireOptionalNativeModule<ExpoRichHapticsNativeModule>('ExpoRichHaptics')
