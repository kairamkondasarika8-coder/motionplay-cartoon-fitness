import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { PoseTracker } from "./PoseTracker";
import { Figure } from "./Figure";
import { POSES, compare, hintFor, lerpKp, poseFeatures } from "@/lib/game/poses";
import { BASE_TOL, ageBand, prepare, type Exercise } from "@/lib/game/exercises";
import { getCharacter, line, say, speak } from "@/lib/game/characters";
import { addSession, type ExResult, type Profile } from "@/lib/game/storage";

type Phase = "intro" | "countdown" | "active" | "result" | "summary";
const THR = 72;

export function GameSession({ exercises, profile, mode }: { exercises: Exercise[]; profile: Profile; mode: string }) {
  const ch = getCharacter(profile.characterId);
  const band = ageBand(profile.age);
  const tol = BASE_TOL[profile.difficulty] + band.tolBonus;
  const [list] = useState(() => exercises.map(prepare));
  const [idx, setIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("intro");
  const [count, setCount] = useState(3);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [acc, setAcc] = useState(0);
  const [hint, setHint] = useState("");
  const [progress, setProgress] = useState({ step: 0, value: 0, goal: 1, label: "" });
  const [timeLeft, setTimeLeft] = useState(0);
  const [results, setResults] = useState<ExResult[]>([]);
  const [lastResult, setLastResult] = useState<ExResult | null>(null);
  const [demoT, setDemoT] = useState(0);
  const featRef = useRef<number[] | null>(null);
  const startedAt = useRef(Date.now());
  const rt = useRef({ step: 0, held: 0, reps: 0, accSum: 0, accN: 0, badSince: 0, lastVoice: 0, start: 0, beatStart: 0, beatBest: 0, hits: 0, beats: 0, combo: 0, goodTick: 0 });
  const saved = useRef(false);

  const ex = list[idx];
  const goalReps = ex.mode === "reps" ? (ex.special ? 1 : Math.max(2, Math.round((ex.reps ?? 5) * band.repMult))) : 0;
  const goalHold = ex.mode === "hold" ? Math.max(3, Math.round((ex.hold ?? 5) * band.holdMult)) : 0;
  const beatMs = (ex.beatMs ?? 2000) * band.paceMult;
  const totalBeats = ex.poses.length * (ex.loops ?? 1);
  const limitMs = ex.mode === "hold" ? (goalHold + 20) * 1000 : ex.mode === "reps" ? (goalReps * ex.poses.length * 3 + 15) * 1000 : totalBeats * beatMs + 500;
  const targetKey = ex.poses[Math.min(progress.step, ex.poses.length - 1)] ?? "stand";

  // Cartoon demo animation (slower for younger players)
  useEffect(() => {
    let raf = 0; const t0 = performance.now();
    const tick = () => { setDemoT(((performance.now() - t0) / (1400 * band.paceMult)) % Math.max(1, ex.poses.length)); raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ex, band.paceMult]);
  const di = Math.floor(demoT); const seg = demoT - di;
  const demoKp = phase === "active" ? POSES[targetKey] : lerpKp(POSES[ex.poses[di] ?? "stand"], POSES[ex.poses[(di + 1) % ex.poses.length] ?? "stand"], Math.min(1, seg * 2));

  // Intro
  useEffect(() => {
    if (phase !== "intro") return;
    const r = rt.current; Object.assign(r, { step: 0, held: 0, reps: 0, accSum: 0, accN: 0, badSince: 0, hits: 0, beats: 0, beatBest: 0 });
    setProgress({ step: 0, value: 0, goal: 1, label: "" }); setHint("");
    say(ch, "ready", { ex: ex.name }, true);
    if (profile.age <= 8 || idx === 0) speak(ch, ex.instructions.slice(0, 2).join(" "));
    const t = setTimeout(() => setPhase("countdown"), band.demoSec * 1000 + (profile.age <= 8 ? 3000 : 1500));
    return () => clearTimeout(t);
  }, [phase, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  // Countdown
  useEffect(() => {
    if (phase !== "countdown") return;
    setCount(3); speak(ch, "3", true);
    let n = 3;
    const t = setInterval(() => {
      n -= 1;
      if (n > 0) { setCount(n); speak(ch, String(n)); }
      else if (n === 0) { setCount(0); speak(ch, line(ch, "go")); }
      else { clearInterval(t); const r = rt.current; r.start = Date.now(); r.beatStart = Date.now(); r.lastVoice = Date.now(); setPhase("active"); }
    }, 1000);
    return () => clearInterval(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const finish = (success: boolean) => {
    const r = rt.current;
    const avg = ex.mode === "flow" ? Math.round((r.hits / Math.max(1, r.beats)) * 100 * 0.5 + (r.accSum / Math.max(1, r.accN)) * 0.5) : Math.round(r.accSum / Math.max(1, r.accN));
    const stars = !success ? 0 : avg >= 85 ? 3 : avg >= 70 ? 2 : 1;
    const res: ExResult = { exId: ex.id, name: ex.name, accuracy: avg, success, stars };
    setResults((p) => [...p, res]); setLastResult(res);
    if (success) { setScore((s) => s + 100 + stars * 50); say(ch, "complete", {}, true); }
    else { setLives((l) => l - 1); say(ch, "fail", {}, true); }
    setPhase("result");
  };

  const bumpCombo = () => {
    const r = rt.current; r.combo += 1;
    setCombo(r.combo); setBestCombo((b) => Math.max(b, r.combo));
    setScore((s) => s + 10 * (1 + Math.floor(r.combo / 5)));
    if (r.combo % 5 === 0 && profile.age >= 9) say(ch, "combo", { n: r.combo }, true);
  };

  const tickRef = useRef<() => void>(() => {});
  tickRef.current = () => {
    const r = rt.current; const now = Date.now();
    const f = featRef.current;
    const elapsed = now - r.start;
    setTimeLeft(Math.max(0, Math.ceil((limitMs - elapsed) / 1000)));
    const tf = poseFeatures(ex.poses[r.step] ?? "stand");
    const cmp = f ? compare(f, tf, tol) : null;
    const a = cmp?.acc ?? 0;
    setAcc(a); r.accSum += a; r.accN += 1;
    if (cmp && a < THR) setHint(hintFor(cmp.worst, cmp.worstDiff)); else setHint(f ? "" : "Step back so your whole body is visible");

    // combo break
    if (a < THR - 15) { if (!r.badSince) r.badSince = now; else if (now - r.badSince > 1500 && r.combo > 0) { r.combo = 0; setCombo(0); } }
    else r.badSince = 0;

    // voice feedback
    if (now - r.lastVoice > band.voiceEvery && f) {
      r.lastVoice = now;
      if (a >= 85) say(ch, "high"); else if (a >= THR - 10) say(ch, "mid");
      else if (cmp) say(ch, "wrong", { hint: hintFor(cmp.worst, cmp.worstDiff).toLowerCase() }); else say(ch, "low");
    }

    if (ex.mode === "hold") {
      if (a >= THR) { r.held += 100; r.goodTick += 100; if (r.goodTick >= 1000) { r.goodTick = 0; bumpCombo(); } }
      setProgress({ step: 0, value: r.held / 1000, goal: goalHold, label: `Hold ${(r.held / 1000).toFixed(1)} / ${goalHold}s` });
      if (r.held >= goalHold * 1000) return finish(true);
    } else if (ex.mode === "reps") {
      if (a >= THR) {
        r.step += 1; bumpCombo();
        if (r.step >= ex.poses.length) { r.step = 0; r.reps += 1; }
      }
      setProgress({ step: r.step, value: r.reps, goal: goalReps, label: ex.special ? `Pose ${r.step + 1} / ${ex.poses.length}` : `Reps ${r.reps} / ${goalReps}` });
      if (r.reps >= goalReps) return finish(true);
    } else {
      r.beatBest = Math.max(r.beatBest, a);
      if (now - r.beatStart >= beatMs) {
        r.beats += 1;
        if (r.beatBest >= THR) { r.hits += 1; bumpCombo(); }
        r.beatBest = 0; r.beatStart = now;
        r.step = r.beats % ex.poses.length;
        if (r.beats >= totalBeats) return finish(r.hits / totalBeats >= 0.5);
      }
      setProgress({ step: r.step, value: r.hits, goal: totalBeats, label: `Beat ${Math.min(r.beats + 1, totalBeats)} / ${totalBeats} · Hits ${r.hits}` });
    }
    if (elapsed > limitMs) finish(false);
  };

  useEffect(() => {
    if (phase !== "active") return;
    const t = setInterval(() => tickRef.current(), 100);
    return () => clearInterval(t);
  }, [phase]);

  // Result → next
  useEffect(() => {
    if (phase !== "result") return;
    const t = setTimeout(() => {
      if (lives <= 0 || idx >= list.length - 1) setPhase("summary");
      else { setIdx((i) => i + 1); setPhase("intro"); }
    }, 3000);
    return () => clearTimeout(t);
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalStars = results.reduce((s, r) => s + r.stars, 0);
  const coins = Math.round(score / 10);

  useEffect(() => {
    if (phase !== "summary" || saved.current) return;
    saved.current = true;
    addSession({
      id: String(Date.now()), date: new Date().toISOString(), mode, durationSec: Math.round((Date.now() - startedAt.current) / 1000),
      stars: totalStars, coins, score, bestCombo, results,
    });
    if (results.some((r) => r.success)) speak(ch, line(ch, "level"), true);
    say(ch, "summary", { name: profile.name, stars: totalStars, coins });
  }, [phase]); // eslint-disable-line react-hooks/exhaustive-deps

  if (phase === "summary") {
    const avg = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / Math.max(1, results.length));
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border-4 border-foreground bg-card p-8 text-center shadow-pop">
        <div className="text-6xl">{ch.emoji}</div>
        <h2 className="mt-2 font-display text-4xl">{lives > 0 ? "Workout complete!" : "Game over!"}</h2>
        <p className="mt-2 text-muted-foreground">{line(ch, "summary", { name: profile.name, stars: totalStars, coins })}</p>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[["⭐ Stars", totalStars], ["🪙 Coins", coins], ["🎯 Accuracy", `${avg}%`], ["🔥 Best combo", bestCombo]].map(([k, v]) => (
            <div key={k} className="rounded-2xl bg-muted p-3"><div className="text-xs text-muted-foreground">{k}</div><div className="font-display text-2xl">{v}</div></div>
          ))}
        </div>
        <ul className="mt-6 space-y-1 text-left">
          {results.map((r, i) => (
            <li key={i} className="flex justify-between rounded-xl bg-muted/60 px-3 py-2 text-sm">
              <span>{r.success ? "✅" : "❌"} {r.name}</span><span>{"⭐".repeat(r.stars)} {r.accuracy}%</span>
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-center gap-3">
          <button onClick={() => window.location.reload()} className="rounded-full bg-primary px-6 py-3 font-display text-primary-foreground">Play again</button>
          <Link to="/dashboard" className="rounded-full border-2 border-foreground px-6 py-3 font-display">Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div>
        <div className="mb-3 flex flex-wrap items-center gap-3 font-display">
          <span className="text-2xl">{"❤️".repeat(Math.max(0, lives))}{"🤍".repeat(Math.max(0, 3 - lives))}</span>
          <span className="rounded-full bg-accent px-3 py-1">⭐ {totalStars}</span>
          <span className="rounded-full bg-accent px-3 py-1">🪙 {coins}</span>
          <span className="rounded-full bg-accent px-3 py-1">Score {score}</span>
          <span className={`rounded-full px-3 py-1 ${combo >= 5 ? "bg-primary text-primary-foreground" : "bg-muted"}`}>🔥 Combo x{combo} ({1 + Math.floor(combo / 5)}×)</span>
          <span className="ml-auto text-muted-foreground">Exercise {idx + 1} / {list.length}</span>
        </div>
        <PoseTracker onFeatures={(f) => { featRef.current = f; }}>
          <div className="pointer-events-none absolute inset-y-0 left-1/2 aspect-square h-full -translate-x-1/2">
            <Figure kp={POSES[targetKey]} color="var(--accent)" dashed className="h-full w-full" />
          </div>
          {phase === "countdown" && (
            <div className="absolute inset-0 flex items-center justify-center bg-foreground/40">
              <span className="animate-ping-once font-display text-9xl text-background">{count > 0 ? count : "GO!"}</span>
            </div>
          )}
          {phase === "result" && lastResult && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-foreground/60 text-background">
              <span className="font-display text-5xl">{lastResult.success ? "Exercise complete!" : "Time's up!"}</span>
              <span className="mt-2 text-4xl">{lastResult.success ? "⭐".repeat(lastResult.stars) : "💔"}</span>
              <span className="mt-1">Accuracy {lastResult.accuracy}%</span>
            </div>
          )}
          {phase === "active" && hint && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-background px-4 py-2 font-display text-foreground shadow-pop">💡 {hint}</div>
          )}
        </PoseTracker>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between font-display text-sm"><span>Pose accuracy</span><span>{acc}%</span></div>
          <div className="h-4 overflow-hidden rounded-full border-2 border-foreground bg-muted">
            <div className={`h-full transition-all ${acc >= THR ? "bg-secondary" : "bg-primary"}`} style={{ width: `${acc}%` }} />
          </div>
          <div className="flex justify-between font-display text-sm"><span>{progress.label || "Get ready"}</span><span>⏱ {phase === "active" ? `${timeLeft}s` : "--"}</span></div>
          <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full bg-accent transition-all" style={{ width: `${Math.min(100, (progress.value / progress.goal) * 100)}%` }} /></div>
        </div>
      </div>
      <aside className="space-y-4">
        <div className="rounded-3xl border-4 border-foreground bg-card p-4 shadow-pop">
          <div className="flex items-center gap-2"><span className="text-3xl">{ch.emoji}</span><div><div className="font-display text-lg">{ch.name}</div><div className="text-xs text-muted-foreground">Your coach</div></div></div>
          <div className="mx-auto mt-2 aspect-square w-full max-w-[240px] rounded-2xl bg-muted">
            <Figure kp={demoKp} color={ch.colorVar} head={ch.emoji} width={0.045} className="h-full w-full" />
          </div>
        </div>
        <div className="rounded-3xl border-4 border-foreground bg-card p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">{ex.difficulty} · {ex.mode}</div>
          <h3 className="font-display text-2xl">{ex.name}</h3>
          <p className="text-xs text-muted-foreground">{ex.parts.join(" · ")}</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm">{ex.instructions.map((s) => <li key={s}>{s}</li>)}</ul>
        </div>
      </aside>
    </div>
  );
}
