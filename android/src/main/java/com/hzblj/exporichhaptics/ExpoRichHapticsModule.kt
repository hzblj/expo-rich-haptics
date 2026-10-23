package com.hzblj.exporichhaptics

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoRichHapticsModule : Module() {
  private val player by lazy { HapticPlayer(appContext) }

  override fun definition() = ModuleDefinition {
    Name("ExpoRichHaptics")

    // Synchronous and fire-and-forget, like on iOS: the call returns at once and the haptic plays on the next
    // main-thread turn. Android has nothing to prepare, so `prepare` and `preparePattern` exist on iOS only.
    Function("play") { haptic: Haptic, intensity: Double? ->
      player.play(haptic, intensity?.coerceIn(0.0, 1.0)?.toFloat())
    }

    Function("playPattern") { events: List<HapticPatternEvent> ->
      player.playPattern(events.map { it.step })
    }
  }
}
