import {Box, Pressable, RnText} from '@hzblj/kara-ui'
import {useEffect, useRef, useState} from 'react'

import {InlineCode} from './code'

/** How long a tile stays lit after a press: about as long as the longest name plays. */
const LIT_MS = 450

type TileProps = {
  /** The line of code the press runs, when it fits a tile. */
  code?: string
  /** What the haptic is for. */
  description: string
  onPress: () => void
  title: string
}

/**
 * One haptic to try. A press plays it and lights the tile for a moment, so the simulator, which plays nothing, still
 * shows which one ran.
 */
export const Tile = ({code, description, onPress, title}: TileProps) => {
  const [lit, setLit] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => () => clearTimeout(timer.current), [])

  const press = () => {
    onPress()
    setLit(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setLit(false), LIT_MS)
  }

  return (
    <Pressable
      accessibilityHint="Plays the haptic"
      accessibilityLabel={title}
      animate="quick"
      bg={lit ? 'fill.accent.base' : 'surface.primary'}
      borderRadius="large"
      flex={1}
      gap="s4"
      onPress={press}
      p="s16"
    >
      <Box align="center" row gap="s8">
        <Box animate="quick" bg={lit ? 'fill.accent.primary' : 'fill.tertiary'} borderRadius="full" h={8} w={8} />
        <RnText color={lit ? 'content.accent' : 'content.primary'} variant="subheadlineMedium">
          {title}
        </RnText>
      </Box>
      <RnText color="content.secondary" variant="footnote">
        {description}
      </RnText>
      {code ? <InlineCode>{code}</InlineCode> : null}
    </Pressable>
  )
}
