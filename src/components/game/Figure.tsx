import type { Kp } from "@/lib/game/poses";

const BONES: [keyof Kp, keyof Kp][] = [
  ["ls", "rs"], ["ls", "le"], ["le", "lw"], ["rs", "re"], ["re", "rw"], ["ls", "lh"],
  ["rs", "rh"], ["lh", "rh"], ["lh", "lk"], ["lk", "la"], ["rh", "rk"], ["rk", "ra"],
];

export function Figure({
  kp, color = "var(--primary)", head, dashed, className, width = 0.035,
}: { kp: Kp; color?: string; head?: string; dashed?: boolean; className?: string; width?: number }) {
  const msx = (kp.ls[0] + kp.rs[0]) / 2, msy = (kp.ls[1] + kp.rs[1]) / 2;
  const dx = msx - (kp.lh[0] + kp.rh[0]) / 2, dy = msy - (kp.lh[1] + kp.rh[1]) / 2;
  const len = Math.hypot(dx, dy) || 1;
  const hx = msx + (dx / len) * 0.1, hy = msy + (dy / len) * 0.1;
  return (
    <svg viewBox="0 0 1 1" className={className} aria-hidden>
      <g stroke={color} strokeWidth={width} strokeLinecap="round" fill="none" strokeDasharray={dashed ? "0.03 0.03" : undefined} opacity={dashed ? 0.85 : 1}>
        {BONES.map(([a, b]) => (
          <line key={a + b} x1={kp[a][0]} y1={kp[a][1]} x2={kp[b][0]} y2={kp[b][1]} />
        ))}
      </g>
      {head ? (
        <>
          <circle cx={hx} cy={hy} r={0.075} fill={color} />
          <text x={hx} y={hy + 0.035} fontSize={0.1} textAnchor="middle">{head}</text>
        </>
      ) : (
        <circle cx={hx} cy={hy} r={0.06} fill="none" stroke={color} strokeWidth={width} strokeDasharray={dashed ? "0.03 0.03" : undefined} />
      )}
    </svg>
  );
}
