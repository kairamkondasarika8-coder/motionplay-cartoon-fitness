import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Figure } from "@/components/game/Figure";
import { EXERCISES, ageBand, isAllowed, type Tier } from "@/lib/game/exercises";
import { POSES } from "@/lib/game/poses";
import { useProfile } from "@/lib/game/useProfile";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "50-Exercise Library — MotionPlay" },
      { name: "description", content: "Browse all 50 MotionPlay exercises from beginner stretches to burpees, each with live pose tracking." },
      { property: "og:title", content: "50-Exercise Library — MotionPlay" },
      { property: "og:description", content: "Beginner, medium, advanced and special pose challenges." },
    ],
  }),
  component: LibraryPage,
});

const TABS: { id: Tier | "all"; label: string }[] = [
  { id: "all", label: "All 50" }, { id: "easy", label: "🟢 Beginner" }, { id: "medium", label: "🟡 Medium" }, { id: "hard", label: "🔴 Advanced" }, { id: "special", label: "⭐ Special" },
];

function LibraryPage() {
  const { profile } = useProfile();
  const [tab, setTab] = useState<Tier | "all">("all");
  const band = profile ? ageBand(profile.age) : null;
  const list = EXERCISES.filter((e) => tab === "all" || e.difficulty === tab);
  return (
    <div>
      <h1 className="font-display text-4xl">📚 Exercise Library</h1>
      {band && <p className="mt-1 text-muted-foreground">Showing what fits {band.label}. Locked moves unlock as you grow!</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => <button key={t.id} onClick={() => setTab(t.id)} className={`rounded-full border-2 border-foreground px-4 py-1.5 font-display ${tab === t.id ? "bg-foreground text-background" : ""}`}>{t.label}</button>)}
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((e) => {
          const ok = !band || isAllowed(e, band);
          return (
            <div key={e.id} className={`flex gap-3 rounded-3xl border-4 border-foreground bg-card p-4 ${ok ? "" : "opacity-50"}`}>
              <div className="h-24 w-24 shrink-0 rounded-2xl bg-muted">
                {e.poses[0] ? <Figure kp={POSES[e.poses[e.poses.length - 1]!]} className="h-full w-full" /> : <div className="flex h-full items-center justify-center text-4xl">{e.special === "follow" ? "🎭" : "🎲"}</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">#{e.id} · {e.difficulty} · {e.mode === "hold" ? `hold ${e.hold}s` : e.mode === "reps" ? (e.special ? "5 poses" : `${e.reps} reps`) : "flow"}</div>
                <h3 className="font-display text-lg leading-tight">{e.name}</h3>
                <p className="text-xs text-muted-foreground">{e.parts.join(" · ")}</p>
                <p className="mt-1 text-sm">{e.description}</p>
                {ok ? (
                  <Link to="/play" search={{ ex: e.id }} className="mt-2 inline-block rounded-full bg-primary px-4 py-1 font-display text-sm text-primary-foreground">Play ▶</Link>
                ) : <span className="mt-2 inline-block text-sm">🔒 Not for your age group yet</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
