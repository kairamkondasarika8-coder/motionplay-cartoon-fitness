export type Difficulty = "easy" | "medium" | "hard";
export type Profile = { name: string; age: number; gender: string; characterId: string; difficulty: Difficulty };
export type ExResult = { exId: number; name: string; accuracy: number; success: boolean; stars: number };
export type SessionRec = {
  id: string; date: string; mode: string; durationSec: number; stars: number; coins: number;
  score: number; bestCombo: number; results: ExResult[];
};

const PK = "motionplay.profile";
const HK = "motionplay.history";

export function loadProfile(): Profile | null {
  try { const p = JSON.parse(localStorage.getItem(PK) || "null"); return p && p.age >= 5 && p.age <= 25 ? p : null; } catch { return null; }
}
export const saveProfile = (p: Profile) => localStorage.setItem(PK, JSON.stringify(p));
export function loadHistory(): SessionRec[] {
  try { return JSON.parse(localStorage.getItem(HK) || "[]"); } catch { return []; }
}
export function addSession(s: SessionRec) {
  localStorage.setItem(HK, JSON.stringify([...loadHistory(), s].slice(-300)));
}
