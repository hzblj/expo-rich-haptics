package com.hzblj.exporichhaptics

import android.annotation.SuppressLint
import android.os.VibrationEffect
import android.view.HapticFeedbackConstants
import expo.modules.kotlin.records.Field
import expo.modules.kotlin.records.Record
import expo.modules.kotlin.types.Enumerable

/**
 * The primitives a pattern is made of: the JS `HapticPrimitive` union, each one of Android's composition primitives,
 * which the device plays as the effect its manufacturer tuned. iOS builds the same ones from Core Haptics events
 * (`HapticPrimitive.swift`).
 */
enum class HapticPrimitive(val value: String) : Enumerable {
  CLICK("click"),
  TICK("tick"),
  LOW_TICK("lowTick"),
  THUD("thud"),
  SPIN("spin"),
  QUICK_RISE("quickRise"),
  SLOW_RISE("slowRise"),
  QUICK_FALL("quickFall")
}

/**
 * How long it plays, in milliseconds, as iOS plays it: for Android 11, which cannot report the device's own
 * durations, and for the system haptic that stands in for a rise.
 */
internal val HapticPrimitive.duration: Long
  get() = when (this) {
    HapticPrimitive.CLICK, HapticPrimitive.LOW_TICK -> 10
    HapticPrimitive.TICK -> 5
    HapticPrimitive.THUD -> 120
    HapticPrimitive.SPIN, HapticPrimitive.QUICK_RISE -> 150
    HapticPrimitive.SLOW_RISE -> 500
    HapticPrimitive.QUICK_FALL -> 100
  }

// LOW_TICK, THUD and SPIN came with Android 12: an older OS reports them unsupported, and the substitutes play.
@get:SuppressLint("InlinedApi")
internal val HapticPrimitive.id: Int
  get() = when (this) {
    HapticPrimitive.CLICK -> VibrationEffect.Composition.PRIMITIVE_CLICK
    HapticPrimitive.TICK -> VibrationEffect.Composition.PRIMITIVE_TICK
    HapticPrimitive.LOW_TICK -> VibrationEffect.Composition.PRIMITIVE_LOW_TICK
    HapticPrimitive.THUD -> VibrationEffect.Composition.PRIMITIVE_THUD
    HapticPrimitive.SPIN -> VibrationEffect.Composition.PRIMITIVE_SPIN
    HapticPrimitive.QUICK_RISE -> VibrationEffect.Composition.PRIMITIVE_QUICK_RISE
    HapticPrimitive.SLOW_RISE -> VibrationEffect.Composition.PRIMITIVE_SLOW_RISE
    HapticPrimitive.QUICK_FALL -> VibrationEffect.Composition.PRIMITIVE_QUICK_FALL
  }

/** The primitive itself, then the nearest ones, for a device that lacks some: the first it supports plays. */
internal val HapticPrimitive.substitutes: List<HapticPrimitive>
  get() = when (this) {
    HapticPrimitive.CLICK -> listOf(HapticPrimitive.CLICK)
    HapticPrimitive.TICK -> listOf(HapticPrimitive.TICK, HapticPrimitive.CLICK)
    HapticPrimitive.LOW_TICK -> listOf(HapticPrimitive.LOW_TICK, HapticPrimitive.TICK, HapticPrimitive.CLICK)
    HapticPrimitive.THUD -> listOf(HapticPrimitive.THUD, HapticPrimitive.CLICK)
    HapticPrimitive.SPIN -> listOf(HapticPrimitive.SPIN, HapticPrimitive.CLICK)
    HapticPrimitive.QUICK_RISE -> listOf(HapticPrimitive.QUICK_RISE, HapticPrimitive.SLOW_RISE)
    HapticPrimitive.SLOW_RISE -> listOf(HapticPrimitive.SLOW_RISE, HapticPrimitive.QUICK_RISE)
    HapticPrimitive.QUICK_FALL -> listOf(HapticPrimitive.QUICK_FALL)
  }

/**
 * The nearest system haptic, for a device with no primitives at all: a tap at the primitive's start, or at the top
 * of a rise.
 */
internal fun HapticPrimitive.system(scale: Float): Feedback =
  Feedback(
    when (this) {
      HapticPrimitive.CLICK ->
        if (scale >= 0.5f) HapticFeedbackConstants.VIRTUAL_KEY else HapticFeedbackConstants.CONTEXT_CLICK
      HapticPrimitive.THUD ->
        if (scale >= 0.5f) HapticFeedbackConstants.LONG_PRESS else HapticFeedbackConstants.VIRTUAL_KEY
      HapticPrimitive.TICK, HapticPrimitive.LOW_TICK, HapticPrimitive.QUICK_FALL -> HapticFeedbackConstants.CLOCK_TICK
      HapticPrimitive.SPIN, HapticPrimitive.QUICK_RISE, HapticPrimitive.SLOW_RISE ->
        HapticFeedbackConstants.CONTEXT_CLICK
    }
  )

/** When `system` plays, from the primitive's start: at the top of a rise, at once otherwise. */
internal val HapticPrimitive.systemDelay: Long
  get() = when (this) {
    HapticPrimitive.QUICK_RISE, HapticPrimitive.SLOW_RISE -> duration
    else -> 0
  }

/** One event of a pattern as JS sends it: `at` in milliseconds, `intensity` from 0 to 1. */
data class HapticPatternEvent(
  @Field val primitive: HapticPrimitive = HapticPrimitive.CLICK,
  @Field val at: Double = 0.0,
  @Field val intensity: Double = 1.0
) : Record {
  val step: PatternStep
    get() = PatternStep(primitive, intensity.coerceIn(0.0, 1.0).toFloat(), at.coerceAtLeast(0.0).toLong())
}

/** A primitive at `scale` (0 to 1), `at` milliseconds into its pattern. */
data class PatternStep(val primitive: HapticPrimitive, val scale: Float, val at: Long)
