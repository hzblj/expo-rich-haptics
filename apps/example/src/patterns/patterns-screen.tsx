import {HAPTIC_PRIMITIVES, haptics} from '@hzblj/expo-rich-haptics'

import {Grid, Lead, Page, Section, Tile} from '../ui'
import {Composer} from './composer'
import {PresetCard} from './preset-card'
import {PRESETS, PRIMITIVE_DESCRIPTIONS} from './presets'

/** Patterns: presets, every primitive on its own, and one of your own. */
export const PatternsScreen = () => (
  <Page>
    <Lead>
      A pattern is a list of primitives on one timeline. Android plays them as its own composition primitives, tuned by
      each manufacturer; iOS builds each one from Core Haptics events and curves.
    </Lead>
    <Section title="Presets">
      {PRESETS.map(preset => (
        <PresetCard key={preset.name} preset={preset} />
      ))}
    </Section>
    <Section
      caption="A primitive the device lacks plays as the nearest one it has: lowTick as tick, thud as click. Without primitives (Android 10 and older), each event plays as the nearest system haptic."
      title="Primitives"
    >
      <Grid
        items={HAPTIC_PRIMITIVES}
        keyOf={primitive => primitive}
        render={primitive => (
          <Tile
            description={PRIMITIVE_DESCRIPTIONS[primitive]}
            onPress={() => haptics.play([{primitive}])}
            title={primitive}
          />
        )}
      />
    </Section>
    <Composer />
  </Page>
)
