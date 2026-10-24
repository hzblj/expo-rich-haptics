import {Lead, Page} from '../ui'
import {Counter} from './counter'
import {Keypad} from './keypad'
import {Rating} from './rating'
import {SlideToConfirm} from './slide-to-confirm'

/** The haptics in controls of the app's own: `useHapticFeedback` for values, `haptics.*` for gestures. */
export const InUseScreen = () => (
  <Page>
    <Lead>
      Controls an app builds itself, from kara’s Pressable and a gesture. useHapticFeedback plays on every change of a
      value, never on mount, like SwiftUI’s sensoryFeedback.
    </Lead>
    <SlideToConfirm />
    <Counter />
    <Rating />
    <Keypad />
  </Page>
)
