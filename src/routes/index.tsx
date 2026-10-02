import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CHARACTERS, getCharacter, initVoices, say } from "@/lib/game/characters";
import { ageBand } from "@/lib/game/exercises";
import { loadProfile, saveProfile, type Difficulty } from "@/lib/game/storage";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "MotionPlay — Player Profile" },
      { name: "description", content: "Set up your MotionPlay player profile, pick a cartoon voice coach and start a webcam fitness game." },
      { property: "og:title", content: "MotionPlay — Cartoon Fitness Game" },
      { property: "og:description", content: "Pick a cartoon coach and play 50 webcam-tracked exercises tuned to your age." },
    ],
  }),
  component: ProfilePage,
});

const AGES = Array.from({ length: 21 }, (_, i) => i + 5);

function ProfilePage() {
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [ageText, setAgeText] = useState("");
  const [gender, setGender] = useState("");
  const [characterId, setCharacterId] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [welcomed, setWelcomed] = useState(false);

  useEffect(() => {
    initVoices();
    const p = loadProfile();
    if (p) { setName(p.name); setAgeText(String(p.age)); setGender(p.gender); setCharacterId(p.characterId); setDifficulty(p.difficulty); }
  }, []);

  const age = Number(ageText);
  const ageErr = ageText === "" ? "" : !/^\d+$/.test(ageText) ? "⚠️ Age must be a whole number." : age < 5 ? "⚠️ Age must be 5 years or above." : age > 25 ? "⚠️ Age must be 25 years or below." : "";
  const ageOk = ageText !== "" && !ageErr;
  const valid = name.trim() && ageOk && gender && characterId;
  const band = ageOk ? ageBand(age) : null;

  const welcome = () => { if (!welcomed) { setWelcomed(true); say(CHARACTERS[0]!, "welcome", {}, true); } };
  const pick = (id: string) => { setCharacterId(id); say(getCharacter(id), "selected", {}, true); };
  const start = (to: "/play" | "/library" | "/dance") => {
    if (!valid) return;
    saveProfile({ name: name.trim(), age, gender, characterId, difficulty });
    nav({ to, search: to === "/play" ? {} : undefined } as never);
  };

  return (
    <div className="mx-auto max-w-4xl" onPointerDown={welcome}>
      <section className="text-center">
        <h1 className="font-display text-5xl sm:text-6xl">Move. Match. <span className="text-primary">Play!</span></h1>
        <p className="mt-3 text-lg text-muted-foreground">Your cartoon coach watches through the webcam and cheers you on.</p>
      </section>

      <div className="mt-8 grid gap-6 rounded-3xl border-4 border-foreground bg-card p-6 shadow-pop sm:p-8">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="grid gap-1 font-display">👤 Name
            <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Your name" className="rounded-xl border-2 border-foreground bg-background px-3 py-2 font-sans" />
          </label>
          <div className="grid gap-1 font-display">🎂 Age (5–25)
            <div className="flex gap-2">
              <select value={ageOk ? ageText : ""} onChange={(e) => setAgeText(e.target.value)} className="flex-1 rounded-xl border-2 border-foreground bg-background px-3 py-2 font-sans">
                <option value="">Select</option>
                {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              <input value={ageText} onChange={(e) => setAgeText(e.target.value.trim())} inputMode="numeric" placeholder="or type" aria-label="Type age" className="w-20 rounded-xl border-2 border-foreground bg-background px-2 py-2 font-sans" />
            </div>
            {ageErr && <span className="font-sans text-sm text-destructive">{ageErr}</span>}
          </div>
          <label className="grid gap-1 font-display">⚧️ Gender
            <select value={gender} onChange={(e) => setGender(e.target.value)} className="rounded-xl border-2 border-foreground bg-background px-3 py-2 font-sans">
              <option value="">Select</option><option>Girl / Female</option><option>Boy / Male</option><option>Other</option><option>Prefer not to say</option>
            </select>
          </label>
        </div>

        {band && <div className="rounded-2xl bg-accent/40 px-4 py-3 text-sm"><b className="font-display">{band.label}:</b> {band.note}</div>}

        <div>
          <h2 className="font-display text-xl">🎭 Choose your coach</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {CHARACTERS.map((c) => (
              <button key={c.id} onClick={() => pick(c.id)}
                className={`rounded-2xl border-4 p-4 text-center transition-transform hover:-translate-y-1 ${characterId === c.id ? "border-foreground shadow-pop" : "border-transparent bg-muted"}`}
                style={characterId === c.id ? { background: `color-mix(in oklch, ${c.colorVar} 25%, var(--card))` } : undefined}>
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-5xl" style={{ background: c.colorVar }}>{c.emoji}</div>
                <div className="mt-2 font-display text-lg">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.tagline}</div>
              </button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-display text-xl">🎯 Difficulty</h2>
          <div className="mt-3 flex gap-3">
            {(["easy", "medium", "hard"] as const).map((d) => (
              <button key={d} onClick={() => setDifficulty(d)} className={`flex-1 rounded-full border-2 border-foreground px-4 py-2 font-display capitalize ${difficulty === d ? "bg-foreground text-background" : ""}`}>{d}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button disabled={!valid} onClick={() => start("/play")} className="flex-1 rounded-full bg-primary px-6 py-4 font-display text-xl text-primary-foreground shadow-pop disabled:opacity-40 disabled:shadow-none">▶ Start workout</button>
          <button disabled={!valid} onClick={() => start("/dance")} className="rounded-full border-2 border-foreground px-6 py-4 font-display disabled:opacity-40">💃 Dance mode</button>
          <button disabled={!valid} onClick={() => start("/library")} className="rounded-full border-2 border-foreground px-6 py-4 font-display disabled:opacity-40">📚 Pick exercise</button>
        </div>
        {!valid && <p className="text-center text-sm text-muted-foreground">Fill in name, a valid age (5–25), gender and a coach to start.</p>}
      </div>
    </div>
  );
}
