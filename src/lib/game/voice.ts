import type { Character } from "./config";
import type { VoiceSettings } from "./storage";

const VOL = { low: 0.35, medium: 0.7, high: 1 };
const SPD = { slow: 0.8, normal: 1, fast: 1.3 };

/** Browser text-to-speech voice coach. Never throws; all calls are non-blocking. */
/** speakAsCharacter: set coach.character then call coach.speak(message). */
export class VoiceCoach {
  settings: VoiceSettings;
  character: Character | null = null;
  readonly supported: boolean;
  private lastFeedback = 0;
  private lastFeedbackText = "";

  constructor(settings: VoiceSettings) {
    this.settings = settings;
    this.supported = typeof window !== "undefined" && "speechSynthesis" in window && "SpeechSynthesisUtterance" in window;
    if (this.supported) { try { window.speechSynthesis.getVoices(); } catch { /* ignore */ } }
  }

  /** Pick a distinct browser voice per character (falls back to default voice + pitch/rate). */
  private pickVoice(): SpeechSynthesisVoice | null {
    const voices = window.speechSynthesis.getVoices().filter((v) => v.lang.toLowerCase().startsWith("en"));
    if (!voices.length) return null;
    for (const hint of this.character?.voiceHints ?? []) {
      const m = voices.find((v) => v.name.toLowerCase().includes(hint.toLowerCase()));
      if (m) return m;
    }
    const idx = ["hero", "shinchan", "spiderman", "doraemon"].indexOf(this.character?.id ?? "hero");
    return voices[Math.max(0, idx) % voices.length] ?? null;
  }

  get active() {
    return this.supported && this.settings.enabled;
  }

  cancel() {
    if (!this.supported) return;
    try { window.speechSynthesis.cancel(); } catch { /* ignore */ }
  }

  /** Speak text. Resolves when finished (or after a safety timeout). interrupt = cancel previous speech first. */
  speak(text: string, opts: { interrupt?: boolean } = {}): Promise<void> {
    if (!this.active) return Promise.resolve();
    if (opts.interrupt) this.cancel();
    return new Promise((resolve) => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.volume = VOL[this.settings.volume];
        u.rate = Math.min(2, (this.character?.rate ?? 1) * SPD[this.settings.speed]);
        u.pitch = this.character?.pitch ?? 1;
        u.lang = "en-US";
        const v = this.pickVoice();
        if (v) u.voice = v;
        const timeout = window.setTimeout(resolve, 900 + text.length * 90);
        const done = () => { window.clearTimeout(timeout); resolve(); };
        u.onend = done;
        u.onerror = done;
        window.speechSynthesis.speak(u);
      } catch {
        resolve();
      }
    });
  }

  async sequence(lines: string[], interrupt = true) {
    for (let i = 0; i < lines.length; i++) await this.speak(lines[i]!, { interrupt: interrupt && i === 0 });
  }

  /** Feedback with ~2s cooldown; skipped while other speech plays. */
  feedback(text: string, cooldownMs = 2200) {
    if (!this.active) return false;
    const now = performance.now();
    if (now - this.lastFeedback < cooldownMs) return false;
    if (window.speechSynthesis.speaking) return false;
    if (text === this.lastFeedbackText && now - this.lastFeedback < cooldownMs * 2) return false;
    this.lastFeedback = now;
    this.lastFeedbackText = text;
    void this.speak(text);
    return true;
  }
}
