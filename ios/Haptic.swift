import ExpoModulesCore
import UIKit

/**
 The feedback played by name, named for what happened rather than how it feels: the JS `Haptic` union, one case each.
 Android maps the same names onto `HapticFeedbackConstants`; iOS has fewer distinct feedbacks, so several names share
 one here (`tick` is a selection, `keyPress` a light impact).
 */
internal enum Haptic: String, Enumerable {
  case selection
  case tick
  case soft
  case light
  case medium
  case rigid
  case heavy
  case success
  case warning
  case error
  case toggleOn
  case toggleOff
  case longPress
  case dragStart
  case thresholdActivate
  case thresholdDeactivate
  case keyPress

  fileprivate var feedback: Feedback {
    switch self {
    case .selection, .tick: .selection
    case .soft, .toggleOff: .impact(.soft)
    case .light, .keyPress, .thresholdDeactivate: .impact(.light)
    case .medium, .longPress, .dragStart, .thresholdActivate: .impact(.medium)
    case .rigid, .toggleOn: .impact(.rigid)
    case .heavy: .impact(.heavy)
    case .success: .notification(.success)
    case .warning: .notification(.warning)
    case .error: .notification(.error)
    }
  }
}

private enum Feedback {
  case selection
  case impact(UIImpactFeedbackGenerator.FeedbackStyle)
  case notification(UINotificationFeedbackGenerator.FeedbackType)
}

/**
 Plays `Haptic`s through UIKit's feedback generators, not Core Haptics, so they follow the System Haptics setting,
 stay silent on hardware without a Taptic Engine and in the background, and feel like the rest of the OS.

 One generator per kind lives for the app's lifetime: `prepare()` warms up the Taptic Engine for the generator that
 will play next, and a fast run of ticks allocates nothing. They are created without a view; the view-attached
 initialisers of iOS 17.5 only add a location, and the plain ones are not deprecated.
 */
@MainActor
internal enum FeedbackGenerators {
  private static let selection = UISelectionFeedbackGenerator()
  private static let notification = UINotificationFeedbackGenerator()
  private static var impacts: [UIImpactFeedbackGenerator.FeedbackStyle: UIImpactFeedbackGenerator] = [:]

  /** `intensity` (0 to 1) scales an impact; the other feedbacks have a fixed strength and ignore it. */
  static func play(_ haptic: Haptic, intensity: Double?) {
    switch haptic.feedback {
    case .selection:
      selection.selectionChanged()
    case let .impact(style):
      if let intensity {
        impact(style).impactOccurred(intensity: CGFloat(min(max(intensity, 0), 1)))
      } else {
        impact(style).impactOccurred()
      }
    case let .notification(type):
      notification.notificationOccurred(type)
    }
  }

  /** Readies the Taptic Engine for `haptic` for a few seconds; call it when the gesture that will play it begins. */
  static func prepare(_ haptic: Haptic) {
    switch haptic.feedback {
    case .selection:
      selection.prepare()
    case let .impact(style):
      impact(style).prepare()
    case .notification:
      notification.prepare()
    }
  }

  private static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle) -> UIImpactFeedbackGenerator {
    if let generator = impacts[style] {
      return generator
    }
    let generator = UIImpactFeedbackGenerator(style: style)
    impacts[style] = generator
    return generator
  }
}
