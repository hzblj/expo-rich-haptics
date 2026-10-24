import assert from 'node:assert/strict'
import {test} from 'node:test'

import {normalizePattern} from '../src/pattern'

test('fills in the defaults', () => {
  assert.deepEqual(normalizePattern([{primitive: 'click'}]), [{at: 0, intensity: 1, primitive: 'click'}])
})

test('sorts by start time and keeps the order of events that start together', () => {
  const events = normalizePattern([
    {at: 200, primitive: 'thud'},
    {at: 0, primitive: 'tick'},
    {at: 200, primitive: 'click'},
  ])

  assert.deepEqual(
    events.map(event => event.primitive),
    ['tick', 'thud', 'click']
  )
})

test('rounds start times and never starts before the pattern', () => {
  const events = normalizePattern([
    {at: 12.6, primitive: 'click'},
    {at: -40, primitive: 'tick'},
  ])

  assert.deepEqual(
    events.map(event => event.at),
    [0, 13]
  )
})

test('clamps intensities and scales them', () => {
  const events = normalizePattern(
    [
      {intensity: 2, primitive: 'click'},
      {at: 10, intensity: 0.5, primitive: 'tick'},
    ],
    0.5
  )

  assert.deepEqual(
    events.map(event => event.intensity),
    [0.5, 0.25]
  )
})

test('drops silent events', () => {
  assert.deepEqual(
    normalizePattern([
      {intensity: 0, primitive: 'click'},
      {intensity: -1, primitive: 'tick'},
    ]),
    []
  )
  assert.deepEqual(normalizePattern([{primitive: 'click'}], 0), [])
})

test('falls back to the defaults for numbers that are not finite', () => {
  assert.deepEqual(
    normalizePattern([{at: Number.NaN, intensity: Number.POSITIVE_INFINITY, primitive: 'spin'}], Number.NaN),
    [{at: 0, intensity: 1, primitive: 'spin'}]
  )
})
