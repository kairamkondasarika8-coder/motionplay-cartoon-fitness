import heroImg from "@/assets/char-hero.png";
import shinImg from "@/assets/char-shinchan.png";
import spideyImg from "@/assets/char-spiderman.png";
import doraImg from "@/assets/char-doraemon.png";

export type CharacterId = "hero" | "shinchan" | "spiderman" | "doraemon";

export type Character = {
  id: CharacterId;
  name: string;
  image: string;
  tagline: string;
  personality: string;
  /** preferred browser voice names, first match wins */
  voiceHints: string[];
  pitch: number;
  rate: number;
  lines: { intro: string; ready: string; going: string; good: string; almost: string; done: string; retry: string; watch: string; turn: string; level: string };
};

export const CHARACTERS: Character[] = [
  {
    id: "hero", name: "Character 1", image: heroImg, tagline: "Your friendly fitness buddy", personality: "Friendly · Energetic · Cheerful",
    voiceHints: ["Google US English", "Samantha", "Microsoft Aria", "Microsoft Jenny", "Female"], pitch: 1.05, rate: 1,
    lines: { intro: "Welcome to MotionPlay!", ready: "Get ready!", going: "Keep going!", good: "Great job!", almost: "Almost there!", done: "Exercise complete!", retry: "Try again!", watch: "Watch me first!", turn: "Your turn! Copy my pose!", level: "Level complete! You're doing amazing!" },
  },
  {
    id: "shinchan", name: "Shinchan", image: shinImg, tagline: "Silly moves, big smiles", personality: "Playful · Funny · Child-like",
    voiceHints: ["Google UK English Female", "Karen", "Junior", "Microsoft Ana", "Kathy"], pitch: 1.9, rate: 1.12,
    lines: { intro: "Hey hey! Come on, let's do it!", ready: "Hey! Come on, copy my pose!", going: "Keep going!", good: "Awesome!", almost: "Almost!", done: "You did it! That was super cool!", retry: "Oopsie! Try again!", watch: "Hey! Watch me, watch me!", turn: "Your turn! Come on, copy me!", level: "Wooo! Level complete! Super cool!" },
  },
  {
    id: "spiderman", name: "Spider-Man", image: spideyImg, tagline: "Agile hero training", personality: "Confident · Fast · Heroic",
    voiceHints: ["Google UK English Male", "Daniel", "Microsoft Guy", "Microsoft David", "Alex", "Fred", "Male"], pitch: 0.9, rate: 1.15,
    lines: { intro: "Ready? Let's move, hero!", ready: "Get into position!", going: "Keep going!", good: "Nice move, hero!", almost: "Hold it!", done: "Mission complete!", retry: "Get into position!", watch: "Watch my moves!", turn: "Your turn, hero!", level: "Level complete! Excellent work, hero!" },
  },
  {
    id: "doraemon", name: "Doraemon", image: doraImg, tagline: "Gadget-powered workouts", personality: "Cute · Gentle · Helpful",
    voiceHints: ["Microsoft Zira", "Victoria", "Tessa", "Moira", "Google US English"], pitch: 1.45, rate: 0.92,
    lines: { intro: "Let's exercise together!", ready: "Get ready!", going: "Keep holding!", good: "Excellent!", almost: "Don't give up!", done: "You did it! Great work!", retry: "Don't give up!", watch: "Follow my pose! Watch me first.", turn: "Now it's your turn!", level: "Level complete! Great work!" },
  },
];

export type Difficulty = "easy" | "medium" | "hard";
export type DiffCfg = {
  label: string; module: string; purpose: string; threshold: number; time: number; hold: number; mult: number;
  /** cartoon animation cycle length in seconds */
  anim: number; levels: number[]; pool: string[]; maxStars: number;
  demoLines: string[]; badges: string[];
};
export const DIFFICULTY: Record<Difficulty, DiffCfg> = {
  easy: {
    label: "Easy", module: "Learning Module", purpose: "Learn basic movements", threshold: 70, time: 15, hold: 3, mult: 1, anim: 3.4,
    levels: [10, 10, 10], pool: ["arms-up", "left-arm", "right-arm", "hands-hips", "hands-above", "touch-toes"], maxStars: 3,
    demoLines: ["Watch carefully.", "Now copy me.", "Take your time."], badges: ["First Move", "Beginner", "Getting Started"],
  },
  medium: {
    label: "Medium", module: "Fitness Challenge", purpose: "Coordination, balance and speed", threshold: 80, time: 12, hold: 4, mult: 1.5, anim: 2.3,
    levels: [10, 10, 10], pool: ["jumping-jack", "squat", "side-stretch", "warrior", "high-knees", "touch-toes", "left-arm", "right-arm"], maxStars: 4,
    demoLines: ["Ready?", "Follow my movement!", "Keep going!"], badges: ["Combo Master", "Fitness Explorer", "Motion Pro"],
  },
  hard: {
    label: "Hard", module: "Advanced Motion Challenge", purpose: "Speed, balance and precision", threshold: 90, time: 10, hold: 5, mult: 2, anim: 1.5,
    levels: [10, 10, 10], pool: ["warrior", "tree", "high-knees", "jumping-jack", "squat", "side-stretch", "touch-toes", "one-leg", "rapid-arms", "squat-arms"], maxStars: 5,
    demoLines: ["Ready for the challenge?", "Keep up!", "Can you match me?"], badges: ["Perfect Pose", "Speed Master", "Balance Expert", "Motion Champion"],
  },
};
export const DIFF_ORDER: Difficulty[] = ["easy", "medium", "hard"];

/** Age-based adjustments layered on top of the chosen difficulty. */
export function ageAdjust(age: number) {
  if (age <= 8) return { group: "5–8", timeAdd: 5, holdAdd: -1, animMul: 1.5, extraGuide: true };
  if (age <= 12) return { group: "9–12", timeAdd: 2, holdAdd: 0, animMul: 1.2, extraGuide: true };
  if (age <= 17) return { group: "13–17", timeAdd: 0, holdAdd: 0, animMul: 1, extraGuide: false };
  return { group: "18–25", timeAdd: -1, holdAdd: 0, animMul: 0.85, extraGuide: false };
}

export const ACHIEVEMENTS = [
  { id: "first-move", name: "First Move", icon: "👟", desc: "Complete your first exercise" },
  { id: "five-stars", name: "Five Stars", icon: "⭐", desc: "Earn 5 stars in one game" },
  { id: "combo-master", name: "Combo Master", icon: "🔥", desc: "Reach a 5 combo" },
  { id: "balance-expert", name: "Balance Expert", icon: "🧘", desc: "Complete a balance pose" },
  { id: "motion-champion", name: "Motion Champion", icon: "🏆", desc: "Complete all 3 levels" },
] as const;
export type AchievementId = (typeof ACHIEVEMENTS)[number]["id"];

export const starsFor = (acc: number, max = 3) => {
  const steps = [70, 85, 92, 96, 98].slice(0, max);
  return Math.max(1, steps.filter((s) => acc >= s).length);
};
