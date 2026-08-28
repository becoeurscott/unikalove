'use client';

/**
 * Small UI sound effects, synthesised with the Web Audio API.
 *
 * Generating the tones costs nothing to ship and avoids four more binary
 * assets on a connection that is often mobile data. Browsers refuse to start
 * audio before a gesture, so the context is created lazily on the first play
 * and a blocked context simply means silence, never an error.
 */

export type SoundName =
  | 'like'
  | 'save'
  | 'pass'
  | 'match'
  | 'message'
  | 'sent'
  | 'notify';

const STORAGE_KEY = 'unika_sound_on';

let ctx: AudioContext | null = null;

export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setSoundEnabled(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off');
  } catch {
    /* storage unavailable — the setting just will not persist */
  }
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    const Ctor = window.AudioContext ?? (window as any).webkitAudioContext;
    if (!Ctor) return null;
    ctx ??= new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

interface Note {
  /** Hertz. */
  freq: number;
  /** Seconds from the start of the effect. */
  at: number;
  /** Seconds. */
  dur: number;
  gain?: number;
  type?: OscillatorType;
}

/** Each effect is a handful of short notes — enough to feel deliberate. */
const EFFECTS: Record<SoundName, Note[]> = {
  // Rising two-note blip — a confirmed, positive action.
  like: [
    { freq: 660, at: 0, dur: 0.09 },
    { freq: 880, at: 0.07, dur: 0.12 },
  ],
  // Softer, lower version — saving is quieter than liking.
  save: [
    { freq: 520, at: 0, dur: 0.09, gain: 0.16 },
    { freq: 700, at: 0.07, dur: 0.11, gain: 0.16 },
  ],
  // A single muted low tick, deliberately unrewarding.
  pass: [{ freq: 240, at: 0, dur: 0.07, gain: 0.1, type: 'sine' }],
  // Four-note arpeggio — the only celebratory sound in the app.
  match: [
    { freq: 587, at: 0, dur: 0.13 },
    { freq: 784, at: 0.1, dur: 0.13 },
    { freq: 988, at: 0.2, dur: 0.15 },
    { freq: 1319, at: 0.32, dur: 0.28, gain: 0.22 },
  ],
  // Incoming message: two soft descending notes.
  message: [
    { freq: 880, at: 0, dur: 0.08, gain: 0.15 },
    { freq: 660, at: 0.08, dur: 0.12, gain: 0.15 },
  ],
  // Outgoing message: one short high tick.
  sent: [{ freq: 1046, at: 0, dur: 0.06, gain: 0.11 }],
  // Badge count went up somewhere in the nav.
  notify: [
    { freq: 784, at: 0, dur: 0.09, gain: 0.14 },
    { freq: 1046, at: 0.09, dur: 0.14, gain: 0.14 },
  ],
};

export function playSound(name: SoundName) {
  if (!isSoundEnabled()) return;
  const ac = audio();
  if (!ac) return;
  const now = ac.currentTime;

  for (const note of EFFECTS[name]) {
    try {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      osc.type = note.type ?? 'triangle';
      osc.frequency.value = note.freq;

      // A short attack and an exponential tail keep it from clicking.
      const peak = note.gain ?? 0.2;
      const start = now + note.at;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.dur);

      osc.connect(gain).connect(ac.destination);
      osc.start(start);
      osc.stop(start + note.dur + 0.02);
    } catch {
      /* one failed note must not break the rest of the effect */
    }
  }
}
