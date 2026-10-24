import CoreHaptics
import ExpoModulesCore

/** One event of a pattern as JS sends it: `at` in milliseconds, `intensity` from 0 to 1. */
internal final class HapticPatternEvent: Record {
  @Field var primitive: HapticPrimitive = .click
  @Field var at: Double = 0
  @Field var intensity: Double = 1

  required init() {}

  var step: PatternStep {
    PatternStep(primitive: primitive, time: max(at, 0) / 1000, intensity: Float(min(max(intensity, 0), 1)))
  }
}

/** An event in Core Haptics' units, safe to hand to another queue. */
internal struct PatternStep {
  let primitive: HapticPrimitive
  let time: TimeInterval
  let intensity: Float
}

/**
 Plays patterns through Core Haptics on a queue of its own. One engine lives for the app's lifetime; it plays haptics
 only (no audio session) and shuts the hardware down when idle, so every play starts it again first, which does nothing
 to an engine that runs. Starting fails in the background, on hardware without haptics (iPad, the simulator) and
 after the engine is gone; the pattern then stays silent.
 */
internal final class PatternPlayer: @unchecked Sendable {
  static let shared = PatternPlayer()

  private let queue = DispatchQueue(label: "com.hzblj.exporichhaptics.patterns", qos: .userInteractive)
  private let supportsHaptics = CHHapticEngine.capabilitiesForHardware().supportsHaptics
  private var engine: CHHapticEngine?

  /** Every step on its own player, all started together: each pattern carries its step's start time. */
  func play(_ steps: [PatternStep]) {
    queue.async { [self] in
      guard let engine = startedEngine() else {
        return
      }
      for step in steps {
        do {
          let pattern = try step.primitive.pattern(at: step.time, intensity: step.intensity)
          try engine.makePlayer(with: pattern).start(atTime: CHHapticTimeImmediate)
        } catch {
          // A step the engine refuses stays silent; the others still play.
        }
      }
    }
  }

  /** Starts the engine ahead of a pattern, so its first step is not late. */
  func prepare() {
    queue.async { [self] in
      _ = startedEngine()
    }
  }

  private func startedEngine() -> CHHapticEngine? {
    guard supportsHaptics else {
      return nil
    }
    do {
      let engine = try engine ?? makeEngine()
      try engine.start()
      return engine
    } catch {
      return nil
    }
  }

  private func makeEngine() throws -> CHHapticEngine {
    let engine = try CHHapticEngine()
    engine.playsHapticsOnly = true
    engine.isAutoShutdownEnabled = true
    self.engine = engine
    return engine
  }
}
