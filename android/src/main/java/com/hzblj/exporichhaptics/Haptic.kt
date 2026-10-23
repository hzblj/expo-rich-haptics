package com.hzblj.exporichhaptics

import android.annotation.SuppressLint
import android.os.Build
import android.view.HapticFeedbackConstants
import expo.modules.kotlin.types.Enumerable

/**
 * The feedback played by name, named for what happened rather than how it feels: the JS `Haptic` union, one value
 * each. Each maps to a chain of `HapticFeedbackConstants`, newest first: Android 14 added the constants that say what
 * happened (`TOGGLE_ON`, `SEGMENT_TICK`, `GESTURE_THRESHOLD_ACTIVATE`...), and an older OS gets the nearest feedback
 * it has. Every link is a system haptic, so the chain degrades to a plainer click, never to a vibrator buzz.
 */
enum class Haptic(val value: String) : Enumerable {
  SELECTION("selection"),
  TICK("tick"),
  SOFT("soft"),
  LIGHT("light"),
  MEDIUM("medium"),
  RIGID("rigid"),
  HEAVY("heavy"),
  SUCCESS("success"),
  WARNING("warning"),
  ERROR("error"),
  TOGGLE_ON("toggleOn"),
  TOGGLE_OFF("toggleOff"),
  LONG_PRESS("longPress"),
  DRAG_START("dragStart"),
  THRESHOLD_ACTIVATE("thresholdActivate"),
  THRESHOLD_DEACTIVATE("thresholdDeactivate"),
  KEY_PRESS("keyPress")
}

/** One link of a chain: a constant, and whether this OS has it. */
internal class Feedback(val constant: Int, val isAvailable: Boolean = true)

private fun isAtLeast(api: Int): Boolean = Build.VERSION.SDK_INT >= api

private const val ANDROID_14 = Build.VERSION_CODES.UPSIDE_DOWN_CAKE
private const val ANDROID_11 = Build.VERSION_CODES.R
private const val ANDROID_8_1 = Build.VERSION_CODES.O_MR1

// The constants newer than the minimum SDK are only played behind `isAvailable`.
@get:SuppressLint("InlinedApi")
internal val Haptic.chain: List<Feedback>
  get() = when (this) {
    Haptic.SELECTION -> listOf(
      Feedback(HapticFeedbackConstants.SEGMENT_TICK, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.CLOCK_TICK)
    )
    Haptic.TICK -> listOf(
      Feedback(HapticFeedbackConstants.SEGMENT_FREQUENT_TICK, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.TEXT_HANDLE_MOVE, isAtLeast(ANDROID_8_1)),
      Feedback(HapticFeedbackConstants.CLOCK_TICK)
    )
    Haptic.SOFT -> listOf(Feedback(HapticFeedbackConstants.CLOCK_TICK))
    Haptic.LIGHT -> listOf(Feedback(HapticFeedbackConstants.CONTEXT_CLICK))
    Haptic.MEDIUM -> listOf(Feedback(HapticFeedbackConstants.VIRTUAL_KEY))
    Haptic.RIGID -> listOf(Feedback(HapticFeedbackConstants.KEYBOARD_TAP))
    Haptic.HEAVY -> listOf(Feedback(HapticFeedbackConstants.LONG_PRESS))
    Haptic.SUCCESS -> listOf(
      Feedback(HapticFeedbackConstants.CONFIRM, isAtLeast(ANDROID_11)),
      Feedback(HapticFeedbackConstants.VIRTUAL_KEY)
    )
    // Android has no warning constant: where the device has primitives, `composition` plays one of its own.
    Haptic.WARNING, Haptic.ERROR -> listOf(
      Feedback(HapticFeedbackConstants.REJECT, isAtLeast(ANDROID_11)),
      Feedback(HapticFeedbackConstants.LONG_PRESS)
    )
    Haptic.TOGGLE_ON -> listOf(
      Feedback(HapticFeedbackConstants.TOGGLE_ON, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.CONTEXT_CLICK)
    )
    Haptic.TOGGLE_OFF -> listOf(
      Feedback(HapticFeedbackConstants.TOGGLE_OFF, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.CLOCK_TICK)
    )
    Haptic.LONG_PRESS -> listOf(Feedback(HapticFeedbackConstants.LONG_PRESS))
    Haptic.DRAG_START -> listOf(
      Feedback(HapticFeedbackConstants.DRAG_START, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.LONG_PRESS)
    )
    Haptic.THRESHOLD_ACTIVATE -> listOf(
      Feedback(HapticFeedbackConstants.GESTURE_THRESHOLD_ACTIVATE, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.CONTEXT_CLICK)
    )
    Haptic.THRESHOLD_DEACTIVATE -> listOf(
      Feedback(HapticFeedbackConstants.GESTURE_THRESHOLD_DEACTIVATE, isAtLeast(ANDROID_14)),
      Feedback(HapticFeedbackConstants.CLOCK_TICK)
    )
    Haptic.KEY_PRESS -> listOf(Feedback(HapticFeedbackConstants.KEYBOARD_TAP))
  }

/**
 * What a name plays as primitives where the device has them, before its chain: an impact given an `intensity` (a
 * system haptic has no amplitude, a primitive scales), and a warning, which Android has no constant for. Two clicks,
 * the second softer, as iOS plays it; an error stays the system's rejection. `null`: the chain alone.
 */
internal fun Haptic.composition(intensity: Float?): List<PatternStep>? =
  when (this) {
    Haptic.WARNING -> listOf(
      PatternStep(HapticPrimitive.CLICK, 1f, 0),
      PatternStep(HapticPrimitive.CLICK, 0.5f, 120)
    )
    Haptic.SOFT -> intensity?.let { listOf(PatternStep(HapticPrimitive.LOW_TICK, it, 0)) }
    Haptic.LIGHT -> intensity?.let { listOf(PatternStep(HapticPrimitive.TICK, it, 0)) }
    Haptic.MEDIUM -> intensity?.let { listOf(PatternStep(HapticPrimitive.CLICK, it * 0.6f, 0)) }
    Haptic.RIGID -> intensity?.let { listOf(PatternStep(HapticPrimitive.CLICK, it * 0.85f, 0)) }
    Haptic.HEAVY -> intensity?.let { listOf(PatternStep(HapticPrimitive.CLICK, it, 0)) }
    else -> null
  }
