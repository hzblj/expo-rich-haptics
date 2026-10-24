import {Island, Label, Text, VStack} from '@hzblj/kara-ui'
import {isDevice} from 'expo-device'

/** Shown on the simulator and the emulator, which play no haptics at all. */
export const DeviceNotice = () =>
  isDevice ? null : (
    <Island>
      <VStack align="start" bg="fill.accent.base" borderRadius="large" p="s16" spacing="s8" wide>
        <Label color="content.accent" icon="info" title="Felt on a device" variant="headline" />
        <Text color="content.secondary" variant="subheadline">
          The simulator and the emulator play no haptics. Everything here still runs, and each tile lights up as it
          plays, but you feel it only on a phone.
        </Text>
      </VStack>
    </Island>
  )
