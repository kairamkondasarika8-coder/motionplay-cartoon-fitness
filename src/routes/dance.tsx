import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { GameSession } from "@/components/game/GameSession";
import { NeedProfile } from "@/components/game/NeedProfile";
import { Figure } from "@/components/game/Figure";
import { DANCES, danceToExercise, type Dance } from "@/lib/game/exercises";
import { POSES } from "@/lib/game/poses";
import { getCharacter } from "@/lib/game/characters";
import { useProfile } from "@/lib/game/useProfile";

export const Route = createFileRoute("/dance")({
  head: () => ({
    meta: [
      { title: "Dance-to-Fitness — MotionPlay" },
      { name: "description", content: "Chain squats, jumps, side steps and high knees into rhythm dance flows scored on every beat." },
      { property: "og:title", content: "Dance-to-Fitness — MotionPlay" },
      { property: "og:description", content: "Rhythm workout flows scored beat by beat with your webcam." },
    ],
  }),
  component: DancePage,
});

function DancePage() {
  const { ready, profile } = useProfile();
  const [dance, setDance] = useState<Dance | null>(null);
  if (!ready) return null;
  if (!profile) return <NeedProfile />;
  if (dance) return (
    <div>
      <button onClick={() => setDance(null)} className="mb-4 font-display underline">← All dances</button>
      <GameSession exercises={[danceToExercise(dance)]} profile={profile} mode="dance" />
    </div>
  );
  const ch = getCharacter(profile.characterId);
  return (
    <div>
      <h1 className="font-display text-4xl">💃 Dance-to-Fitness</h1>
      <p className="mt-1 text-muted-foreground">Hit each move on the beat. Half the beats or more to clear the dance!</p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {DANCES.map((d) => (
          <button key={d.id} onClick={() => setDance(d)} className="rounded-3xl border-4 border-foreground bg-card p-5 text-left shadow-pop transition-transform hover:-translate-y-1">
            <div className="flex gap-1">{d.steps.map((s, i) => <Figure key={i} kp={POSES[s]} color={ch.colorVar} className="h-14 w-14" width={0.05} />)}</div>
            <h2 className="mt-3 font-display text-2xl">{d.name}</h2>
            <p className="text-sm text-muted-foreground">{d.vibe}</p>
            <p className="mt-1 text-xs">{Math.round(60000 / d.beatMs)} BPM · {d.loops} loops</p>
          </button>
        ))}
      </div>
    </div>
  );
}
