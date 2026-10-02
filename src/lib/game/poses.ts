export type P = [number, number];
export type Kp = {
  ls: P; rs: P; le: P; re: P; lw: P; rw: P;
  lh: P; rh: P; lk: P; rk: P; la: P; ra: P;
};

const STAND: Kp = {
  ls: [0.42, 0.3], rs: [0.58, 0.3], le: [0.4, 0.42], re: [0.6, 0.42],
  lw: [0.39, 0.53], rw: [0.61, 0.53], lh: [0.45, 0.55], rh: [0.55, 0.55],
  lk: [0.45, 0.72], rk: [0.55, 0.72], la: [0.45, 0.9], ra: [0.55, 0.9],
};
const mk = (o: Partial<Kp>, base: Kp = STAND): Kp => ({ ...base, ...o });

const armsUp = mk({ le: [0.4, 0.18], lw: [0.4, 0.06], re: [0.6, 0.18], rw: [0.6, 0.06] });
const tPose = mk({ le: [0.3, 0.3], lw: [0.18, 0.3], re: [0.7, 0.3], rw: [0.82, 0.3] });
const kneeLeft = mk({ lk: [0.42, 0.6], la: [0.45, 0.74] });
const kneeRight = mk({ rk: [0.58, 0.6], ra: [0.55, 0.74] });
const squat = mk({
  ls: [0.42, 0.42], rs: [0.58, 0.42], le: [0.36, 0.44], re: [0.64, 0.44],
  lw: [0.34, 0.42], rw: [0.66, 0.42], lh: [0.44, 0.66], rh: [0.56, 0.66],
  lk: [0.36, 0.74], rk: [0.64, 0.74], la: [0.42, 0.9], ra: [0.58, 0.9],
});
const lungeLeft = mk({
  ls: [0.42, 0.38], rs: [0.58, 0.38], le: [0.4, 0.5], re: [0.6, 0.5], lw: [0.4, 0.6], rw: [0.6, 0.6],
  lh: [0.45, 0.62], rh: [0.55, 0.62], lk: [0.34, 0.72], la: [0.32, 0.9], rk: [0.6, 0.8], ra: [0.7, 0.9],
});
const lungeRight = mk({
  ls: [0.42, 0.38], rs: [0.58, 0.38], le: [0.4, 0.5], re: [0.6, 0.5], lw: [0.4, 0.6], rw: [0.6, 0.6],
  lh: [0.45, 0.62], rh: [0.55, 0.62], rk: [0.66, 0.72], ra: [0.68, 0.9], lk: [0.4, 0.8], la: [0.3, 0.9],
});
const plank = mk({
  ls: [0.28, 0.5], rs: [0.29, 0.5], le: [0.28, 0.6], re: [0.29, 0.6], lw: [0.28, 0.7], rw: [0.29, 0.7],
  lh: [0.55, 0.52], rh: [0.56, 0.52], lk: [0.72, 0.56], rk: [0.73, 0.56], la: [0.88, 0.6], ra: [0.89, 0.6],
});

export const POSES = {
  stand: STAND,
  armsUp,
  leftUp: mk({ le: [0.4, 0.18], lw: [0.4, 0.06] }),
  rightUp: mk({ re: [0.6, 0.18], rw: [0.6, 0.06] }),
  hips: mk({ le: [0.33, 0.43], lw: [0.44, 0.55], re: [0.67, 0.43], rw: [0.56, 0.55] }),
  handsTop: mk({ le: [0.36, 0.18], lw: [0.48, 0.06], re: [0.64, 0.18], rw: [0.52, 0.06] }),
  toeTouch: mk({
    ls: [0.44, 0.52], rs: [0.56, 0.52], le: [0.44, 0.68], re: [0.56, 0.68],
    lw: [0.45, 0.84], rw: [0.55, 0.84], lh: [0.45, 0.48], rh: [0.55, 0.48],
  }),
  tPose,
  armsFront: mk({ le: [0.38, 0.32], lw: [0.37, 0.33], re: [0.62, 0.32], rw: [0.63, 0.33] }),
  bendLeft: mk({ ls: [0.38, 0.33], rs: [0.54, 0.28], le: [0.33, 0.44], lw: [0.32, 0.55], re: [0.5, 0.16], rw: [0.42, 0.06] }),
  bendRight: mk({ ls: [0.46, 0.28], rs: [0.62, 0.33], re: [0.67, 0.44], rw: [0.68, 0.55], le: [0.5, 0.16], lw: [0.58, 0.06] }),
  kneeLeft,
  kneeRight,
  jackOpen: mk({ le: [0.33, 0.18], lw: [0.28, 0.07], re: [0.67, 0.18], rw: [0.72, 0.07], lk: [0.4, 0.72], la: [0.35, 0.9], rk: [0.6, 0.72], ra: [0.65, 0.9] }),
  squat,
  squatArmsUp: mk({ le: [0.4, 0.3], lw: [0.4, 0.18], re: [0.6, 0.3], rw: [0.6, 0.18] }, squat),
  deepSquat: mk({ lh: [0.44, 0.74], rh: [0.56, 0.74], lk: [0.34, 0.76], rk: [0.66, 0.76], ls: [0.42, 0.5], rs: [0.58, 0.5], le: [0.4, 0.62], re: [0.6, 0.62], lw: [0.47, 0.62], rw: [0.53, 0.62] }, squat),
  wideStance: mk({ lk: [0.38, 0.72], la: [0.32, 0.9], rk: [0.62, 0.72], ra: [0.68, 0.9] }),
  sideLungeLeft: mk({ lh: [0.44, 0.64], rh: [0.54, 0.64], lk: [0.32, 0.74], la: [0.3, 0.9], rk: [0.62, 0.78], ra: [0.72, 0.9], ls: [0.4, 0.4], rs: [0.56, 0.4], le: [0.38, 0.5], re: [0.58, 0.5], lw: [0.44, 0.56], rw: [0.52, 0.56] }),
  sideLungeRight: mk({ lh: [0.46, 0.64], rh: [0.56, 0.64], rk: [0.68, 0.74], ra: [0.7, 0.9], lk: [0.38, 0.78], la: [0.28, 0.9], ls: [0.44, 0.4], rs: [0.6, 0.4], le: [0.42, 0.5], re: [0.62, 0.5], lw: [0.48, 0.56], rw: [0.56, 0.56] }),
  lungeLeft,
  lungeRight,
  lungeArmsUp: mk({ le: [0.4, 0.26], lw: [0.4, 0.14], re: [0.6, 0.26], rw: [0.6, 0.14] }, lungeLeft),
  kickLeft: mk({ la: [0.46, 0.66] }),
  kickRight: mk({ ra: [0.54, 0.66] }),
  legSideLeft: mk({ lk: [0.38, 0.71], la: [0.29, 0.85] }),
  legSideRight: mk({ rk: [0.62, 0.71], ra: [0.71, 0.85] }),
  legFrontLeft: mk({ lk: [0.45, 0.66], la: [0.45, 0.76] }),
  crossL: mk({ re: [0.5, 0.47], rw: [0.58, 0.32] }, kneeLeft),
  crossR: mk({ le: [0.5, 0.47], lw: [0.42, 0.32] }, kneeRight),
  sideKneeL: mk({ lk: [0.33, 0.62], la: [0.43, 0.74], le: [0.33, 0.43], lw: [0.44, 0.55], re: [0.67, 0.43], rw: [0.56, 0.55] }),
  sideKneeR: mk({ rk: [0.67, 0.62], ra: [0.57, 0.74], le: [0.33, 0.43], lw: [0.44, 0.55], re: [0.67, 0.43], rw: [0.56, 0.55] }),
  warrior: mk({ le: [0.3, 0.38], lw: [0.18, 0.38], re: [0.7, 0.38], rw: [0.82, 0.38] }, lungeLeft),
  tree: mk({ lk: [0.36, 0.68], la: [0.47, 0.72], le: [0.38, 0.18], lw: [0.49, 0.06], re: [0.62, 0.18], rw: [0.51, 0.06] }),
  balance: mk({ le: [0.3, 0.3], lw: [0.18, 0.3], re: [0.7, 0.3], rw: [0.82, 0.3] }, kneeLeft),
  curtsy: mk({ lh: [0.45, 0.62], rh: [0.55, 0.62], lk: [0.42, 0.74], la: [0.44, 0.9], rk: [0.48, 0.78], ra: [0.38, 0.9], ls: [0.42, 0.38], rs: [0.58, 0.38], le: [0.4, 0.5], re: [0.6, 0.5], lw: [0.46, 0.58], rw: [0.54, 0.58] }),
  plank,
  pushDown: mk({ ls: [0.28, 0.62], rs: [0.29, 0.62], le: [0.36, 0.64], re: [0.37, 0.64], lw: [0.28, 0.7], rw: [0.29, 0.7], lh: [0.55, 0.63], rh: [0.56, 0.63], lk: [0.72, 0.65], rk: [0.73, 0.65], la: [0.88, 0.67], ra: [0.89, 0.67] }),
  plankTap: mk({ le: [0.36, 0.6], lw: [0.3, 0.53] }, plank),
  climberL: mk({ lk: [0.42, 0.62], la: [0.55, 0.66] }, plank),
  climberR: mk({ rk: [0.42, 0.62], ra: [0.55, 0.66] }, plank),
  sidePlank: mk({ re: [0.29, 0.4], rw: [0.29, 0.3], lh: [0.55, 0.56], rh: [0.56, 0.56] }, plank),
  bear: mk({ lh: [0.55, 0.42], rh: [0.56, 0.42], lk: [0.64, 0.6], rk: [0.65, 0.6], la: [0.8, 0.7], ra: [0.81, 0.7] }, plank),
} satisfies Record<string, Kp>;

export type PoseKey = keyof typeof POSES;
export const POSE_KEYS = Object.keys(POSES) as PoseKey[];
export const STANDING_KEYS: PoseKey[] = ["armsUp", "leftUp", "rightUp", "hips", "handsTop", "tPose", "kneeLeft", "kneeRight", "jackOpen", "squat", "bendLeft", "bendRight", "wideStance", "lungeLeft", "tree", "warrior"];

function ang(a: P, b: P, c: P) {
  const v1: P = [a[0] - b[0], a[1] - b[1]];
  const v2: P = [c[0] - b[0], c[1] - b[1]];
  const d = Math.hypot(v1[0], v1[1]) * Math.hypot(v2[0], v2[1]) || 1e-6;
  const cos = Math.max(-1, Math.min(1, (v1[0] * v2[0] + v1[1] * v2[1]) / d));
  return (Math.acos(cos) * 180) / Math.PI;
}

export const JOINT_NAMES = ["left elbow", "right elbow", "left arm", "right arm", "left hip", "right hip", "left knee", "right knee", "body lean"];

export function features(k: Kp): number[] {
  const ms: P = [(k.ls[0] + k.rs[0]) / 2, (k.ls[1] + k.rs[1]) / 2];
  const mh: P = [(k.lh[0] + k.rh[0]) / 2, (k.lh[1] + k.rh[1]) / 2];
  const torso = Math.abs((Math.atan2(ms[0] - mh[0], -(ms[1] - mh[1])) * 180) / Math.PI);
  return [
    ang(k.ls, k.le, k.lw), ang(k.rs, k.re, k.rw),
    ang(k.lh, k.ls, k.le), ang(k.rh, k.rs, k.re),
    ang(k.ls, k.lh, k.lk), ang(k.rs, k.rh, k.rk),
    ang(k.lh, k.lk, k.la), ang(k.rh, k.rk, k.ra),
    torso,
  ];
}

const featCache = new Map<PoseKey, number[]>();
export function poseFeatures(key: PoseKey) {
  let f = featCache.get(key);
  if (!f) { f = features(POSES[key]); featCache.set(key, f); }
  return f;
}

/** Returns accuracy 0-100 and the worst joint index + signed diff. */
export function compare(user: number[], target: number[], tol: number) {
  let sum = 0; let worst = 0; let worstScore = 2; let worstDiff = 0;
  for (let i = 0; i < target.length; i++) {
    const d = user[i]! - target[i]!;
    const s = Math.max(0, Math.min(1, 1 - Math.max(0, Math.abs(d) - 5) / (tol * 2.5)));
    sum += s;
    if (s < worstScore) { worstScore = s; worst = i; worstDiff = d; }
  }
  return { acc: Math.round((sum / target.length) * 100), worst, worstDiff, worstScore };
}

export function hintFor(worst: number, diff: number) {
  const n = JOINT_NAMES[worst];
  if (worst <= 1 || worst >= 6 && worst <= 7) return diff < 0 ? `Straighten your ${n}` : `Bend your ${n} more`;
  if (worst <= 3) return diff < 0 ? `Raise your ${n} higher` : `Lower your ${n}`;
  if (worst <= 5) return diff < 0 ? `Straighten at your ${n}` : `Bend more at your ${n}`;
  return diff < 0 ? "Lean your body more" : "Keep your body straighter";
}

export function lerpKp(a: Kp, b: Kp, t: number): Kp {
  const o = {} as Kp;
  (Object.keys(a) as (keyof Kp)[]).forEach((k) => {
    o[k] = [a[k][0] + (b[k][0] - a[k][0]) * t, a[k][1] + (b[k][1] - a[k][1]) * t];
  });
  return o;
}
