# expo-rich-haptics

[![npm](https://img.shields.io/npm/v/@hzblj/expo-rich-haptics.svg)](https://www.npmjs.com/package/@hzblj/expo-rich-haptics)
[![license](https://img.shields.io/npm/l/@hzblj/expo-rich-haptics.svg)](./LICENSE)

Haptics for Expo that feel like the platform. Name what happened and each platform plays its own feedback for it, or compose a pattern of your own from Android's haptic primitives, which iOS plays through Core Haptics. Never a vibrator buzz.

```sh
npx expo install @hzblj/expo-rich-haptics
```

```ts
import {haptics, useHapticFeedback} from '@hzblj/expo-rich-haptics'

haptics.success()
haptics.play([{primitive: 'thud'}, {at: 140, intensity: 0.6, primitive: 'thud'}])

useHapticFeedback(selectedTab, 'selection')
```

**[Documentation](./packages/expo-rich-haptics/README.md)**: every haptic, patterns and primitives, the hook and platform behavior.

## This repository

| Path | What lives there |
| --- | --- |
| `packages/expo-rich-haptics/` | `@hzblj/expo-rich-haptics`, the published package: the JavaScript API and the iOS and Android module |
| `apps/example/` | The example app: every haptic by name, the primitives, preset patterns and a pattern composer, and controls of an app's own wired with `useHapticFeedback` |

```sh
yarn                 # install
yarn prebuild        # a clean `expo prebuild` of the example
yarn ios             # run the example on iOS (dev client); `yarn android` for Android
yarn start           # Metro for the example
yarn test            # the JavaScript tests
yarn lint            # Biome and TypeScript
yarn pack:check      # pack the package as npm gets it and type-check a consumer
yarn changeset       # describe a change for the next release
```

Haptics are felt, not seen: the simulator and the emulator play nothing, so run the example on a device.

## License

MIT © Jan Blazej
