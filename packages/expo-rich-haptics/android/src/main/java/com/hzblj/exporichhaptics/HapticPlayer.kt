package com.hzblj.exporichhaptics

import android.content.Context
import android.media.AudioAttributes
import android.os.Build
import android.os.Handler
import android.os.Looper
import android.os.SystemClock
import android.os.VibrationAttributes
import android.os.VibrationEffect
import android.os.Vibrator
import android.os.VibratorManager
import android.view.HapticFeedbackConstants
import android.view.View
import androidx.annotation.RequiresApi
import expo.modules.kotlin.AppContext

/**
 * Plays haptics on the main thread, in two ways and never as a vibrator waveform:
 *
 * - A name plays the system's own haptic feedback, `View.performHapticFeedback` on the current activity's window:
 *   tuned per device (Android 13+ plays each constant as the effect the manufacturer designed for it), and silent
 *   when the user switched touch feedback off. Its chain falls to the next constant when the OS or the device answers
 *   `false`.
 * - A pattern, a warning, or an impact with an intensity plays one composition of primitives (Android 11+, where the
 *   device has them), as touch feedback, which the same setting silences. A device without primitives plays each
 *   event as the nearest system haptic instead, at its time.
 *
 * What it guards against:
 * - No activity, one finishing, or a window not created or attached yet (start-up, a configuration change): nothing
 *   plays, so nothing plays in the background either. `peekDecorView` never creates a decor view as `decorView`
 *   would.
 * - The decor view's own `isHapticFeedbackEnabled`: ignored (`FLAG_IGNORE_VIEW_SETTING`), so a library that switched
 *   it off for its own reasons cannot silence the app. The user's global setting is always respected.
 * - An app that removed the `VIBRATE` permission from its manifest: compositions throw, and system haptics play.
 */
internal class HapticPlayer(private val appContext: AppContext) {
  private val main = Handler(Looper.getMainLooper())

  /** Tags the system haptics a pattern scheduled, so the next pattern cancels the ones not played yet. */
  private val patternToken = Any()

  private var vibrator: Vibrator? = null
  private var supported: Set<HapticPrimitive>? = null
  private val durations = mutableMapOf<HapticPrimitive, Long>()

  fun play(haptic: Haptic, intensity: Float?) {
    main.post {
      val view = decorView() ?: return@post
      val steps = haptic.composition(intensity)

      if (steps == null || !compose(steps)) {
        perform(view, haptic.chain)
      }
    }
  }

  fun playPattern(steps: List<PatternStep>) {
    main.post {
      main.removeCallbacksAndMessages(patternToken)

      if (decorView() == null || compose(steps)) {
        return@post
      }

      val start = SystemClock.uptimeMillis()

      for (step in steps) {
        val runnable = Runnable { decorView()?.let { perform(it, listOf(step.primitive.system(step.scale))) } }
        main.postAtTime(runnable, patternToken, start + step.at + step.primitive.systemDelay)
      }
    }
  }

  private fun decorView(): View? {
    val activity = appContext.currentActivity?.takeUnless { it.isFinishing || it.isDestroyed } ?: return null
    return activity.window?.peekDecorView()?.takeIf { it.isAttachedToWindow }
  }

  private fun perform(view: View, chain: List<Feedback>) {
    chain.firstOrNull { feedback ->
      feedback.isAvailable &&
        view.performHapticFeedback(feedback.constant, HapticFeedbackConstants.FLAG_IGNORE_VIEW_SETTING)
    }
  }

  /**
   * Plays `steps` as one composition, each primitive or its nearest substitute the device has. `false` where it has
   * no primitives (no click, the baseline every device with them supports), so the caller plays system haptics.
   */
  private fun compose(steps: List<PatternStep>): Boolean {
    if (Build.VERSION.SDK_INT < Build.VERSION_CODES.R) {
      return false
    }

    val vibrator = vibrator() ?: return false
    val supported = supported(vibrator)

    if (HapticPrimitive.CLICK !in supported) {
      return false
    }

    val playable = steps
      .sortedBy { it.at }
      .mapNotNull { step -> step.primitive.substitutes.firstOrNull { it in supported }?.let { step.copy(primitive = it) } }

    if (playable.isEmpty()) {
      return true
    }

    val composition = VibrationEffect.startComposition()

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.BAKLAVA) {
      addFromStarts(composition, playable)
    } else {
      addAfterEnds(composition, playable, vibrator)
    }

    return vibrate(vibrator, composition.compose())
  }

  /** Android 16: each delay counts from the previous primitive's start, exactly as `at` does. */
  @RequiresApi(Build.VERSION_CODES.BAKLAVA)
  private fun addFromStarts(composition: VibrationEffect.Composition, steps: List<PatternStep>) {
    var previous = 0L

    for (step in steps) {
      val delay = (step.at - previous).toInt()
      composition.addPrimitive(
        step.primitive.id,
        step.scale,
        delay,
        VibrationEffect.Composition.DELAY_TYPE_RELATIVE_START_OFFSET
      )
      previous = step.at
    }
  }

  /**
   * Before Android 16 a delay counts from the end of the previous primitive, so each one subtracts how long the one
   * before plays. A primitive that should start while the previous one still plays waits for it.
   */
  @RequiresApi(Build.VERSION_CODES.R)
  private fun addAfterEnds(composition: VibrationEffect.Composition, steps: List<PatternStep>, vibrator: Vibrator) {
    var end = 0L

    for (step in steps) {
      val delay = (step.at - end).coerceAtLeast(0)
      composition.addPrimitive(step.primitive.id, step.scale, delay.toInt())
      end += delay + duration(vibrator, step.primitive)
    }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun vibrate(vibrator: Vibrator, effect: VibrationEffect): Boolean {
    try {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
        vibrator.vibrate(effect, VibrationAttributes.createForUsage(VibrationAttributes.USAGE_TOUCH))
      } else {
        @Suppress("DEPRECATION")
        vibrator.vibrate(effect, TOUCH_AUDIO_ATTRIBUTES)
      }
    } catch (_: SecurityException) {
      return false
    }

    return true
  }

  private fun vibrator(): Vibrator? {
    vibrator?.let { return it }
    val context = appContext.reactContext ?: return null

    return vibratorOf(context)?.takeIf { it.hasVibrator() }?.also { vibrator = it }
  }

  @RequiresApi(Build.VERSION_CODES.R)
  private fun supported(vibrator: Vibrator): Set<HapticPrimitive> =
    supported ?: run {
      val primitives = HapticPrimitive.entries
      val answers = vibrator.arePrimitivesSupported(*primitives.map { it.id }.toIntArray())
      primitives.filterIndexed { index, _ -> answers[index] }.toSet().also { supported = it }
    }

  /** The device's own duration from Android 12, which reports it; before, the one iOS plays. */
  private fun duration(vibrator: Vibrator, primitive: HapticPrimitive): Long =
    durations.getOrPut(primitive) {
      if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
        vibrator.getPrimitiveDurations(primitive.id)[0].toLong()
      } else {
        primitive.duration
      }
    }
}

/** Touch feedback before Android 13, which has no `VibrationAttributes`: the usage the system maps onto it. */
private val TOUCH_AUDIO_ATTRIBUTES: AudioAttributes =
  AudioAttributes.Builder()
    .setUsage(AudioAttributes.USAGE_ASSISTANCE_SONIFICATION)
    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
    .build()

private fun vibratorOf(context: Context): Vibrator? =
  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
    (context.getSystemService(Context.VIBRATOR_MANAGER_SERVICE) as? VibratorManager)?.defaultVibrator
  } else {
    @Suppress("DEPRECATION")
    context.getSystemService(Context.VIBRATOR_SERVICE) as? Vibrator
  }
