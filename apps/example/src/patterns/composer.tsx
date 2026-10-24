import {HAPTIC_PRIMITIVES, type HapticEvent, haptics} from '@hzblj/expo-rich-haptics'
import {
  Box,
  Button,
  Divider,
  HStack,
  IconButton,
  Island,
  Menu,
  Slider,
  Spacer,
  Stepper,
  Text,
  VStack,
} from '@hzblj/kara-ui'
import {Fragment, useMemo, useRef, useState} from 'react'

import {CodeBlock, Section} from '../ui'
import {patternCode} from './presets'
import {Waveform, type WaveformHandle} from './waveform'

type DraftEvent = Required<HapticEvent> & {id: number}

let nextId = 0

const draft = (event: Required<HapticEvent>): DraftEvent => ({...event, id: nextId++})

const FIRST_DRAFT: DraftEvent[] = [
  draft({at: 0, intensity: 1, primitive: 'thud'}),
  draft({at: 140, intensity: 0.6, primitive: 'thud'}),
]

/** How far one press of the stepper moves an event, and the latest it may start. */
const STEP_MS = 20
const MAX_AT = 2000
/** Where a new event lands: this long after the last one starts. */
const GAP_MS = 120

const round = (value: number) => Math.round(value * 10) / 10

type EventRowProps = {
  event: DraftEvent
  index: number
  onChange: (change: Partial<HapticEvent>) => void
  onRemove?: () => void
}

const EventRow = ({event, index, onChange, onRemove}: EventRowProps) => (
  <VStack px="s16" py="s12" spacing="s12" wide>
    <HStack align="center" spacing="s8" wide>
      <Text color="content.secondary" variant="footnoteMedium">
        {`EVENT ${index + 1}`}
      </Text>
      <Spacer />
      <Menu
        actions={HAPTIC_PRIMITIVES.map(primitive => ({label: primitive, onPress: () => onChange({primitive})}))}
        label={event.primitive}
      />
      {onRemove ? <IconButton accessibilityLabel="Remove the event" name="delete" onPress={onRemove} /> : null}
    </HStack>
    <Stepper
      label="Starts at, ms"
      max={MAX_AT}
      min={0}
      onValueChange={at => onChange({at})}
      step={STEP_MS}
      value={event.at}
    />
    <VStack spacing="s4" wide>
      <HStack wide>
        <Text variant="subheadline">Intensity</Text>
        <Spacer />
        <Text color="content.secondary" variant="subheadline">
          {event.intensity.toFixed(1)}
        </Text>
      </HStack>
      <Slider onValueChange={intensity => onChange({intensity: round(intensity)})} value={event.intensity} />
    </VStack>
  </VStack>
)

/** A pattern of your own: events to add, change and remove, its waveform, and the code that plays it. */
export const Composer = () => {
  const [events, setEvents] = useState(FIRST_DRAFT)
  const waveform = useRef<WaveformHandle>(null)
  const pattern = useMemo(() => events.map(({at, intensity, primitive}) => ({at, intensity, primitive})), [events])

  const change = (id: number, update: Partial<HapticEvent>) =>
    setEvents(current => current.map(event => (event.id === id ? {...event, ...update} : event)))

  const add = () =>
    setEvents(current => [
      ...current,
      draft({
        at: Math.min(MAX_AT, Math.max(0, ...current.map(event => event.at)) + GAP_MS),
        intensity: 0.6,
        primitive: 'click',
      }),
    ])

  const play = () => {
    haptics.play(pattern)
    waveform.current?.play()
  }

  return (
    <Section
      caption="Events can come in any order, and overlap: iOS plays each on its own player. Before Android 16 a primitive that should start while the previous one plays waits for it to finish."
      title="Make your own"
    >
      <Island>
        <VStack bg="surface.primary" borderRadius="large" wide>
          {events.map((event, index) => (
            <Fragment key={event.id}>
              {index > 0 ? (
                <VStack px="s16" wide>
                  <Divider />
                </VStack>
              ) : null}
              <EventRow
                event={event}
                index={index}
                onChange={update => change(event.id, update)}
                onRemove={
                  events.length > 1
                    ? () => setEvents(current => current.filter(entry => entry.id !== event.id))
                    : undefined
                }
              />
            </Fragment>
          ))}
        </VStack>
      </Island>
      {/* An island each: in one Compose row the first wide button would take the whole width. */}
      <Box gap="s12" row>
        <Island flex={1}>
          <Button label="Add an event" onPress={add} variant="secondary" />
        </Island>
        <Island flex={1}>
          <Button label="Play" onPress={play} />
        </Island>
      </Box>
      <Box bg="surface.primary" borderRadius="large" px="s16" py="s12">
        <Waveform pattern={pattern} ref={waveform} />
      </Box>
      <CodeBlock code={patternCode(pattern)} />
    </Section>
  )
}
