export type VoiceEvent =
  | "welcome" | "selected" | "ready" | "go" | "high" | "mid" | "low" | "wrong"
  | "combo" | "complete" | "fail" | "level" | "summary";

export type Character = {
  id: string; name: string; emoji: string; colorVar: string; tagline: string;
  pitch: number; rate: number; voiceHints: string[]; voiceIndex: number;
  lines: Record<VoiceEvent, string[]>;
};

export const CHARACTERS: Character[] = [
  {
    id: "c1", name: "Character 1", emoji: "🦊", colorVar: "var(--char-1)", tagline: "Friendly, energetic & cheerful",
    pitch: 1.1, rate: 1.05, voiceHints: ["samantha", "google us english", "zira", "female"], voiceIndex: 0,
    lines: {
      welcome: ["Welcome to MotionPlay! Choose your character to begin."],
      selected: ["You selected Character 1. Let's start your workout!"],
      ready: ["Get ready! Copy my pose!", "Get ready for {ex}!"],
      go: ["Go!"],
      high: ["Great job!", "Perfect!", "Keep going!"],
      mid: ["Almost there!", "Keep going!"],
      low: ["Try again!", "Follow my pose!"],
      wrong: ["{hint}!", "Try again! {hint}."],
      combo: ["Combo {n}! Great job!"],
      complete: ["Exercise complete!", "Great job!"],
      fail: ["Try again! You lost a heart."],
      level: ["Level complete! Amazing!"],
      summary: ["Workout complete, {name}! You earned {stars} stars and {coins} coins!"],
    },
  },
  {
    id: "shinchan", name: "Shinchan", emoji: "👦", colorVar: "var(--char-2)", tagline: "Playful, funny & cheeky",
    pitch: 1.75, rate: 1.2, voiceHints: ["junior", "child", "kid", "google uk english female"], voiceIndex: 1,
    lines: {
      welcome: ["Hey hey! Welcome to MotionPlay!"],
      selected: ["Yay! You picked me, Shinchan! Let's do it!"],
      ready: ["Hey! Come on, copy my pose!", "Ooh, {ex} time! Let's do it!"],
      go: ["Go go go!"],
      high: ["Awesome!", "That was super cool!", "Hehe, you're good!"],
      mid: ["Almost!", "Keep going!"],
      low: ["Hey! Copy my pose!", "Wiggle wiggle, try again!"],
      wrong: ["Oopsie! {hint}!", "Hehe, {hint}!"],
      combo: ["Wow! Combo {n}! Super cool!"],
      complete: ["You did it!", "That was super cool!"],
      fail: ["Uh oh! Lost a heart, hehe!"],
      level: ["Level clear! Party time!"],
      summary: ["Yay {name}! {stars} stars and {coins} coins! You did it!"],
    },
  },
  {
    id: "spidey", name: "Spider-Man", emoji: "🕷️", colorVar: "var(--char-3)", tagline: "Confident superhero coach",
    pitch: 0.95, rate: 1.25, voiceHints: ["daniel", "alex", "google uk english male", "david", "male"], voiceIndex: 2,
    lines: {
      welcome: ["Welcome to MotionPlay, hero!"],
      selected: ["Spider-Man on duty! Let's start your workout!"],
      ready: ["Ready? Let's move!", "Get into position for {ex}!"],
      go: ["Go, hero!"],
      high: ["Nice move, hero!", "Excellent work!", "Great job!"],
      mid: ["Hold it!", "Keep going!"],
      low: ["Get into position!", "Focus, hero!"],
      wrong: ["{hint}, hero!", "Adjust! {hint}!"],
      combo: ["Combo {n}! Web-slinging!"],
      complete: ["Mission complete!", "Excellent work!"],
      fail: ["We lost a heart. Shake it off!"],
      level: ["Level cleared! The city is safe!"],
      summary: ["Mission complete, {name}! {stars} stars and {coins} coins earned!"],
    },
  },
  {
    id: "doraemon", name: "Doraemon", emoji: "🐱", colorVar: "var(--char-4)", tagline: "Warm, gentle & helpful",
    pitch: 1.4, rate: 0.92, voiceHints: ["karen", "moira", "google uk english female", "female"], voiceIndex: 3,
    lines: {
      welcome: ["Let's exercise together! Welcome to MotionPlay!"],
      selected: ["You chose Doraemon! Let's exercise together!"],
      ready: ["Get ready! Follow my pose!", "Let's try {ex} together!"],
      go: ["Let's go!"],
      high: ["Excellent!", "Great work!", "Keep holding!"],
      mid: ["Keep holding!", "Don't give up!"],
      low: ["Don't give up!", "Follow my pose, slowly."],
      wrong: ["Gently now, {hint}.", "{hint}. You can do it!"],
      combo: ["Combo {n}! Wonderful!"],
      complete: ["You did it!", "Great work!"],
      fail: ["It's okay! Let's try the next one."],
      level: ["Level complete! I'm so proud of you!"],
      summary: ["You did it, {name}! {stars} stars and {coins} coins!"],
    },
  },
];

export const getCharacter = (id: string) => CHARACTERS.find((c) => c.id === id) ?? CHARACTERS[0]!;

let voices: SpeechSynthesisVoice[] = [];
let muted = false;
export const setMuted = (m: boolean) => { muted = m; if (m && typeof window !== "undefined") window.speechSynthesis?.cancel(); };
export const isMuted = () => muted;

export function initVoices() {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const load = () => { voices = window.speechSynthesis.getVoices(); };
  load();
  window.speechSynthesis.onvoiceschanged = load;
}

function pickVoice(ch: Character) {
  const en = voices.filter((v) => v.lang.toLowerCase().startsWith("en"));
  if (!en.length) return undefined;
  for (const h of ch.voiceHints) {
    const v = en.find((x) => x.name.toLowerCase().includes(h));
    if (v) return v;
  }
  return en[ch.voiceIndex % en.length];
}

export function line(ch: Character, ev: VoiceEvent, vars: Record<string, string | number> = {}) {
  const opts = ch.lines[ev];
  let t = opts[Math.floor(Math.random() * opts.length)] ?? "";
  for (const [k, v] of Object.entries(vars)) t = t.replaceAll(`{${k}}`, String(v));
  return t;
}

export function speak(ch: Character, text: string, interrupt = false) {
  if (muted || typeof window === "undefined" || !("speechSynthesis" in window)) return;
  if (interrupt) window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.pitch = ch.pitch; u.rate = ch.rate;
  const v = pickVoice(ch); if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

export const say = (ch: Character, ev: VoiceEvent, vars?: Record<string, string | number>, interrupt = false) =>
  speak(ch, line(ch, ev, vars), interrupt);
