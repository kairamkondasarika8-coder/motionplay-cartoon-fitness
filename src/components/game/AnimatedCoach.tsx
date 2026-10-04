import { useEffect, useId, useState } from "react";
import type { Exercise, TargetPose } from "@/lib/game/exercises";

type P = [number, number];
type Body = { hipY: number; lean: number; le: P; lh: P; re: P; rh: P; lk: P; lf: P; rk: P; rf: P };
type Legs = TargetPose["legs"] | "kneeR";

const rad = (d: number) => (d * Math.PI) / 180;
const LEGS: Record<Legs, Pick<Body, "hipY" | "lk" | "lf" | "rk" | "rf">> = {
  stand: { hipY: 150, lk: [94, 192], lf: [88, 235], rk: [106, 192], rf: [112, 235] },
  hips: { hipY: 150, lk: [94, 192], lf: [88, 235], rk: [106, 192], rf: [112, 235] },
  bend: { hipY: 150, lk: [96, 192], lf: [92, 235], rk: [104, 192], rf: [108, 235] },
  wide: { hipY: 150, lk: [81, 191], lf: [62, 232], rk: [119, 191], rf: [138, 232] },
  squat: { hipY: 172, lk: [68, 198], lf: [78, 235], rk: [132, 198], rf: [122, 235] },
  treeL: { hipY: 150, lk: [70, 180], lf: [102, 195], rk: [105, 192], rf: [110, 235] },
  kneeL: { hipY: 150, lk: [74, 158], lf: [78, 203], rk: [106, 192], rf: [112, 235] },
  kneeR: { hipY: 150, lk: [94, 192], lf: [88, 235], rk: [126, 158], rf: [122, 203] },
  warrior: { hipY: 160, lk: [62, 192], lf: [58, 235], rk: [125, 194], rf: [150, 232] },
};

function armPts(a: number, side: -1 | 1): [P, P] {
  const sx = 100 + side * 16;
  const dx = Math.sin(rad(a)) * side, dy = Math.cos(rad(a));
  return [[sx + dx * 31, 78 + dy * 31], [sx + dx * 62, 78 + dy * 62]];
}

function bodyFor(t: { lArm: number; rArm: number; legs: Legs; lean?: number }): Body {
  const legs = LEGS[t.legs];
  const [le, lh] = t.legs === "hips" ? ([[62, 112], [86, 146]] as [P, P]) : armPts(t.lArm, -1);
  const [re, rh] = t.legs === "hips" ? ([[138, 112], [114, 146]] as [P, P]) : armPts(t.rArm, 1);
  return { ...legs, lean: t.legs === "bend" ? 70 : t.lean ?? 0, le, lh, re, rh };
}

const REST = bodyFor({ lArm: 8, rArm: 8, legs: "stand" });
const lp = (a: number, b: number, k: number) => a + (b - a) * k;
const lpP = (a: P, b: P, k: number): P => [lp(a[0], b[0], k), lp(a[1], b[1], k)];
function mix(a: Body, b: Body, k: number): Body {
  return {
    hipY: lp(a.hipY, b.hipY, k), lean: lp(a.lean, b.lean, k),
    le: lpP(a.le, b.le, k), lh: lpP(a.lh, b.lh, k), re: lpP(a.re, b.re, k), rh: lpP(a.rh, b.rh, k),
    lk: lpP(a.lk, b.lk, k), lf: lpP(a.lf, b.lf, k), rk: lpP(a.rk, b.rk, k), rf: lpP(a.rf, b.rf, k),
  };
}
const ease = (x: number) => 0.5 - Math.cos(Math.PI * Math.min(1, Math.max(0, x))) / 2;

/** Which target to show on cycle n (dynamic exercises alternate). */
function targetFor(ex: Exercise, n: number): Body {
  if (ex.id === "high-knees") return bodyFor({ lArm: 40, rArm: 40, legs: n % 2 ? "kneeR" : "kneeL" });
  if (ex.id === "squat-arms") return n % 2 ? bodyFor({ lArm: 175, rArm: 175, legs: "stand" }) : bodyFor({ lArm: 90, rArm: 90, legs: "squat" });
  if (ex.id === "side-stretch") return bodyFor({ ...ex.target, lean: n % 2 ? -15 : 15 });
  return bodyFor(ex.target);
}
const DYNAMIC = new Set(["high-knees", "jumping-jack", "squat-arms", "rapid-arms"]);

type Props = {
  exercise: Exercise;
  image: string;
  /** seconds per movement cycle */
  speed: number;
  /** demo = full rest→pose→rest loop; hold = reach the pose and stay (dynamic moves keep looping); idle = breathe */
  mode: "demo" | "hold" | "idle";
  mood: "happy" | "sad" | "neutral";
  mirror?: boolean;
};

/** The selected cartoon coach, drawn as an animated body with the character's face, performing the exercise. */
export function AnimatedCoach({ exercise, image, speed, mode, mood, mirror }: Props) {
  const [t, setT] = useState(0);
  const clip = useId().replace(/:/g, "");
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const loop = (now: number) => { setT((now - start) / 1000); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [exercise.id, mode]);

  const cycle = t / speed;
  const n = Math.floor(cycle);
  const u = cycle - n;
  let body: Body;
  if (mode === "idle") body = REST;
  else if (mode === "hold" && !DYNAMIC.has(exercise.id)) body = mix(REST, targetFor(exercise, 0), ease(t / (speed * 0.4)));
  else {
    // rise 0–35%, hold 35–70%, return 70–100%
    const k = u < 0.35 ? ease(u / 0.35) : u < 0.7 ? 1 : 1 - ease((u - 0.7) / 0.3);
    body = mix(REST, targetFor(exercise, n), k);
  }
  const jump = exercise.id === "jumping-jack" && mode !== "idle" ? -Math.sin(u * Math.PI) * 10 : 0;
  const breathe = Math.sin(t * 2.4) * 1.5;
  const dy = body.hipY - 150 + jump;
  const hip: P = [100, body.hipY + jump];
  const leg = (k: P, f: P) => `M${hip[0]} ${hip[1]} L${k[0]} ${k[1] + jump} L${f[0]} ${f[1] + jump}`;
  const arm = (e: P, h: P, sx: number) => `M${sx} 78 L${e[0]} ${e[1]} L${h[0]} ${h[1]}`;
  const hand = (h: P) => <circle cx={h[0]} cy={h[1]} r={7} className="fill-accent stroke-foreground" strokeWidth={3} />;

  return (
    <svg viewBox="-10 -10 220 260" className="h-full w-full" aria-label={`Coach performing ${exercise.name}`} style={mirror ? { transform: "scaleX(-1)" } : undefined}>
      <defs>
        <clipPath id={clip}><circle cx={100} cy={40} r={30} /></clipPath>
      </defs>
      <ellipse cx={100} cy={240} rx={55} ry={7} className="fill-foreground/15" />
      <g strokeLinecap="round" strokeLinejoin="round" fill="none" className="stroke-foreground">
        <path d={leg(body.lk, body.lf)} strokeWidth={15} />
        <path d={leg(body.rk, body.rf)} strokeWidth={15} />
        <path d={leg(body.lk, body.lf)} strokeWidth={9} className="stroke-primary" />
        <path d={leg(body.rk, body.rf)} strokeWidth={9} className="stroke-primary" />
        <g transform={`rotate(${-body.lean} ${hip[0]} ${hip[1]}) translate(0 ${dy + breathe * (mode === "idle" ? 1 : 0)})`}>
          <rect x={80} y={70} width={40} height={84} rx={18} className="fill-secondary stroke-foreground" strokeWidth={4} />
          <path d={arm(body.le, body.lh, 84)} strokeWidth={14} />
          <path d={arm(body.re, body.rh, 116)} strokeWidth={14} />
          <path d={arm(body.le, body.lh, 84)} strokeWidth={8} className="stroke-secondary" />
          <path d={arm(body.re, body.rh, 116)} strokeWidth={8} className="stroke-secondary" />
          {hand(body.lh)}
          {hand(body.rh)}
          <g transform={mood === "sad" ? "rotate(-8 100 40)" : mood === "happy" ? `rotate(${Math.sin(t * 6) * 4} 100 40)` : undefined}>
            <circle cx={100} cy={40} r={32} className="fill-card stroke-foreground" strokeWidth={4} />
            <image href={image} x={56} y={4} width={88} height={88} clipPath={`url(#${clip})`} preserveAspectRatio="xMidYMin slice" />
          </g>
        </g>
      </g>
    </svg>
  );
}
