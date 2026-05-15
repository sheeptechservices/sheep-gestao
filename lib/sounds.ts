/**
 * Lightweight Web Audio API sound effects — no external files needed.
 * Each function is a no-op on the server or when AudioContext is unavailable.
 */

/** Plays a soft three-note bell chime (A5 → C#6 → E6) on task completion.
 *  Each note has a fundamental sine + inharmonic partial (2.76×) to mimic
 *  the natural bell timbre — fast attack, long gentle decay, never strident. */
export function playDoneSound() {
  if (typeof window === 'undefined') return
  try {
    const AudioCtx = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioCtx()

    // Master gain — keeps the whole effect at a comfortable level
    const master = ctx.createGain()
    master.gain.setValueAtTime(0.7, ctx.currentTime)
    master.connect(ctx.destination)

    const bell = (freq: number, startAt: number) => {
      const t = ctx.currentTime + startAt

      // ── Fundamental partial: the main "ring" ─────────────────────────────
      const osc1  = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.connect(gain1)
      gain1.connect(master)
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(freq, t)
      gain1.gain.setValueAtTime(0, t)
      gain1.gain.linearRampToValueAtTime(0.14, t + 0.005)   // crisp but soft attack
      gain1.gain.exponentialRampToValueAtTime(0.0001, t + 1.6)  // long, gentle tail
      osc1.start(t)
      osc1.stop(t + 1.6)

      // ── Inharmonic partial (2.756×): gives the metallic bell colour ───────
      const osc2  = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.connect(gain2)
      gain2.connect(master)
      osc2.type = 'sine'
      osc2.frequency.setValueAtTime(freq * 2.756, t)
      gain2.gain.setValueAtTime(0, t)
      gain2.gain.linearRampToValueAtTime(0.05, t + 0.005)
      gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.45)  // fades faster than fundamental
      osc2.start(t)
      osc2.stop(t + 0.45)
    }

    // Soft ascending arpeggio — A major (A5 → C#6 → E6)
    bell(880.00, 0.00)   // A5
    bell(1108.7, 0.16)   // C#6
    bell(1318.5, 0.32)   // E6

    setTimeout(() => ctx.close(), 2200)
  } catch {
    // AudioContext blocked or unavailable — silently skip
  }
}
