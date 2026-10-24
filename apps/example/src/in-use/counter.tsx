import {useHapticFeedback} from '@hzblj/expo-rich-haptics'
import {Box, type IconName, Pressable, RnIcon, RnText} from '@hzblj/kara-ui'
import {useState} from 'react'

import {CodeBlock, Section} from '../ui'

const MAX = 9

const StepButton = ({
  disabled,
  icon,
  label,
  onPress,
}: {
  disabled: boolean
  icon: IconName
  label: string
  onPress: () => void
}) => (
  <Pressable
    accessibilityLabel={label}
    align="center"
    bg="fill.tertiary"
    borderRadius="full"
    disabled={disabled}
    h={48}
    justify="center"
    onPress={onPress}
    opacity={disabled ? 'o40' : undefined}
    w={48}
  >
    <RnIcon name={icon} size="s24" />
  </Pressable>
)

/** A quantity of the app's own: a tick on the way up, a softer tap on the way down. */
export const Counter = () => {
  const [count, setCount] = useState(1)

  useHapticFeedback(count, (previous, next) => (next > previous ? 'tick' : 'soft'))

  return (
    <Section
      caption="The hook compares each value with the one before, so one resolver tells up from down."
      title="Quantity"
    >
      <Box align="center" bg="surface.primary" borderRadius="large" row p="s16">
        <StepButton
          disabled={count === 0}
          icon="remove"
          label="One fewer"
          onPress={() => setCount(value => Math.max(0, value - 1))}
        />
        <RnText align="center" flex={1} variant="headingM">
          {String(count)}
        </RnText>
        <StepButton
          disabled={count === MAX}
          icon="add"
          label="One more"
          onPress={() => setCount(value => Math.min(MAX, value + 1))}
        />
      </Box>
      <CodeBlock
        code={"useHapticFeedback(\n  quantity,\n  (previous, next) =>\n    next > previous ? 'tick' : 'soft'\n)"}
      />
    </Section>
  )
}
