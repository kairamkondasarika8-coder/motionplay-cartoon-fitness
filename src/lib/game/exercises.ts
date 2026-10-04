export type Landmark = { x: number; y: number; z?: number; visibility?: number };

type Idx = 0 | 11 | 12 | 13 | 14 | 15 | 16 | 23 | 24 | 25 | 26 | 27 | 28;
export type Pose = { [K in Idx]: Landmark };

export type TargetPose = {
  /** arm angles in degrees, 0 = straight down, 90 = sideways, 180 = straight up */
  lArm: number;
  rArm: number;
  legs: "stand" | "wide" | "squat" | "treeL" | "kneeL" | "warrior" | "bend" | "hips";
  lean?: number;
};

export type Exercise = {
  id: string;
  name: string;
  instructions: string[];
  target: TargetPose;
  balance?: boolean;
  score: (lm: Pose) => number; // 0..100
};

const clamp = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const dist = (a: Landmark, b: Landmark) => Math.hypot(a.x - b.x, a.y - b.y);
function angle(a: Landmark, b: Landmark, c: Landmark) {
  const ab = Math.atan2(a.y - b.y, a.x - b.x);
  const cb = Math.atan2(c.y - b.y, c.x - b.x);
  let d = Math.abs(((ab - cb) * 180) / Math.PI);
  if (d > 180) d = 360 - d;
  return d;
}
/** 1 inside [lo,hi], linear falloff over `soft` outside */
const inRange = (v: number, lo: number, hi: number, soft: number) =>
  v < lo ? clamp(1 - (lo - v) / soft) : v > hi ? clamp(1 - (v - hi) / soft) : 1;
/** how much `a` is above `b` (y smaller), full score at margin */
const above = (a: Landmark, b: Landmark, margin = 0.05) => clamp((b.y - a.y) / margin + 0.5);
const avg = (xs: number[]) => (xs.reduce((s, x) => s + x, 0) / xs.length) * 100;

// MediaPipe indices
const NOSE = 0 as const, LS = 11 as const, RS = 12 as const, LE = 13, RE = 14, LW = 15, RW = 16, LH = 23, RH = 24, LK = 25, RK = 26, LA = 27, RA = 28;
const sw = (l: Pose) => Math.max(dist(l[LS], l[RS]), 0.05);
const armStraight = (l: Pose, s: Idx, e: Idx, w: Idx) => inRange(angle(l[s], l[e], l[w]), 145, 180, 50);
const kneeAngle = (l: Pose, h: Idx, k: Idx, a: Idx) => angle(l[h], l[k], l[a]);

export const EXERCISES: Exercise[] = [
  {
    id: "arms-up", name: "Arms Up",
    instructions: ["Stand straight.", "Raise both arms above your head.", "Keep your arms straight.", "Hold the pose."],
    target: { lArm: 175, rArm: 175, legs: "stand" },
    score: (l) => avg([above(l[LW], l[NOSE]), above(l[RW], l[NOSE]), armStraight(l, LS, LE, LW), armStraight(l, RS, RE, RW)]),
  },
  {
    id: "left-arm", name: "Left Arm Raise",
    instructions: ["Stand straight.", "Raise your left arm above your head.", "Keep your right arm down.", "Hold the pose."],
    target: { lArm: 175, rArm: 10, legs: "stand" },
    score: (l) => avg([above(l[LW], l[NOSE]), clamp((l[RW].y - l[RS].y) / 0.15), armStraight(l, LS, LE, LW)]),
  },
  {
    id: "right-arm", name: "Right Arm Raise",
    instructions: ["Stand straight.", "Raise your right arm above your head.", "Keep your left arm down.", "Hold the pose."],
    target: { lArm: 10, rArm: 175, legs: "stand" },
    score: (l) => avg([above(l[RW], l[NOSE]), clamp((l[LW].y - l[LS].y) / 0.15), armStraight(l, RS, RE, RW)]),
  },
  {
    id: "jumping-jack", name: "Jumping Jack",
    instructions: ["Jump your feet wide apart.", "Raise both arms above your head.", "Make a big star shape.", "Hold the position."],
    target: { lArm: 150, rArm: 150, legs: "wide" },
    score: (l) => avg([above(l[LW], l[NOSE]), above(l[RW], l[NOSE]), clamp(Math.abs(l[LA].x - l[RA].x) / (sw(l) * 1.6))]),
  },
  {
    id: "squat", name: "Squat",
    instructions: ["Stand with your feet shoulder width apart.", "Bend your knees.", "Lower your body.", "Keep your back straight.", "Hold the position."],
    target: { lArm: 90, rArm: 90, legs: "squat" },
    score: (l) => avg([inRange(kneeAngle(l, LH, LK, LA), 70, 125, 50), inRange(kneeAngle(l, RH, RK, RA), 70, 125, 50)]),
  },
  {
    id: "touch-toes", name: "Touch Toes",
    instructions: ["Stand with your feet together.", "Bend forward at your hips.", "Reach your hands down to your toes.", "Hold the stretch."],
    target: { lArm: 0, rArm: 0, legs: "bend" },
    score: (l) => avg([clamp((l[LW].y - l[LK].y) / 0.1 + 0.6), clamp((l[RW].y - l[RK].y) / 0.1 + 0.6), inRange(angle(l[LS], l[LH], l[LK]), 20, 110, 50)]),
  },
  {
    id: "hands-hips", name: "Hands on Hips",
    instructions: ["Stand straight.", "Place both hands on your hips.", "Point your elbows out.", "Hold the pose."],
    target: { lArm: 25, rArm: 25, legs: "hips" },
    score: (l) => avg([clamp(1 - (dist(l[LW], l[LH]) - 0.06) / 0.12), clamp(1 - (dist(l[RW], l[RH]) - 0.06) / 0.12), inRange(angle(l[LS], l[LE], l[LW]), 50, 130, 40), inRange(angle(l[RS], l[RE], l[RW]), 50, 130, 40)]),
  },
  {
    id: "side-stretch", name: "Side Stretch",
    instructions: ["Stand straight.", "Raise both arms above your head.", "Lean your body to one side.", "Hold the stretch."],
    target: { lArm: 160, rArm: 175, legs: "stand", lean: 15 },
    score: (l) => {
      const shoulderX = (l[LS].x + l[RS].x) / 2, hipX = (l[LH].x + l[RH].x) / 2;
      return avg([above(l[LW], l[NOSE]), above(l[RW], l[NOSE]), clamp(Math.abs(shoulderX - hipX) / 0.06)]);
    },
  },
  {
    id: "warrior", name: "Warrior Pose",
    instructions: ["Step your feet wide apart.", "Bend your front knee.", "Stretch your arms out to the sides.", "Hold the position."],
    target: { lArm: 90, rArm: 90, legs: "warrior" },
    score: (l) => {
      const kl = kneeAngle(l, LH, LK, LA), kr = kneeAngle(l, RH, RK, RA);
      const bent = Math.min(kl, kr), straight = Math.max(kl, kr);
      return avg([clamp(1 - Math.abs(l[LW].y - l[LS].y) / 0.12), clamp(1 - Math.abs(l[RW].y - l[RS].y) / 0.12), inRange(bent, 80, 140, 40), inRange(straight, 150, 180, 40)]);
    },
  },
  {
    id: "tree", name: "Tree Pose", balance: true,
    instructions: ["Stand straight.", "Lift one foot.", "Keep your balance.", "Hold the position."],
    target: { lArm: 170, rArm: 170, legs: "treeL" },
    score: (l) => {
      const lift = Math.abs(l[LA].y - l[RA].y);
      const standing = l[LA].y > l[RA].y ? kneeAngle(l, LH, LK, LA) : kneeAngle(l, RH, RK, RA);
      return avg([clamp(lift / 0.1), clamp(lift / 0.1), inRange(standing, 155, 180, 40)]);
    },
  },
  {
    id: "high-knees", name: "High Knees",
    instructions: ["Stand straight.", "Lift one knee up high.", "Bring it to hip height.", "Hold the position."],
    target: { lArm: 40, rArm: 40, legs: "kneeL" },
    score: (l) => {
      const best = Math.max(clamp((l[LH].y + 0.08 - l[LK].y) / 0.1), clamp((l[RH].y + 0.08 - l[RK].y) / 0.1));
      return best * 100;
    },
  },
  {
    id: "one-leg", name: "One-Leg Balance", balance: true,
    instructions: ["Stand tall.", "Lift one knee up.", "Stretch your arms out to the sides.", "Balance and hold."],
    target: { lArm: 90, rArm: 90, legs: "kneeL" },
    score: (l) => {
      const lift = Math.abs(l[LA].y - l[RA].y);
      return avg([clamp(lift / 0.1), clamp(1 - Math.abs(l[LW].y - l[LS].y) / 0.12), clamp(1 - Math.abs(l[RW].y - l[RS].y) / 0.12)]);
    },
  },
  {
    id: "rapid-arms", name: "Rapid Arms Up",
    instructions: ["Stand straight.", "Shoot both arms up fast.", "Keep them straight.", "Hold at the top."],
    target: { lArm: 178, rArm: 178, legs: "stand" },
    score: (l) => avg([above(l[LW], l[NOSE], 0.04), above(l[RW], l[NOSE], 0.04), armStraight(l, LS, LE, LW), armStraight(l, RS, RE, RW)]),
  },
  {
    id: "squat-arms", name: "Squat + Arms Up",
    instructions: ["Bend your knees into a squat.", "Stand up and raise both arms.", "Repeat with me.", "Hold either pose."],
    target: { lArm: 175, rArm: 175, legs: "stand" },
    score: (l) => Math.max(
      avg([inRange(kneeAngle(l, LH, LK, LA), 70, 125, 50), inRange(kneeAngle(l, RH, RK, RA), 70, 125, 50)]),
      avg([above(l[LW], l[NOSE]), above(l[RW], l[NOSE]), armStraight(l, LS, LE, LW), armStraight(l, RS, RE, RW)]),
    ),
  },
  {
    id: "hands-above", name: "Hands Above Head",
    instructions: ["Stand straight.", "Raise both hands above your head.", "Bring your hands together.", "Hold the pose."],
    target: { lArm: 165, rArm: 165, legs: "stand" },
    score: (l) => avg([above(l[LW], l[NOSE], 0.08), above(l[RW], l[NOSE], 0.08), clamp(1 - (dist(l[LW], l[RW]) - sw(l) * 0.4) / sw(l))]),
  },
];

export const LEVELS: string[][] = [
  ["arms-up", "left-arm", "right-arm", "hands-hips"],
  ["hands-above", "jumping-jack", "squat", "side-stretch"],
  ["touch-toes", "high-knees", "warrior", "tree"],
];

/** Build the level list for a difficulty module: each level draws a different slice of the pool. */
export function buildLevels(pool: string[], sizes: number[], shorten = false): string[][] {
  let k = 0;
  return sizes.map((n) => {
    const size = shorten ? Math.max(2, n - 1) : n;
    const lvl = Array.from({ length: size }, (_, i) => pool[(k + i) % pool.length]!);
    k += size;
    return lvl;
  });
}

export const getExercise = (id: string) => EXERCISES.find((e) => e.id === id)!;

export function scorePose(ex: Exercise, lm: Landmark[] | undefined): number {
  if (!lm || lm.length < 29) return 0;
  const pose = lm as unknown as Pose;
  const key = ([LS, RS, LH, RH] as const).map((i) => pose[i].visibility ?? 1);
  if (Math.min(...key) < 0.3) return 0;
  return Math.round(clamp(ex.score(pose) / 100) * 100);
}
