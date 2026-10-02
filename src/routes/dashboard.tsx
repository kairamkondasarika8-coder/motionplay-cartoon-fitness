import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadHistory, type SessionRec } from "@/lib/game/storage";
import { useProfile } from "@/lib/game/useProfile";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Performance Dashboard — MotionPlay" },
      { name: "description", content: "Track your MotionPlay streak, stars, accuracy history, best combo and strongest exercises." },
      { property: "og:title", content: "Performance Dashboard — MotionPlay" },
      { property: "og:description", content: "Streaks, stars, accuracy graph and exercise strengths." },
    ],
  }),
  component: Dashboard,
});

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

function Dashboard() {
  const { profile } = useProfile();
  const [hist, setHist] = useState<SessionRec[] | null>(null);
  useEffect(() => setHist(loadHistory()), []);
  if (!hist) return null;

  const days = new Set(hist.map((s) => dayKey(new Date(s.date))));
  let streak = 0; const d = new Date();
  if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
  while (days.has(dayKey(d))) { streak++; d.setDate(d.getDate() - 1); }

  const results = hist.flatMap((s) => s.results);
  const totalStars = hist.reduce((a, s) => a + s.stars, 0);
  const coins = hist.reduce((a, s) => a + s.coins, 0);
  const avgAcc = Math.round(results.reduce((a, r) => a + r.accuracy, 0) / Math.max(1, results.length));
  const bestCombo = Math.max(0, ...hist.map((s) => s.bestCombo));
  const mins = Math.round(hist.reduce((a, s) => a + s.durationSec, 0) / 60);
  const level = Math.floor(totalStars / 10) + 1;

  const week = Array.from({ length: 7 }, (_, i) => {
    const dt = new Date(); dt.setDate(dt.getDate() - (6 - i));
    const rs = hist.filter((s) => dayKey(new Date(s.date)) === dayKey(dt)).flatMap((s) => s.results);
    return { label: dt.toLocaleDateString("en", { weekday: "short" }), acc: rs.length ? Math.round(rs.reduce((a, r) => a + r.accuracy, 0) / rs.length) : null };
  });

  const byEx = new Map<string, number[]>();
  results.forEach((r) => byEx.set(r.name, [...(byEx.get(r.name) ?? []), r.accuracy]));
  const ranked = [...byEx.entries()].map(([n, a]) => ({ n, acc: Math.round(a.reduce((x, y) => x + y, 0) / a.length), tries: a.length })).sort((a, b) => b.acc - a.acc);

  const stats: [string, string | number][] = [
    ["🔥 Streak", `${streak} day${streak === 1 ? "" : "s"}`], ["⭐ Total stars", totalStars], ["🏋️ Exercises", results.length],
    ["🎯 Avg accuracy", `${avgAcc}%`], ["💥 Best combo", bestCombo], ["⏱ Active time", `${mins} min`], ["🪙 Coins", coins], ["🏆 Level", level],
  ];

  const pts = week.map((w, i) => (w.acc == null ? null : [20 + i * 60, 170 - (w.acc / 100) * 150] as const));
  const path = pts.filter(Boolean).map((p, i) => `${i ? "L" : "M"}${p![0]},${p![1]}`).join(" ");

  return (
    <div>
      <h1 className="font-display text-4xl">📊 {profile ? `${profile.name}'s` : "Your"} Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(([k, v]) => <div key={k} className="rounded-3xl border-4 border-foreground bg-card p-4"><div className="text-sm text-muted-foreground">{k}</div><div className="font-display text-3xl">{v}</div></div>)}
      </div>
      <div className="mt-6 rounded-3xl border-4 border-foreground bg-card p-5">
        <h2 className="font-display text-xl">Accuracy — last 7 days</h2>
        <svg viewBox="0 0 400 200" className="mt-3 w-full">
          {[0, 50, 100].map((v) => <g key={v}><line x1="10" x2="390" y1={170 - v * 1.5} y2={170 - v * 1.5} stroke="var(--border)" /><text x="0" y={174 - v * 1.5} fontSize="9" fill="var(--muted-foreground)">{v}</text></g>)}
          {week.map((w, i) => w.acc != null && <rect key={i} x={20 + i * 60 - 14} y={170 - w.acc * 1.5} width="28" height={w.acc * 1.5} rx="6" fill="var(--accent)" />)}
          <path d={path} stroke="var(--primary)" strokeWidth="3" fill="none" />
          {pts.map((p, i) => p && <circle key={i} cx={p[0]} cy={p[1]} r="5" fill="var(--primary)" />)}
          {week.map((w, i) => <text key={i} x={20 + i * 60} y="190" fontSize="11" textAnchor="middle" fill="var(--foreground)">{w.label}</text>)}
        </svg>
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {[["💪 Strong exercises", ranked.slice(0, 4)], ["🧩 Needs practice", [...ranked].reverse().slice(0, 4)]].map(([title, items]) => (
          <div key={title as string} className="rounded-3xl border-4 border-foreground bg-card p-5">
            <h2 className="font-display text-xl">{title as string}</h2>
            {(items as typeof ranked).length ? (
              <ul className="mt-2 space-y-2">{(items as typeof ranked).map((r) => (
                <li key={r.n}><div className="flex justify-between text-sm"><span>{r.n} <span className="text-muted-foreground">×{r.tries}</span></span><span>{r.acc}%</span></div>
                  <div className="h-2 rounded-full bg-muted"><div className="h-full rounded-full bg-secondary" style={{ width: `${r.acc}%` }} /></div></li>
              ))}</ul>
            ) : <p className="mt-2 text-sm text-muted-foreground">Play a workout to see results here.</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
