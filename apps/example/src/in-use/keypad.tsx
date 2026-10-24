import {haptics, useHapticFeedback} from '@hzblj/expo-rich-haptics'
import {Box, type ColorToken, Pressable, RnIcon, RnText} from '@hzblj/kara-ui'
import {useEffect, useState} from 'react'

import {CodeBlock, Section} from '../ui'

const CODE = '1234'
const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['', '0', 'delete'],
]
/** How long a finished code stays on screen before the keypad clears. */
const RESULT_MS = 900

type Status = 'entering' | 'right' | 'wrong'

const DOT_COLORS: Record<Status, ColorToken> = {
  entering: 'fill.accent.primary',
  right: 'fill.success.primary',
  wrong: 'fill.destructive.primary',
}

const Key = ({disabled, label, onPress}: {disabled: boolean; label: string; onPress: () => void}) => (
  <Pressable
    accessibilityLabel={label === 'delete' ? 'Delete' : label}
    align="center"
    bg={label === 'delete' ? undefined : 'fill.tertiary'}
    borderRadius="full"
    disabled={disabled}
    h={64}
    justify="center"
    onPress={onPress}
    w={64}
  >
    {label === 'delete' ? <RnIcon name="backspace" size="s24" /> : <RnText variant="headingS">{label}</RnText>}
  </Pressable>
)

/** A passcode keypad: a key press for each digit, then success or error for the code. */
export const Keypad = () => {
  const [entered, setEntered] = useState('')
  const status: Status = entered.length < CODE.length ? 'entering' : entered === CODE ? 'right' : 'wrong'

  useHapticFeedback(status, (_, next) => (next === 'right' ? 'success' : next === 'wrong' && 'error'))

  useEffect(() => {
    if (status === 'entering') {
      return
    }

    const timer = setTimeout(() => setEntered(''), RESULT_MS)

    return () => clearTimeout(timer)
  }, [status])

  const press = (label: string) => {
    haptics.keyPress()
    setEntered(current => (label === 'delete' ? current.slice(0, -1) : `${current}${label}`))
  }

  return (
    <Section caption={`The code is ${CODE}. Any other plays error.`} title="Passcode">
      <Box align="center" bg="surface.primary" borderRadius="large" gap="s24" px="s16" py="s24">
        <Box row gap="s16">
          {CODE.split('').map((_, index) => (
            <Box
              animate="quick"
              bg={index < entered.length ? DOT_COLORS[status] : 'fill.tertiary'}
              borderRadius="full"
              h={14}
              key={index}
              w={14}
            />
          ))}
        </Box>
        <Box gap="s12">
          {ROWS.map(row => (
            <Box row gap="s20" key={row.join()}>
              {row.map(label =>
                label ? (
                  <Key
                    disabled={status !== 'entering' || (label === 'delete' && entered.length === 0)}
                    key={label}
                    label={label}
                    onPress={() => press(label)}
                  />
                ) : (
                  <Box h={64} key="empty" w={64} />
                )
              )}
            </Box>
          ))}
        </Box>
      </Box>
      <CodeBlock
        code={
          "haptics.keyPress()\n\nuseHapticFeedback(status, (_, next) =>\n  next === 'right'\n    ? 'success'\n    : next === 'wrong' && 'error'\n)"
        }
      />
    </Section>
  )
}
