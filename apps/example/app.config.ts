import type {ExpoConfig} from 'expo/config'

// Not "Expo Rich Haptics": the generated Xcode target would be `ExpoRichHaptics`, the Swift module of the package.
const NAME = 'Haptics Example'
const BUNDLE_ID = 'com.hzblj.exporichhaptics.example'

export default {
  android: {
    package: BUNDLE_ID,
  },
  experiments: {
    typedRoutes: true,
  },
  ios: {
    bundleIdentifier: BUNDLE_ID,
    supportsTablet: true,
  },
  name: NAME,
  orientation: 'portrait',
  plugins: [
    'expo-router',
    // The example's icons (Material Symbols): every SVG in assets/icons becomes a native asset on both platforms, and
    // its name a type in native-icons.d.ts.
    ['@hzblj/kara-ui', {icons: {source: './assets/icons'}}],
  ],
  scheme: 'rich-haptics-example',
  slug: 'expo-rich-haptics-example',
  userInterfaceStyle: 'automatic',
  version: '1.0.0',
} satisfies ExpoConfig
