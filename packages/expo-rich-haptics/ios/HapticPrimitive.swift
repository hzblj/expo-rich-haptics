import CoreHaptics
import ExpoModulesCore

/**
 The primitives a pattern is made of: the JS `HapticPrimitive` union. They are Android's composition primitives, built
 here from Core Haptics events after Android's own descriptions of them, so one pattern feels alike on both platforms.
 The durations match the ones Android assumes where the device does not report its own (`HapticPrimitive.kt`).
 */
internal enum HapticPrimitive: String, Enumerable {
  /** A crisp click. */
  case click
  /** A tiny, sharp tick. */
  case tick
  /** A tick with a lower, duller feel. */
  case lowTick
  /** A heavy knock that falls away, like something dropping with gravity. */
  case thud
  /** A short whirl that swells and fades. */
  case spin
  /** A quick rise to full strength. */
  case quickRise
  /** A slow rise to full strength. */
  case slowRise
  /** A quick fall from full strength. */
  case quickFall

  /**
   The primitive at `intensity` (0 to 1), starting `time` seconds into the pattern. Each primitive is a pattern of its
   own on its own player, so the curves that shape one never shape another that overlaps it.
   */
  func pattern(at time: TimeInterval, intensity: Float) throws -> CHHapticPattern {
    switch self {
    case .click:
      try CHHapticPattern(events: [transient(time, intensity: intensity, sharpness: 0.75)], parameters: [])
    case .tick:
      try CHHapticPattern(events: [transient(time, intensity: intensity * 0.55, sharpness: 1)], parameters: [])
    case .lowTick:
      try CHHapticPattern(events: [transient(time, intensity: intensity * 0.55, sharpness: 0.25)], parameters: [])
    case .thud:
      try CHHapticPattern(
        events: [
          transient(time, intensity: intensity, sharpness: 0.1),
          continuous(time, duration: 0.12, intensity: intensity * 0.7, sharpness: 0.05),
        ],
        parameterCurves: [curve(.hapticIntensityControl, time, [(0, 1), (0.12, 0)])]
      )
    case .spin:
      try CHHapticPattern(
        events: [continuous(time, duration: 0.15, intensity: intensity, sharpness: 0.4)],
        parameterCurves: [
          curve(.hapticIntensityControl, time, [(0, 0.3), (0.06, 1), (0.15, 0)]),
          curve(.hapticSharpnessControl, time, [(0, -0.3), (0.15, 0.3)]),
        ]
      )
    case .quickRise:
      try rise(time, duration: 0.15, intensity: intensity)
    case .slowRise:
      try rise(time, duration: 0.5, intensity: intensity)
    case .quickFall:
      try CHHapticPattern(
        events: [continuous(time, duration: 0.1, intensity: intensity, sharpness: 0.5)],
        parameterCurves: [
          curve(.hapticIntensityControl, time, [(0, 1), (0.1, 0)]),
          curve(.hapticSharpnessControl, time, [(0, 0.2), (0.1, -0.3)]),
        ]
      )
    }
  }
}

private func rise(_ time: TimeInterval, duration: TimeInterval, intensity: Float) throws -> CHHapticPattern {
  try CHHapticPattern(
    events: [continuous(time, duration: duration, intensity: intensity, sharpness: 0.5)],
    parameterCurves: [
      curve(.hapticIntensityControl, time, [(0, 0), (duration, 1)]),
      curve(.hapticSharpnessControl, time, [(0, -0.3), (duration, 0.2)]),
    ]
  )
}

private func transient(_ time: TimeInterval, intensity: Float, sharpness: Float) -> CHHapticEvent {
  CHHapticEvent(
    eventType: .hapticTransient,
    parameters: [
      CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
      CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
    ],
    relativeTime: time
  )
}

private func continuous(
  _ time: TimeInterval,
  duration: TimeInterval,
  intensity: Float,
  sharpness: Float
) -> CHHapticEvent {
  CHHapticEvent(
    eventType: .hapticContinuous,
    parameters: [
      CHHapticEventParameter(parameterID: .hapticIntensity, value: intensity),
      CHHapticEventParameter(parameterID: .hapticSharpness, value: sharpness),
    ],
    relativeTime: time,
    duration: duration
  )
}

/** A curve from `time`: its points are (seconds from `time`, value). */
private func curve(
  _ parameter: CHHapticDynamicParameter.ID,
  _ time: TimeInterval,
  _ points: [(TimeInterval, Float)]
) -> CHHapticParameterCurve {
  CHHapticParameterCurve(
    parameterID: parameter,
    controlPoints: points.map { CHHapticParameterCurve.ControlPoint(relativeTime: $0.0, value: $0.1) },
    relativeTime: time
  )
}
