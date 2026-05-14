/**
 * Lightweight Web Audio API sound effects — no external files needed.
 * Each function is a no-op on the server or when AudioContext is unavailable.
 */

/** Plays a soft two-note ascending chime (C5 → E5) on task completion. */
export function playDoneSound() {
  if (typeof window === 'undefined') return
  try {
    const ctx = new (window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)()

    const play = (freq: number, startAt: number, duration: number) => {
      const osc  = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startAt)

      // Fast attack, natural decay
      gain.gain.setValueAtTime(0, ctx.currentTime + startAt)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + startAt + 0.012)
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + startAt + duration)

      osc.start(ctx.currentTime + startAt)
      osc.stop(ctx.currentTime + startAt + duration)
    }

    play(523.25, 0,    0.22)  // C5
    play(659.25, 0.10, 0.28)  // E5

    // Close context after sounds finish
    setTimeout(() => ctx.close(), 600)
  } catch {
    // AudioContext blocked or unavailable — silently skip
  }
}
