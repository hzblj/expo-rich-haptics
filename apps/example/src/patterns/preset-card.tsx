import {haptics} from '@hzblj/expo-rich-haptics'
import {Box, Pressable, RnIcon, RnText} from '@hzblj/kara-ui'
import {useRef} from 'react'

import type {Preset} from './presets'
import {Waveform, type WaveformHandle} from './waveform'

/** A pattern to try: a press plays it, and its waveform lights up in time. */
export const PresetCard = ({preset}: {preset: Preset}) => {
  const waveform = useRef<WaveformHandle>(null)

  return (
    <Pressable
      accessibilityHint="Plays the pattern"
      accessibilityLabel={preset.name}
      bg="surface.primary"
      borderRadius="large"
      gap="s12"
      onPress={() => {
        haptics.play(preset.pattern)
        waveform.current?.play()
      }}
      p="s16"
    >
      <Box align="center" row gap="s12">
        <Box flex={1} gap="s2">
          <RnText variant="subheadlineMedium">{preset.name}</RnText>
          <RnText color="content.secondary" variant="footnote">
            {preset.description}
          </RnText>
        </Box>
        <Box align="center" bg="fill.accent.base" borderRadius="full" h={32} justify="center" w={32}>
          <RnIcon color="content.accent" name="play" size="s16" />
        </Box>
      </Box>
      <Waveform pattern={preset.pattern} ref={waveform} />
    </Pressable>
  )
}
