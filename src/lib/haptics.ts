/**
 * Trigger haptic feedback via the Vibration API.
 * Falls back silently on devices/browsers that don't support it.
 */
export function hapticFeedback(style: 'light' | 'medium' | 'heavy' = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return

  const durations: Record<string, number> = {
    light: 10,
    medium: 20,
    heavy: 30,
  }

  try {
    navigator.vibrate(durations[style])
  } catch {
    // Vibration API not available or blocked
  }
}

/**
 * Trigger success haptic (double tap)
 */
export function hapticSuccess() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    navigator.vibrate([10, 50, 10])
  } catch {
    // silent
  }
}

/**
 * Trigger error haptic (longer vibration)
 */
export function hapticError() {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return
  try {
    navigator.vibrate([30, 50, 30])
  } catch {
    // silent
  }
}
