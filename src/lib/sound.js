/**
 * sound.js — WalaupSound
 * Web Audio API sound system for Walaup.
 * ES module — no window.* global required.
 * SSR-safe: all functions check typeof window before executing.
 *
 * Usage:
 *   import { WalaupSound } from '@/lib/sound'
 *   WalaupSound.click()
 *   WalaupSound.success()
 *
 * Also exposed as window.WalaupSound for Navbar/inline calls.
 */

/* ── Audio Context (lazy singleton) ──────────────────────── */
let _ctx = null

function getCtx() {
  if (typeof window === 'undefined') return null
  if (!_ctx) {
    try {
      _ctx = new (window.AudioContext || window.webkitAudioContext)()
    } catch {
      return null
    }
  }
  // Resume suspended context (browser autoplay policy)
  if (_ctx.state === 'suspended') {
    _ctx.resume().catch(() => {})
  }
  return _ctx
}

/* ── Core synthesizer ─────────────────────────────────────── */
/**
 * Plays a synthesized sound.
 * @param {Object} opts
 * @param {'sine'|'square'|'sawtooth'|'triangle'} opts.type - Oscillator wave
 * @param {number|number[]} opts.freq  - Frequency or [startFreq, endFreq]
 * @param {number} opts.dur            - Duration in seconds
 * @param {number} opts.vol            - Peak volume 0–1
 * @param {number} [opts.attack]       - Attack time in seconds
 * @param {number} [opts.decay]        - Decay time in seconds
 * @param {number} [opts.detune]       - Detune in cents
 * @param {number} [opts.delay]        - Start delay in seconds
 */
function play({ type = 'sine', freq, dur = 0.15, vol = 0.18, attack = 0.01, decay, detune = 0, delay = 0 }) {
  const ctx = getCtx()
  if (!ctx) return

  const t = ctx.currentTime + delay

  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const compressor = ctx.createDynamicsCompressor()

  osc.connect(gain)
  gain.connect(compressor)
  compressor.connect(ctx.destination)

  osc.type = type
  osc.detune.value = detune

  // Frequency: single or glide between two values
  if (Array.isArray(freq)) {
    osc.frequency.setValueAtTime(freq[0], t)
    osc.frequency.exponentialRampToValueAtTime(Math.max(freq[1], 1), t + dur)
  } else {
    osc.frequency.setValueAtTime(freq, t)
  }

  // Amplitude envelope
  const decayTime = decay ?? dur * 0.85
  gain.gain.setValueAtTime(0, t)
  gain.gain.linearRampToValueAtTime(vol, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decayTime)

  osc.start(t)
  osc.stop(t + attack + decayTime + 0.05)

  // Cleanup
  osc.onended = () => {
    try { osc.disconnect(); gain.disconnect(); compressor.disconnect() } catch {}
  }
}

/**
 * Plays multiple notes simultaneously (chord) or in sequence.
 */
function chord(notes, delay = 0) {
  notes.forEach(n => play({ ...n, delay: (n.delay ?? 0) + delay }))
}

/* ── Sound Definitions ────────────────────────────────────── */
const sounds = {
  /**
   * click — Light tap for navigation, toggles, selections.
   * Emotion: responsive, precise.
   */
  click() {
    play({ type: 'triangle', freq: 800, dur: 0.08, vol: 0.12, attack: 0.005, decay: 0.06 })
  },

  /**
   * tab — Slightly softer click for tab switches.
   * Emotion: directional, smooth.
   */
  tab() {
    play({ type: 'sine', freq: 660, dur: 0.1, vol: 0.10, attack: 0.005, decay: 0.08 })
  },

  /**
   * success — Ascending two-tone for confirmations, payments validated.
   * Emotion: achievement, satisfaction.
   */
  success() {
    chord([
      { type: 'sine', freq: 523, dur: 0.18, vol: 0.14, attack: 0.01 },
      { type: 'sine', freq: 784, dur: 0.22, vol: 0.12, attack: 0.01, delay: 0.1 },
    ])
  },

  /**
   * send — Swoosh-up for sending messages.
   * Emotion: motion, departure.
   */
  send() {
    play({ type: 'sine', freq: [300, 900], dur: 0.2, vol: 0.13, attack: 0.01, decay: 0.18 })
  },

  /**
   * receive — Soft descending ping for incoming messages.
   * Emotion: arrival, attention.
   */
  receive() {
    chord([
      { type: 'sine', freq: 880, dur: 0.15, vol: 0.10, attack: 0.01 },
      { type: 'sine', freq: 660, dur: 0.18, vol: 0.08, attack: 0.01, delay: 0.08 },
    ])
  },

  /**
   * notif — Double-ping for notifications.
   * Emotion: gentle alert.
   */
  notif() {
    chord([
      { type: 'sine', freq: 700, dur: 0.12, vol: 0.12, attack: 0.008 },
      { type: 'sine', freq: 900, dur: 0.12, vol: 0.09, attack: 0.008, delay: 0.14 },
    ])
  },

  /**
   * error — Low descending tone for validation errors.
   * Emotion: stop, warning (not harsh).
   */
  error() {
    play({ type: 'triangle', freq: [300, 180], dur: 0.25, vol: 0.15, attack: 0.01, decay: 0.22 })
  },

  /**
   * toggle — Quick blip for switch toggles.
   * Emotion: binary, mechanical.
   */
  toggle() {
    play({ type: 'square', freq: 440, dur: 0.06, vol: 0.08, attack: 0.003, decay: 0.04 })
  },

  /**
   * pay — Richer success sound for payment confirmations.
   * Emotion: significant achievement, value.
   */
  pay() {
    chord([
      { type: 'sine', freq: 392, dur: 0.2,  vol: 0.12, attack: 0.01 },
      { type: 'sine', freq: 523, dur: 0.22, vol: 0.10, attack: 0.01, delay: 0.08 },
      { type: 'sine', freq: 659, dur: 0.28, vol: 0.12, attack: 0.01, delay: 0.18 },
      { type: 'sine', freq: 784, dur: 0.20, vol: 0.09, attack: 0.01, delay: 0.28 },
    ])
  },

  /**
   * install — Celebratory chord for PWA install.
   * Emotion: welcome, enrolled.
   */
  install() {
    chord([
      { type: 'sine', freq: 523, dur: 0.18, vol: 0.13, attack: 0.01 },
      { type: 'sine', freq: 659, dur: 0.18, vol: 0.10, attack: 0.01, delay: 0.12 },
      { type: 'sine', freq: 784, dur: 0.22, vol: 0.12, attack: 0.01, delay: 0.22 },
    ])
  },
}

/* ── Export ───────────────────────────────────────────────── */
export const WalaupSound = sounds

// Register on window for non-module contexts (Navbar inline calls, etc.)
if (typeof window !== 'undefined') {
  window.WalaupSound = sounds
  // Backward-compat aliases from vanilla stack
  window.HiveSound = sounds
  window.BizSound  = sounds
}

export default sounds
