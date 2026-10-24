import type {HapticPattern, HapticPrimitive} from '@hzblj/expo-rich-haptics'

export type Preset = {
  description: string
  name: string
  pattern: HapticPattern
}

/** Patterns to try, each from the primitives alone. */
export const PRESETS: Preset[] = [
  {
    description: 'A thud, then a softer one 140 ms later.',
    name: 'Heartbeat',
    pattern: [{primitive: 'thud'}, {at: 140, intensity: 0.6, primitive: 'thud'}],
  },
  {
    description: 'A slow rise that lands on a click.',
    name: 'Charge',
    pattern: [{primitive: 'slowRise'}, {at: 500, primitive: 'click'}],
  },
  {
    description: 'Two clicks, the way a knuckle taps a door.',
    name: 'Knock',
    pattern: [{primitive: 'click'}, {at: 120, intensity: 0.8, primitive: 'click'}],
  },
  {
    description: 'Three whirls, each one fainter.',
    name: 'Purr',
    pattern: [
      {primitive: 'spin'},
      {at: 170, intensity: 0.6, primitive: 'spin'},
      {at: 340, intensity: 0.3, primitive: 'spin'},
    ],
  },
  {
    description: 'Three ticks and a thud on the fourth beat.',
    name: 'Countdown',
    pattern: [
      {intensity: 0.6, primitive: 'tick'},
      {at: 250, intensity: 0.6, primitive: 'tick'},
      {at: 500, intensity: 0.6, primitive: 'tick'},
      {at: 750, primitive: 'thud'},
    ],
  },
  {
    description: 'A ball dropped on a table, settling.',
    name: 'Bounce',
    pattern: [
      {primitive: 'thud'},
      {at: 200, intensity: 0.6, primitive: 'thud'},
      {at: 330, intensity: 0.35, primitive: 'lowTick'},
      {at: 410, intensity: 0.2, primitive: 'lowTick'},
    ],
  },
]

/** What each primitive feels like, in the README's words. */
export const PRIMITIVE_DESCRIPTIONS: Record<HapticPrimitive, string> = {
  click: 'A crisp click.',
  lowTick: 'A tick with a lower, duller feel.',
  quickFall: 'A fall from full strength, in about 100 ms.',
  quickRise: 'A rise to full strength, in about 150 ms.',
  slowRise: 'The same rise, over about 500 ms.',
  spin: 'A short whirl that swells and fades.',
  thud: 'A heavy knock that falls away.',
  tick: 'A tiny, sharp tick.',
}

/** Past this many characters an event breaks onto a line per field, so the snippet fits a phone's width. */
const LINE = 40

/** A pattern as the code that plays it, keys sorted the way the README writes them. */
export const patternCode = (pattern: HapticPattern) => {
  const events = pattern.map(({at, intensity, primitive}) => {
    const fields = [
      ...(at ? [`at: ${at}`] : []),
      ...(intensity !== undefined && intensity !== 1 ? [`intensity: ${intensity}`] : []),
      `primitive: '${primitive}'`,
    ]
    const line = `  {${fields.join(', ')}},`

    return line.length <= LINE ? line : `  {\n${fields.map(field => `    ${field},`).join('\n')}\n  },`
  })

  return events.length > 0 ? `haptics.play([\n${events.join('\n')}\n])` : 'haptics.play([])'
}
