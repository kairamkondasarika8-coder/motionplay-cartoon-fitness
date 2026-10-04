import type { AchievementId, CharacterId, Difficulty } from "./config";

export type VoiceVolume = "low" | "medium" | "high";
export type VoiceSpeed = "slow" | "normal" | "fast";
export type VoiceSettings = { enabled: boolean; volume: VoiceVolume; speed: VoiceSpeed };

export type ExerciseResult = { id: string; name: string; accuracy: number; success: boolean; stars: number };
export type Session = {
  date: string;
  character: CharacterId;
  difficulty: Difficulty;
  score: number;
  stars: number;
  maxCombo: number;
  levelsCompleted: number;
  completed: boolean;
  results: ExerciseResult[];
  coins?: number;
  playerName?: string;
};

const read = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? { ...fallback, ...JSON.parse(v) } : fallback;
  } catch {
    return fallback;
  }
};
const readArr = <T,>(key: string): T[] => {
  try {
    const v = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
};
const write = (key: string, v: unknown) => {
  try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* ignore */ }
};

export const DEFAULT_VOICE: VoiceSettings = { enabled: true, volume: "medium", speed: "normal" };
export const loadVoice = () => read<VoiceSettings>("mp.voice", DEFAULT_VOICE);
export const saveVoice = (v: VoiceSettings) => write("mp.voice", v);

export const loadHistory = () => readArr<Session>("mp.history");
export const saveSession = (s: Session) => write("mp.history", [s, ...loadHistory()].slice(0, 50));
export const personalBest = () => loadHistory().reduce((m, s) => Math.max(m, s.score), 0);

export const loadAchievements = () => readArr<AchievementId>("mp.achievements");
export const saveAchievements = (a: AchievementId[]) => write("mp.achievements", a);

export type Gender = "Male" | "Female" | "Other" | "Prefer not to say";
export type Profile = { name: string; age: number; gender: Gender; avatar?: string | null };
export const loadProfile = (): Profile | null => {
  try {
    const v = JSON.parse(localStorage.getItem("mp.profile") || "null");
    return v && typeof v.name === "string" && Number.isInteger(v.age) ? v : null;
  } catch { return null; }
};
export const saveProfile = (p: Profile) => write("mp.profile", p);

export const loadCoins = (): number => {
  try { return Math.max(0, parseInt(localStorage.getItem("mp.coins") || "0", 10) || 0); } catch { return 0; }
};
export const addCoins = (n: number) => { const c = loadCoins() + n; write("mp.coins", c); return c; };
