import { useEffect, useRef, useState } from "react";
import { usePose } from "@/hooks/use-pose";
import { buildLevels, getExercise, scorePose, type Exercise } from "@/lib/game/exercises";
import { ageAdjust, DIFFICULTY, DIFF_ORDER, starsFor, type AchievementId, type Character, type Difficulty } from "@/lib/game/config";
import { addCoins, loadAchievements, saveAchievements, saveSession, type Profile, type ExerciseResult, type Session } from "@/lib/game/storage";
import type { VoiceCoach } from "@/lib/game/voice";
import { AnimatedCoach } from "./AnimatedCoach";
import { cn } from "@/lib/utils";

type Phase = "intro" | "watch" | "countdown" | "active" | "result" | "level" | "over";
type Reaction = { emoji: string; text: string; tone: "good" | "almost" | "bad" | "info" } | null;

type Props = {
  character: Character;
  difficulty: Difficulty;
  profile: Profile;
  voice: VoiceCoach;
  onFinish: (s: Session, unlocked: AchievementId[]) => void;
  onQuit: () => void;
};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)]!;
const ACH_LINES: Record<AchievementId, string> = {
  "first-move": "Achievement unlocked! First Move!",
  "five-stars": "Achievement unlocked! Five Stars!",
  "combo-master": "Achievement unlocked! Combo Master!",
  "balance-expert": "Achievement unlocked! Balance Expert!",
  "motion-champion": "Achievement unlocked! Motion Champion!",
};

export function GameScreen({ character, difficulty: startDiff, profile, voice, onFinish, onQuit }: Props) {
  const { videoRef, canvasRef, landmarksRef, status } = usePose();

  const age = ageAdjust(profile.age);
  const [levels] = useState(() => buildLevels(DIFFICULTY[startDiff].pool, DIFFICULTY[startDiff].levels, false));
  const [coins, setCoins] = useState(0);
  const [mirror, setMirror] = useState(false);
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(0);
  const [exIdx, setExIdx] = useState(0);
  const [exercise, setExercise] = useState<Exercise>(getExercise(levels[0]![0]!));
  const [count, setCount] = useState("");
  const [timeLeft, setTimeLeft] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [hold, setHold] = useState(0);
  const [lives, setLives] = useState(3);
  const [stars, setStars] = useState(0);
  const [combo, setCombo] = useState(0);
  const [score, setScore] = useState(0);
  const [diff, setDiff] = useState<Difficulty>(startDiff);
  const [reaction, setReaction] = useState<Reaction>(null);
  const [toast, setToast] = useState<string | null>(null);

  // refs for the frame loop / async flow
  const phaseRef = useRef<Phase>("intro");
  const exRef = useRef(exercise);
  const diffRef = useRef(diff);
  const holdRef = useRef(0);
  const accStats = useRef({ sum: 0, n: 0, best: 0 });
  const resolveRef = useRef<((r: "success" | "miss") => void) | null>(null);
  const deadline = useRef(0);
  const aliveRef = useRef(true);

  const go = (p: Phase) => { phaseRef.current = p; setPhase(p); };

  // Frame loop: accuracy, hold, timer, live voice feedback (never blocked by speech)
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    let lastUi = 0;
    let lastTone = "";
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const ex = exRef.current;
      const base = DIFFICULTY[diffRef.current];
      const cfg = { ...base, hold: Math.max(1, base.hold + age.holdAdd) };
      const lm = landmarksRef.current;
      const acc = scorePose(ex, lm);

      if (phaseRef.current === "active") {
        if (acc >= cfg.threshold) {
          holdRef.current += dt;
          accStats.current.sum += acc;
          accStats.current.n += 1;
        } else holdRef.current = Math.max(0, holdRef.current - dt * 0.5);
        accStats.current.best = Math.max(accStats.current.best, acc);

        const remaining = Math.max(0, (deadline.current - now) / 1000);
        if (holdRef.current >= cfg.hold) resolveRef.current?.("success");
        else if (remaining <= 0) resolveRef.current?.("miss");

        // live feedback
        const tone = !lm ? "none" : acc >= cfg.threshold ? "good" : acc >= cfg.threshold - 20 ? "almost" : "bad";
        if (tone === "good") {
          if (voice.feedback(pick([character.lines.good, "Excellent!", "Keep holding!", character.lines.going]))) lastTone = "";
        } else if (tone === "almost") voice.feedback(pick(["Almost! Adjust your pose.", "You're close!", "Move your arms slightly.", character.lines.almost]));
        else if (tone === "bad") voice.feedback(pick(["Try again!", "Adjust your position.", "Follow the character."]));
        else voice.feedback("Step into the camera so I can see you.", 4000);

        if (now - lastUi > 100) {
          lastUi = now;
          setAccuracy(acc);
          setHold(Math.min(1, holdRef.current / cfg.hold));
          setTimeLeft(Math.ceil(remaining));
          if (tone !== lastTone) {
            lastTone = tone;
            setReaction(
              tone === "good" ? { emoji: "🎉", text: "GREAT JOB!", tone: "good" }
              : tone === "almost" ? { emoji: "⚡", text: "ALMOST!", tone: "almost" }
              : tone === "bad" ? { emoji: "💪", text: "TRY AGAIN!", tone: "bad" }
              : { emoji: "👀", text: "STEP IN VIEW", tone: "info" },
            );
          }
        }
      } else if (now - lastUi > 150) {
        lastUi = now;
        setAccuracy(acc);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [character, voice, landmarksRef]);

  // Main game flow
  useEffect(() => {
    aliveRef.current = true;
    const alive = () => aliveRef.current;
    const unlocked = new Set<AchievementId>(loadAchievements());
    const newly: AchievementId[] = [];
    const unlock = (id: AchievementId) => {
      if (unlocked.has(id)) return null;
      unlocked.add(id); newly.push(id); saveAchievements([...unlocked]);
      return ACH_LINES[id];
    };
    const flash = (t: string) => { setToast(t); setTimeout(() => alive() && setToast(null), 2600); };

    let coinsL = 0, livesL = 3, starsL = 0, comboL = 0, maxCombo = 0, scoreL = 0, streak = 0, misses = 0, levelsDone = 0;
    let d = startDiff;
    const results: ExerciseResult[] = [];

    const finish = async (completed: boolean) => {
      const session: Session = {
        date: new Date().toISOString(), character: character.id, difficulty: d, score: scoreL, stars: starsL,
        maxCombo, levelsCompleted: levelsDone, completed, results, coins: coinsL, playerName: profile.name,
      };
      saveSession(session);
      await sleep(600);
      if (alive()) onFinish(session, newly);
    };

    (async () => {
      const earn = (n: number) => { coinsL += n; addCoins(n); setCoins(coinsL); };
      for (let L = 0; L < levels.length; L++) {
        for (let i = 0; i < levels[L]!.length; i++) {
          if (!alive()) return;
          const ex = getExercise(levels[L]![i]!);
          exRef.current = ex;
          setExercise(ex); setLevel(L); setExIdx(i); setReaction(null);
          holdRef.current = 0; setHold(0);
          accStats.current = { sum: 0, n: 0, best: 0 };

          // 1. Intro + instructions
          go("intro");
          const t0 = performance.now();
          const dcfg = DIFFICULTY[d];
          await voice.sequence([L === 0 && i === 0 ? `${character.lines.intro} Hi ${profile.name}!` : character.lines.ready, `Next: ${ex.name}.`]);
          const elapsed = performance.now() - t0;
          if (elapsed < 1500) await sleep(1500 - elapsed);
          if (!alive()) return;

          // 1b. Demonstration — the coach performs the move while explaining it
          go("watch");
          const w0 = performance.now();
          const steps = d === "easy" || age.extraGuide ? ex.instructions : ex.instructions.slice(0, 2);
          await voice.sequence([character.lines.watch, dcfg.demoLines[0]!, ...steps]);
          const demoMs = dcfg.anim * age.animMul * 2000;
          const wEl = performance.now() - w0;
          if (wEl < demoMs) await sleep(demoMs - wEl);
          if (!alive()) return;
          await voice.speak(character.lines.turn, { interrupt: true });
          if (!alive()) return;

          // 2. Countdown (spoken + visual in sync)
          go("countdown");
          const labels = ["GET READY!", "3", "2", "1", "GO!"];
          const spoken = ["Get ready!", "Three", "Two", "One", "Go!"];
          for (let k = 0; k < labels.length; k++) {
            if (!alive()) return;
            setCount(labels[k]!);
            void voice.speak(spoken[k]!, { interrupt: true });
            await sleep(1000);
          }

          // 3. Active — scoring only starts now
          const cfg = { ...DIFFICULTY[d], time: Math.max(6, DIFFICULTY[d].time + age.timeAdd) };
          deadline.current = performance.now() + cfg.time * 1000;
          setTimeLeft(cfg.time);
          const outcome = await new Promise<"success" | "miss">((res) => {
            resolveRef.current = (r) => { resolveRef.current = null; res(r); };
            go("active");
          });
          if (!alive()) return;
          go("result");

          if (outcome === "success") {
            const acc = Math.round(accStats.current.n ? accStats.current.sum / accStats.current.n : accStats.current.best);
            const s = starsFor(acc, DIFFICULTY[startDiff].maxStars);
            comboL += 1; maxCombo = Math.max(maxCombo, comboL); starsL += s; streak += 1; misses = 0;
            scoreL += Math.round(acc * cfg.mult * (1 + (comboL - 1) * 0.1));
            setCombo(comboL); setStars(starsL); setScore(scoreL);
            earn(10 + (acc >= 95 ? 20 : acc >= 90 ? 10 : acc >= 80 ? 5 : 0) + (comboL === 5 ? 10 : 0) + (comboL === 10 ? 25 : 0));
            results.push({ id: ex.id, name: ex.name, accuracy: acc, success: true, stars: s });
            setReaction({ emoji: "🎉", text: "EXERCISE COMPLETE!", tone: "good" });
            const lines = [character.lines.done, `Your accuracy is ${acc} percent.`, `You earned ${s} star${s > 1 ? "s" : ""}.`];
            if (comboL === 3) lines.push("Nice combo!");
            if (comboL === 5) lines.push("Awesome! 5 combo!");
            if (comboL === 10) lines.push("Amazing! 10 combo!");
            const achs = [
              unlock("first-move"),
              starsL >= 5 ? unlock("five-stars") : null,
              comboL >= 5 ? unlock("combo-master") : null,
              ex.balance ? unlock("balance-expert") : null,
            ].filter(Boolean) as string[];
            achs.forEach((a) => flash(`🏅 ${a.replace("Achievement unlocked! ", "")}`));
            if ([3, 5, 10].includes(comboL)) flash(`🔥 ${comboL} COMBO!`);
            await voice.sequence([...lines, ...achs]);
            // adaptive difficulty: step up after 3 strong successes
            if (streak >= 3 && acc >= cfg.threshold + 5 && d !== "hard") {
              d = DIFF_ORDER[DIFF_ORDER.indexOf(d) + 1]!; diffRef.current = d; setDiff(d); streak = 0;
              flash(`⬆️ Difficulty: ${DIFFICULTY[d].label}`);
              await voice.speak(`You're on fire! Difficulty is now ${DIFFICULTY[d].label}.`);
            }
          } else {
            if (comboL >= 2) flash("💥 Combo broken!");
            livesL -= 1; comboL = 0; streak = 0; misses += 1;
            setLives(livesL); setCombo(0);
            results.push({ id: ex.id, name: ex.name, accuracy: Math.round(accStats.current.best), success: false, stars: 0 });
            setReaction({ emoji: "💔", text: "TIME'S UP!", tone: "bad" });
            await voice.sequence(["Time's up!", character.lines.retry, "You lost one heart."]);
            if (livesL <= 0) {
              go("over");
              setReaction({ emoji: "💔", text: "GAME OVER", tone: "bad" });
              await voice.sequence(["Game over.", "Great effort!"]);
              return finish(false);
            }
            if (misses >= 2 && d !== "easy") {
              d = DIFF_ORDER[DIFF_ORDER.indexOf(d) - 1]!; diffRef.current = d; setDiff(d); misses = 0;
              flash(`⬇️ Difficulty: ${DIFFICULTY[d].label}`);
              await voice.speak(`Let's make it a little easier. Difficulty is now ${DIFFICULTY[d].label}.`);
            }
          }
          await sleep(500);
        }
        // Level complete
        if (!alive()) return;
        levelsDone = L + 1;
        earn(50);
        flash("💎 +50 coins");
        go("level");
        setReaction({ emoji: "🏆", text: "LEVEL COMPLETE!", tone: "good" });
        const lvlLines =
          L < levels.length - 1 ? [character.lines.level, `Get ready for Level ${L + 2}.`]
          : [character.lines.level, `Congratulations ${profile.name}!`, "You completed all levels!", "You are a Motion Champion!"];
        if (L === levels.length - 1) {
          const a = unlock("motion-champion");
          if (a) { lvlLines.push(a); flash("🏅 Motion Champion"); }
        }
        await voice.sequence(lvlLines);
        await sleep(800);
      }
      return finish(true);
    })();

    return () => {
      aliveRef.current = false;
      resolveRef.current = null;
      voice.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cfg = DIFFICULTY[diff];
  const progress = ((exIdx + (phase === "result" || phase === "level" ? 1 : 0)) / levels[level]!.length) * 100;
  const coachMode = phase === "watch" ? "demo" : phase === "active" ? "hold" : "idle";
  const mood = reaction?.tone === "good" ? "happy" : reaction?.tone === "bad" ? "sad" : "neutral";
  const accTone = accuracy >= cfg.threshold ? "bg-success" : accuracy >= cfg.threshold - 20 ? "bg-warning" : "bg-destructive";

  return (
    <div className="mx-auto max-w-7xl space-y-4 px-4 py-4">
      {/* HUD */}
      <div className="cartoon-card flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div className="font-display text-lg font-bold">
          LEVEL {level + 1} · EXERCISE {exIdx + 1} / {levels[level]!.length} · {cfg.module}
        </div>
        <div className="flex flex-wrap items-center gap-4 text-lg font-extrabold">
          <span aria-label="Lives">{[0, 1, 2].map((i) => (i < lives ? "❤️" : "🖤")).join("")}</span>
          <span>⭐ {stars}</span>
          <span className={cn(combo >= 3 && "animate-wiggle inline-block")}>🔥 {combo}</span>
          <span>🏅 {score}</span>
          <span>💎 {coins}</span>
          <span className="rounded-full border-2 border-border bg-muted px-3 text-sm">{cfg.label} · {cfg.threshold}%</span>
          <button onClick={() => setMirror((m) => !m)} className={cn("rounded-full border-2 border-border px-3 text-sm", mirror ? "bg-accent" : "hover:bg-muted")}>🪞 Mirror {mirror ? "ON" : "OFF"}</button>
          <button onClick={onQuit} className="rounded-full border-2 border-border px-3 text-sm hover:bg-muted">Quit</button>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full border-2 border-border bg-muted">
          <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        {/* LEFT: character coach */}
        <div className="cartoon-card relative flex flex-col items-center p-4">
          <p className="font-display text-sm font-bold tracking-widest text-primary">
            {phase === "watch" ? "🎭 WATCH ME FIRST!" : phase === "active" ? "FOLLOW THE CHARACTER!" : "CARTOON COACH"}
          </p>
          <h2 className="text-3xl font-bold">{exercise.name}</h2>
          <div className="relative mt-2 flex w-full items-end justify-center">
            <div className="aspect-[22/26] w-full max-w-[300px]">
              <AnimatedCoach exercise={exercise} image={character.image} speed={DIFFICULTY[diff].anim * age.animMul} mode={coachMode} mood={mood} mirror={mirror} />
            </div>
            {reaction && (
              <div key={reaction.text} className={cn(
                "animate-pop absolute -top-2 left-2 rounded-2xl border-[3px] border-border px-3 py-1 font-display text-lg font-bold shadow-pop-sm",
                reaction.tone === "good" ? "bg-success text-success-foreground" : reaction.tone === "almost" ? "bg-warning" : reaction.tone === "bad" ? "bg-destructive text-destructive-foreground" : "bg-card",
              )}>
                {reaction.emoji} {reaction.text}
              </div>
            )}
          </div>
          <p className="font-display text-xl font-bold">{character.name}</p>
          <ol className="mt-3 w-full space-y-1.5">
            {exercise.instructions.map((s, i) => (
              <li key={s} className="flex items-center gap-2 rounded-xl bg-muted px-3 py-1.5 text-sm font-bold">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-secondary text-xs text-secondary-foreground">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        {/* RIGHT: webcam */}
        <div className="cartoon-card flex flex-col gap-3 p-4">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-[3px] border-border bg-foreground">
            <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
            <span className="absolute left-3 top-3 rounded-full bg-card px-3 py-1 text-xs font-extrabold">📷 YOUR TURN</span>
            {status !== "ready" && (
              <div className="absolute inset-0 grid place-items-center bg-foreground/70 p-6 text-center font-bold text-background">
                {status === "loading" ? "📷 Starting camera & pose detection…" : status === "camera-error" ? "📷 Camera blocked. Allow camera access and reload to play." : "⚠️ Pose detection failed to load. Please reload."}
              </div>
            )}
            {(phase === "countdown" || phase === "intro" || phase === "watch") && (
              <div className="absolute inset-0 grid place-items-center bg-foreground/40">
                {phase === "countdown" ? (
                  <span key={count} className="animate-pop font-display text-8xl font-bold text-accent drop-shadow-lg">{count}</span>
                ) : (
                  <span className="animate-pop rounded-2xl bg-card px-6 py-3 font-display text-3xl font-bold">{phase === "watch" ? `👀 Watch ${character.name} first…` : `Get ready for ${exercise.name}!`}</span>
                )}
              </div>
            )}
            {(phase === "level" || phase === "over") && reaction && (
              <div className="absolute inset-0 grid place-items-center bg-foreground/50">
                <span className="animate-pop font-display text-6xl font-bold text-accent drop-shadow-lg">{reaction.emoji} {reaction.text}</span>
              </div>
            )}
            {toast && (
              <div key={toast} className="animate-pop absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border-[3px] border-border bg-accent px-4 py-1 font-display text-xl font-bold">
                {toast}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl bg-muted p-2">
              <p className="text-xs font-bold text-muted-foreground">ACCURACY</p>
              <p className="font-display text-3xl font-bold">{accuracy}%</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-card"><div className={cn("h-full transition-all", accTone)} style={{ width: `${accuracy}%` }} /></div>
            </div>
            <div className="rounded-2xl bg-muted p-2">
              <p className="text-xs font-bold text-muted-foreground">TIME</p>
              <p className={cn("font-display text-3xl font-bold", phase === "active" && timeLeft <= 3 && "text-destructive")}>{phase === "active" ? timeLeft : Math.max(6, cfg.time + age.timeAdd)}</p>
            </div>
            <div className="rounded-2xl bg-muted p-2">
              <p className="text-xs font-bold text-muted-foreground">HOLD {Math.max(1, cfg.hold + age.holdAdd)}s</p>
              <p className="font-display text-3xl font-bold">{Math.round(hold * 100)}%</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-card"><div className="h-full bg-secondary transition-all" style={{ width: `${hold * 100}%` }} /></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
