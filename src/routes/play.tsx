import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GameSession } from "@/components/game/GameSession";
import { NeedProfile } from "@/components/game/NeedProfile";
import { buildWorkout, getExercise, type Exercise } from "@/lib/game/exercises";
import { useProfile } from "@/lib/game/useProfile";

export const Route = createFileRoute("/play")({
  validateSearch: (s: Record<string, unknown>): { ex?: number } => (s.ex ? { ex: Number(s.ex) } : {}),
  head: () => ({
    meta: [
      { title: "Workout — MotionPlay" },
      { name: "description", content: "Play a webcam-tracked cartoon workout with live pose scoring, combos, hearts and stars." },
      { property: "og:title", content: "Workout — MotionPlay" },
      { property: "og:description", content: "Live pose tracking workout with a cartoon voice coach." },
    ],
  }),
  component: PlayPage,
});

function PlayPage() {
  const { ex } = Route.useSearch();
  const { ready, profile } = useProfile();
  const [list, setList] = useState<Exercise[] | null>(null);
  useEffect(() => {
    if (!profile) return;
    const single = ex ? getExercise(ex) : undefined;
    setList(single ? [single] : buildWorkout(profile.age, profile.difficulty));
  }, [profile, ex]);
  if (!ready) return null;
  if (!profile) return <NeedProfile />;
  if (!list) return null;
  return <GameSession key={String(ex)} exercises={list} profile={profile} mode={ex ? "single" : "workout"} />;
}
