import {haptics} from '@hzblj/expo-rich-haptics'
import {HStack, Island, Slider, Spacer, Switch, Text, VStack} from '@hzblj/kara-ui'
import {useState} from 'react'

import {DeviceNotice, Grid, Lead, Page, Section, Tile} from '../ui'
import {GROUPS, IMPACTS} from './haptics'

const formatIntensity = (value: number) => value.toFixed(1)

/** The app's own Haptics setting: `setEnabled` silences the package, kara's controls included. */
const EnabledSetting = () => {
  const [enabled, setEnabled] = useState(haptics.isEnabled)

  return (
    <Section caption="haptics.setEnabled(false) silences every haptic the package plays, kara’s own controls included. It is not persisted: an app calls it at start-up with the stored preference.">
      <Island>
        <VStack bg="surface.primary" borderRadius="large" px="s16" py="s12" wide>
          <Switch
            label="Play haptics"
            onValueChange={value => {
              haptics.setEnabled(value)
              setEnabled(value)
            }}
            value={enabled}
          />
        </VStack>
      </Island>
    </Section>
  )
}

const Impacts = () => {
  const [intensity, setIntensity] = useState(1)
  const options = intensity < 1 ? `{intensity: ${formatIntensity(intensity)}}` : ''

  return (
    <Section
      caption="Impacts are the only names intensity scales. On Android a scaled impact plays as a primitive where the device has them, and as the system constant where it does not."
      title="Impacts"
    >
      <Island>
        <VStack bg="surface.primary" borderRadius="large" p="s16" spacing="s8" wide>
          <HStack wide>
            <Text variant="subheadlineMedium">Intensity</Text>
            <Spacer />
            <Text color="content.secondary" variant="subheadline">
              {formatIntensity(intensity)}
            </Text>
          </HStack>
          <Slider onValueChange={setIntensity} value={intensity} />
        </VStack>
      </Island>
      <Grid
        items={IMPACTS}
        keyOf={entry => entry.name}
        render={entry => (
          <Tile
            code={`haptics.${entry.name}(${options})`}
            description={entry.description}
            onPress={() => haptics.play(entry.name, {intensity})}
            title={entry.name}
          />
        )}
      />
    </Section>
  )
}

/** Every haptic by name, one tile each. */
export const FeedbackScreen = () => (
  <Page>
    <Lead>
      Name what happened and each platform plays its own feedback for it: UIKit’s feedback generators on iOS, the
      system’s haptic constants on Android.
    </Lead>
    <DeviceNotice />
    <EnabledSetting />
    {GROUPS.map(group => (
      <Section caption={group.caption} key={group.title} title={group.title}>
        <Grid
          items={group.entries}
          keyOf={entry => entry.name}
          render={entry => (
            <Tile
              code={`haptics.${entry.name}()`}
              description={entry.description}
              onPress={() => haptics.play(entry.name)}
              title={entry.name}
            />
          )}
        />
      </Section>
    ))}
    <Impacts />
  </Page>
)
