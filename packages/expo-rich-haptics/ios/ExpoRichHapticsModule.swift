import ExpoModulesCore

public class ExpoRichHapticsModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoRichHaptics")

    // Synchronous and fire-and-forget: the call returns at once and the feedback plays on the next main-queue turn,
    // with no promise for JS to settle.
    Function("play") { (haptic: Haptic, intensity: Double?) in
      DispatchQueue.main.async {
        FeedbackGenerators.play(haptic, intensity: intensity)
      }
    }

    Function("prepare") { (haptic: Haptic) in
      DispatchQueue.main.async {
        FeedbackGenerators.prepare(haptic)
      }
    }

    // Patterns go to Core Haptics on its own queue, where starting the engine may take a moment.
    Function("playPattern") { (events: [HapticPatternEvent]) in
      PatternPlayer.shared.play(events.map(\.step))
    }

    Function("preparePattern") {
      PatternPlayer.shared.prepare()
    }
  }
}
