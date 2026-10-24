import type {Haptic} from '@hzblj/expo-rich-haptics'

export type HapticEntry = {
  description: string
  name: Haptic
}

export type HapticGroup = {
  /** Where the platforms differ, under the group. */
  caption?: string
  entries: HapticEntry[]
  title: string
}

/** Every name the package plays, grouped by what happened, in the README's words. */
export const GROUPS: HapticGroup[] = [
  {
    caption:
      'iOS plays UISelectionFeedbackGenerator for both. Android 14 has SEGMENT_TICK and SEGMENT_FREQUENT_TICK; older versions play the nearest constant they have.',
    entries: [
      {description: 'A choice changed: a segment, a chip, a picker row.', name: 'selection'},
      {description: 'One step of a continuous gesture, like a slider detent.', name: 'tick'},
    ],
    title: 'Selection',
  },
  {
    entries: [
      {description: 'A switch turned on.', name: 'toggleOn'},
      {description: 'A switch turned off.', name: 'toggleOff'},
    ],
    title: 'Toggles',
  },
  {
    caption:
      'Android has no warning constant: it plays two clicks, the second softer, where the device has primitives, and the same rejection as error elsewhere.',
    entries: [
      {description: 'A task finished as hoped.', name: 'success'},
      {description: 'It finished, with something to check.', name: 'warning'},
      {description: 'A task failed.', name: 'error'},
    ],
    title: 'Outcomes',
  },
  {
    entries: [
      {description: 'A long press was recognised.', name: 'longPress'},
      {description: 'An item lifted to be dragged.', name: 'dragStart'},
      {description: 'A gesture crossed its commit point.', name: 'thresholdActivate'},
      {description: 'It went back over the commit point.', name: 'thresholdDeactivate'},
      {description: 'A key of the app’s own keypad.', name: 'keyPress'},
    ],
    title: 'Gestures',
  },
]

/** The collisions none of the names describes: the only haptics `intensity` scales. */
export const IMPACTS: HapticEntry[] = [
  {description: 'A soft, dull collision.', name: 'soft'},
  {description: 'A small, light one.', name: 'light'},
  {description: 'A moderate one.', name: 'medium'},
  {description: 'A hard, crisp one.', name: 'rigid'},
  {description: 'A big, heavy one.', name: 'heavy'},
]
