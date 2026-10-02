import { STANDING_KEYS, type PoseKey } from "./poses";

export type Tier = "easy" | "medium" | "hard" | "special";
export type Mode = "hold" | "reps" | "flow";
export type Exercise = {
  id: number;
  name: string;
  difficulty: Tier;
  parts: string[];
  description: string;
  instructions: string[];
  mode: Mode;
  poses: PoseKey[];
  hold?: number | undefined;
  reps?: number | undefined;
  beatMs?: number;
  loops?: number;
  special?: "random" | "follow";
  sideView?: boolean;
};

type Def = [number, string, Tier, string, string, Mode, PoseKey[], number, string];
// id, name, tier, parts, description, mode, poses, hold-seconds or reps, cue
const DEFS: Def[] = [
  [1, "Arms Up", "easy", "Shoulders, Arms", "Reach both arms straight up to the sky.", "hold", ["armsUp"], 5, "Stretch tall like a rocket"],
  [2, "Left Arm Raise", "easy", "Left Shoulder", "Raise your left arm straight up.", "hold", ["leftUp"], 5, "Keep your right arm relaxed"],
  [3, "Right Arm Raise", "easy", "Right Shoulder", "Raise your right arm straight up.", "hold", ["rightUp"], 5, "Keep your left arm relaxed"],
  [4, "Hands on Hips", "easy", "Shoulders, Core", "Place both hands on your hips, elbows out.", "hold", ["hips"], 5, "Stand proud like a hero"],
  [5, "Hands Above Head", "easy", "Shoulders, Arms", "Join your hands together above your head.", "hold", ["handsTop"], 5, "Make a pointy roof"],
  [6, "Touch Toes", "easy", "Hamstrings, Back", "Bend forward and reach down to your toes.", "hold", ["toeTouch"], 4, "Bend gently, don't bounce"],
  [7, "Side Arm Stretch", "easy", "Shoulders, Chest", "Stretch both arms out to the sides like a T.", "hold", ["tPose"], 6, "Arms level with shoulders"],
  [8, "Front Arm Stretch", "easy", "Shoulders, Upper Back", "Stretch both arms straight forward.", "hold", ["armsFront"], 5, "Reach toward the camera"],
  [9, "Shoulder Circles", "easy", "Shoulders", "Move arms out, up, and down in big circles.", "reps", ["tPose", "armsUp", "stand"], 4, "Big slow circles"],
  [10, "Neck Side Stretch", "easy", "Neck, Shoulders", "Hands on hips, gently tilt your head side to side.", "hold", ["hips"], 6, "Slow and gentle"],
  [11, "Standing Side Bend", "easy", "Obliques, Core", "Reach one arm overhead and bend to each side.", "reps", ["bendLeft", "bendRight"], 4, "Bend like a rainbow"],
  [12, "Heel Raises", "easy", "Calves", "Rise up on your toes with hands up high.", "reps", ["stand", "handsTop"], 6, "Up on tiptoes"],
  [13, "Toe Touch Hold", "easy", "Hamstrings", "Reach down and hold near your toes.", "hold", ["toeTouch"], 8, "Breathe while you hold"],
  [14, "Arm Open and Close", "easy", "Chest, Shoulders", "Open arms wide, then bring them in front.", "reps", ["tPose", "armsFront"], 6, "Like giving a big hug"],
  [15, "Marching in Place", "easy", "Legs, Hips", "March by lifting each knee in turn.", "reps", ["kneeLeft", "kneeRight"], 8, "Left, right, left, right"],
  [16, "Jumping Jacks", "medium", "Full Body", "Jump feet out and arms up, then back in.", "reps", ["stand", "jackOpen"], 10, "Open and close"],
  [17, "Squats", "medium", "Legs, Glutes", "Sit back and down, then stand tall.", "reps", ["stand", "squat"], 8, "Chest up, knees out"],
  [18, "High Knees", "medium", "Legs, Cardio", "Drive each knee up high, quickly.", "reps", ["kneeLeft", "kneeRight"], 10, "Knees to hip height"],
  [19, "Side Steps", "medium", "Legs, Hips", "Step wide, then bring feet together.", "reps", ["wideStance", "stand"], 8, "Quick light feet"],
  [20, "Side Lunges", "medium", "Inner Thighs, Glutes", "Lunge to one side, then the other.", "reps", ["sideLungeLeft", "sideLungeRight"], 6, "Keep the other leg straight"],
  [21, "Front Lunges", "medium", "Legs, Glutes", "Step forward and bend both knees.", "reps", ["stand", "lungeLeft"], 6, "Front knee over ankle"],
  [22, "Standing Knee Raise", "medium", "Hips, Core", "Lift your left knee up and hold.", "hold", ["kneeLeft"], 5, "Balance tall"],
  [23, "Butt Kicks", "medium", "Hamstrings, Cardio", "Kick heels up toward your bottom.", "reps", ["kickLeft", "kickRight"], 10, "Fast feet"],
  [24, "Standing Leg Raise", "medium", "Hips, Quads", "Lift your left leg forward and hold.", "hold", ["legFrontLeft"], 5, "Keep the leg straight"],
  [25, "Standing Side Leg Raise", "medium", "Outer Hips", "Lift your left leg out to the side.", "hold", ["legSideLeft"], 5, "Toes point forward"],
  [26, "Torso Twist", "medium", "Core, Obliques", "Open arms wide then twist them in front.", "reps", ["armsFront", "tPose"], 8, "Turn from your waist"],
  [27, "Standing Cross Crunch", "medium", "Core", "Bring knee up toward the opposite elbow.", "reps", ["crossL", "crossR"], 6, "Squeeze your tummy"],
  [28, "Calf Raises", "medium", "Calves", "Rise onto toes and lower slowly.", "reps", ["stand", "handsTop"], 10, "Slow and controlled"],
  [29, "Knee to Elbow", "medium", "Core, Hips", "Alternate knee-to-elbow touches.", "reps", ["crossL", "crossR"], 8, "Touch and switch"],
  [30, "Side Knee Lift", "medium", "Obliques, Hips", "Lift each knee out to the side.", "reps", ["sideKneeL", "sideKneeR"], 8, "Hands on hips"],
  [31, "Warrior Pose", "hard", "Legs, Shoulders", "Lunge deep with arms stretched wide.", "hold", ["warrior"], 8, "Strong like a warrior"],
  [32, "Tree Pose", "hard", "Balance, Core", "Foot on inner leg, hands together overhead.", "hold", ["tree"], 8, "Find a steady spot to look at"],
  [33, "Single Leg Balance", "hard", "Balance, Ankles", "Stand on one leg with arms out wide.", "hold", ["balance"], 10, "Stay still"],
  [34, "Deep Squat", "hard", "Legs, Hips", "Sink low into a deep squat and hold.", "hold", ["deepSquat"], 8, "Heels down"],
  [35, "Squat + Arms Up", "hard", "Legs, Shoulders", "Squat down while reaching arms up.", "reps", ["stand", "squatArmsUp"], 8, "Reach as you sit"],
  [36, "Lunge + Arms Up", "hard", "Legs, Shoulders", "Hold a lunge with arms reaching up.", "hold", ["lungeArmsUp"], 8, "Tall upper body"],
  [37, "Reverse Lunge", "hard", "Legs, Glutes", "Step back into a lunge, then return.", "reps", ["stand", "lungeRight"], 8, "Step back softly"],
  [38, "Curtsy Lunge", "hard", "Glutes, Thighs", "Cross one leg behind and bend.", "reps", ["stand", "curtsy"], 8, "Like a royal bow"],
  [39, "High Knee Sprint", "hard", "Cardio, Legs", "Sprint in place with very high knees.", "reps", ["kneeLeft", "kneeRight"], 16, "As fast as you can"],
  [40, "Jump Squat", "hard", "Legs, Power", "Squat, then explode up with arms high.", "reps", ["squat", "armsUp"], 8, "Land softly"],
  [41, "Star Jump", "hard", "Full Body, Power", "Crouch, then jump into a big star.", "reps", ["squat", "jackOpen"], 8, "Be a shining star"],
  [42, "Plank", "hard", "Core, Shoulders", "Side-on to camera, hold a straight plank.", "hold", ["plank"], 15, "Straight line head to heels"],
  [43, "Plank Shoulder Tap", "hard", "Core, Shoulders", "In plank, tap a hand to the opposite shoulder.", "reps", ["plankTap", "plank"], 8, "Hips stay still"],
  [44, "Mountain Climbers", "hard", "Core, Cardio", "In plank, drive knees toward chest.", "reps", ["climberL", "climberR"], 12, "Run in the plank"],
  [45, "Push-Up", "hard", "Chest, Arms", "Lower your chest, then push back up.", "reps", ["plank", "pushDown"], 8, "Elbows at 45 degrees"],
  [46, "Side Plank", "hard", "Obliques, Shoulders", "Balance on one arm, other arm up.", "hold", ["sidePlank"], 12, "Lift your hips"],
  [47, "Bear Crawl", "hard", "Full Body", "Shift between hips-high bear and plank.", "reps", ["bear", "plank"], 8, "Knees hover"],
  [48, "Burpee", "hard", "Full Body, Cardio", "Stand, squat, kick to plank, and back.", "reps", ["stand", "squat", "plank"], 6, "Keep moving"],
];

const SIDE = new Set([42, 43, 44, 45, 46, 47, 48]);

export const EXERCISES: Exercise[] = [
  ...DEFS.map(([id, name, difficulty, parts, description, mode, poses, n, cue]): Exercise => ({
    id, name, difficulty, parts: parts.split(", "), description, mode, poses,
    hold: mode === "hold" ? n : undefined,
    reps: mode === "reps" ? n : undefined,
    sideView: SIDE.has(id),
    instructions: [
      description,
      mode === "hold" ? `Hold the pose for ${n} seconds.` : `Complete ${n} reps, matching each pose in order.`,
      cue + ".",
      ...(SIDE.has(id) ? ["Turn sideways so the camera sees your whole body."] : []),
    ],
  })),
  {
    id: 49, name: "Follow the Cartoon", difficulty: "special", parts: ["Full Body", "Reaction"],
    description: "Copy your coach as they jump between random poses.", mode: "flow", poses: [], beatMs: 3000, loops: 1, special: "follow",
    instructions: ["Watch your coach.", "Copy each new pose before the beat ends.", "Every match counts as a hit."],
  },
  {
    id: 50, name: "Random Pose Challenge", difficulty: "special", parts: ["Full Body", "Memory"],
    description: "Match five surprise poses as fast as you can.", mode: "reps", poses: [], reps: 1, special: "random",
    instructions: ["Five random poses appear.", "Match each one to unlock the next.", "Finish them all to win."],
  },
];

export const getExercise = (id: number) => EXERCISES.find((e) => e.id === id);

export type Dance = { id: number; name: string; vibe: string; steps: PoseKey[]; beatMs: number; loops: number };
export const DANCES: Dance[] = [
  { id: 101, name: "Squat Groove", vibe: "Squat → Arms Up → Side Step → Jump → High Knee", steps: ["squat", "armsUp", "wideStance", "jackOpen", "kneeLeft"], beatMs: 1800, loops: 2 },
  { id: 102, name: "Hero Shuffle", vibe: "T-Pose → Lunge → Arms Up → Knee → Star", steps: ["tPose", "lungeLeft", "armsUp", "kneeRight", "jackOpen"], beatMs: 1600, loops: 2 },
  { id: 103, name: "Rainbow Wave", vibe: "Bend Left → Bend Right → Hands Up → Hips → Squat", steps: ["bendLeft", "bendRight", "handsTop", "hips", "squat"], beatMs: 2000, loops: 2 },
  { id: 104, name: "Turbo Party", vibe: "Jack → Squat → Knee L → Knee R → Arms Up → Warrior", steps: ["jackOpen", "squat", "kneeLeft", "kneeRight", "armsUp", "warrior"], beatMs: 1300, loops: 2 },
];

export const danceToExercise = (d: Dance): Exercise => ({
  id: d.id, name: d.name, difficulty: "special", parts: ["Full Body", "Rhythm"], description: d.vibe,
  mode: "flow", poses: d.steps, beatMs: d.beatMs, loops: d.loops,
  instructions: ["Hit each move on the beat.", d.vibe],
});

/** Fill in random poses for special exercises. Call from client code only. */
export function prepare(ex: Exercise): Exercise {
  if (!ex.special) return ex;
  const pick = (n: number) => Array.from({ length: n }, () => STANDING_KEYS[Math.floor(Math.random() * STANDING_KEYS.length)]!);
  return { ...ex, poses: pick(ex.special === "follow" ? 6 : 5) };
}

export type AgeBand = {
  label: string; tiers: Tier[]; hardMax: number; paceMult: number; repMult: number; holdMult: number;
  count: number; tolBonus: number; demoSec: number; voiceEvery: number; note: string;
};

export function ageBand(age: number): AgeBand {
  if (age <= 8) return { label: "Little Movers (5–8)", tiers: ["easy", "special"], hardMax: 0, paceMult: 1.5, repMult: 0.6, holdMult: 0.7, count: 4, tolBonus: 10, demoSec: 6, voiceEvery: 3500, note: "Simple moves, longer demos, slower cartoon, extra voice help." };
  if (age <= 12) return { label: "Junior Heroes (9–12)", tiers: ["easy", "medium", "special"], hardMax: 0, paceMult: 1.2, repMult: 0.8, holdMult: 0.9, count: 5, tolBonus: 5, demoSec: 4, voiceEvery: 5000, note: "Basic + intermediate moves at a moderate pace." };
  if (age <= 17) return { label: "Teen Challengers (13–17)", tiers: ["easy", "medium", "hard", "special"], hardMax: 41, paceMult: 1, repMult: 1.1, holdMult: 1, count: 6, tolBonus: 0, demoSec: 3, voiceEvery: 6000, note: "Intermediate moves, faster pace, more reps, combo challenges." };
  return { label: "Elite Athletes (18–25)", tiers: ["easy", "medium", "hard", "special"], hardMax: 48, paceMult: 0.85, repMult: 1.3, holdMult: 1.2, count: 7, tolBonus: -4, demoSec: 2.5, voiceEvery: 7000, note: "Full library, advanced moves, tighter matching, rapid challenges." };
}

export const isAllowed = (ex: Exercise, band: AgeBand) =>
  band.tiers.includes(ex.difficulty) && (ex.difficulty !== "hard" || ex.id <= band.hardMax);

export const BASE_TOL = { easy: 38, medium: 30, hard: 23 } as const;

export function buildWorkout(age: number, difficulty: "easy" | "medium" | "hard"): Exercise[] {
  const band = ageBand(age);
  const want: Tier[] = difficulty === "easy" ? ["easy"] : difficulty === "medium" ? ["easy", "medium"] : ["medium", "hard"];
  let pool = EXERCISES.filter((e) => isAllowed(e, band) && want.includes(e.difficulty));
  if (pool.length < band.count) pool = EXERCISES.filter((e) => isAllowed(e, band) && e.difficulty !== "special");
  const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, band.count - 1);
  return [...shuffled, getExercise(Math.random() < 0.5 ? 49 : 50)!];
}
