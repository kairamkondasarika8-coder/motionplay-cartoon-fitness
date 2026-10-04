import { Avatar } from "./Avatar";
import type { Profile } from "@/lib/game/storage";
import { ACHIEVEMENTS, CHARACTERS, DIFFICULTY, type AchievementId } from "@/lib/game/config";
import { loadAchievements, loadHistory, personalBest, type Session } from "@/lib/game/storage";
import { cn } from "@/lib/utils";

function AccuracyGraph({ session }: { session: Session }) {
  const pts = session.results;
  if (!pts.length) return <p className="text-sm text-muted-foreground">No exercises recorded.</p>;
  const W = 600, H = 200, P = 28;
  const x = (i: number) => P + (pts.length === 1 ? (W - 2 * P) / 2 : (i * (W - 2 * P)) / (pts.length - 1));
  const y = (v: number) => H - P - (v / 100) * (H - 2 * P);
  const th = DIFFICULTY[session.difficulty].threshold;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full">
      {[0, 50, 100].map((v) => (
        <g key={v}>
          <line x1={P} x2={W - P} y1={y(v)} y2={y(v)} className="stroke-muted-foreground/20" />
          <text x={4} y={y(v) + 4} className="fill-muted-foreground text-[10px]">{v}</text>
        </g>
      ))}
      <line x1={P} x2={W - P} y1={y(th)} y2={y(th)} strokeDasharray="6 4" className="stroke-success" strokeWidth={2} />
      <polyline points={pts.map((p, i) => `${x(i)},${y(p.accuracy)}`).join(" ")} fill="none" className="stroke-primary" strokeWidth={4} strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.accuracy)} r={6} className={p.success ? "fill-success stroke-foreground" : "fill-destructive stroke-foreground"} strokeWidth={2}>
          <title>{`${p.name}: ${p.accuracy}%`}</title>
        </circle>
      ))}
    </svg>
  );
}

type Props = { session: Session | null; newAchievements: AchievementId[]; onPlayAgain: () => void; onHome: () => void };

export function Dashboard({ session, newAchievements, onPlayAgain, onHome, profile }: Props & { profile?: Profile | null }) {
  const history = loadHistory();
  const unlocked = loadAchievements();
  const best = personalBest();
  const s = session ?? history[0] ?? null;
  const avg = s && s.results.length ? Math.round(s.results.reduce((a, r) => a + r.accuracy, 0) / s.results.length) : 0;
  const isBest = !!session && session.score > 0 && session.score >= best;

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8">
      <div className="text-center">
        {profile && <div className="mb-3 flex items-center justify-center gap-3"><Avatar profile={profile} size={64} /><span className="font-display text-2xl font-bold">{profile.name}</span></div>}
        <h1 className="text-4xl font-bold sm:text-5xl">🏆 Performance Report</h1>
        {session && <p className="mt-2 font-bold text-muted-foreground">{session.completed ? "You are a Motion Champion!" : "Great effort — keep training!"}</p>}
      </div>

      {s ? (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {[
              ["Score", s.score, "🏅"], ["Stars", s.stars, "⭐"], ["Avg accuracy", `${avg}%`, "🎯"],
              ["Max combo", s.maxCombo, "🔥"], ["Personal best", best, isBest ? "🆕" : "👑"],
            ].map(([label, val, icon]) => (
              <div key={label as string} className="cartoon-card p-4 text-center">
                <p className="text-2xl">{icon}</p>
                <p className="font-display text-3xl font-bold">{val}</p>
                <p className="text-xs font-bold text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
          <div className="cartoon-card p-4">
            <h2 className="text-xl font-bold">Accuracy graph</h2>
            <AccuracyGraph session={s} />
            <div className="mt-2 flex flex-wrap gap-2">
              {s.results.map((r, i) => (
                <span key={i} className={cn("rounded-full border-2 border-border px-3 py-1 text-xs font-bold", r.success ? "bg-success/20" : "bg-destructive/20")}>
                  {r.name} · {r.accuracy}% {r.success ? "⭐".repeat(r.stars) : "✖"}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <p className="text-center font-bold">No games played yet.</p>
      )}

      <div className="cartoon-card p-4">
        <h2 className="text-xl font-bold">Achievements</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {ACHIEVEMENTS.map((a) => {
            const on = unlocked.includes(a.id);
            return (
              <div key={a.id} className={cn("rounded-2xl border-2 border-border p-3 text-center", on ? "bg-accent" : "bg-muted opacity-50 grayscale", newAchievements.includes(a.id) && "animate-pop")}>
                <p className="text-3xl">{a.icon}</p>
                <p className="font-display font-bold">{a.name}</p>
                <p className="text-[11px] font-semibold">{a.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="cartoon-card overflow-x-auto p-4">
        <h2 className="text-xl font-bold">Exercise history</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead><tr className="text-muted-foreground"><th className="py-1">Date</th><th>Coach</th><th>Difficulty</th><th>Levels</th><th>Stars</th><th>Score</th></tr></thead>
          <tbody>
            {history.slice(0, 10).map((h) => (
              <tr key={h.date} className="border-t border-border/20 font-semibold">
                <td className="py-1.5">{new Date(h.date).toLocaleString()}</td>
                <td>{CHARACTERS.find((c) => c.id === h.character)?.name}</td>
                <td>{DIFFICULTY[h.difficulty].label}</td>
                <td>{h.levelsCompleted}/3</td>
                <td>⭐ {h.stars}</td>
                <td>{h.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-3">
        <button onClick={onPlayAgain} className="rounded-full border-[3px] border-border bg-primary px-8 py-3 font-display text-xl font-bold text-primary-foreground shadow-pop active:translate-y-1">Play again</button>
        <button onClick={onHome} className="rounded-full border-[3px] border-border bg-card px-8 py-3 font-display text-xl font-bold shadow-pop active:translate-y-1">Change character</button>
      </div>
    </div>
  );
}
