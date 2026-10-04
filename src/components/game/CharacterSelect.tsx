import { Avatar } from "./Avatar";
import { CHARACTERS, DIFFICULTY, DIFF_ORDER, type Character, type Difficulty } from "@/lib/game/config";
import type { Profile } from "@/lib/game/storage";
import { cn } from "@/lib/utils";

type Props = {
  profile: Profile;
  selected: Character | null;
  difficulty: Difficulty;
  onSelect: (c: Character) => void;
  onDifficulty: (d: Difficulty) => void;
  onStart: () => void;
  onDashboard: () => void;
  onEditProfile: () => void;
  best: number;
};

export function CharacterSelect({ profile, selected, difficulty, onSelect, onDifficulty, onStart, onDashboard, onEditProfile, best }: Props) {
  const cfg = DIFFICULTY[difficulty];
  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-8">
      <div className="text-center">
        <div className="mb-2 flex justify-center"><Avatar profile={profile} size={88} /></div>
        <h1 className="text-4xl font-bold sm:text-5xl">Welcome back, {profile.name}! 👋</h1>
        <p className="mt-2 font-semibold text-muted-foreground">Ready to exercise with your cartoon coach? Pick the one you like.</p>
        <button onClick={onEditProfile} className="mt-1 text-xs font-bold underline underline-offset-4">Age {profile.age} · {profile.gender} · Edit profile</button>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {CHARACTERS.map((c) => {
          const on = selected?.id === c.id;
          return (
            <div key={c.id} className={cn("cartoon-card flex flex-col p-3 transition hover:-translate-y-1", on && "bg-accent ring-4 ring-primary")}>
              <img src={c.image} alt={c.name} width={1024} height={1024} className={cn("aspect-square w-full object-contain", on && "animate-bob")} />
              <p className="font-display text-xl font-bold">{c.name}</p>
              <p className="text-xs font-bold text-primary">{c.personality}</p>
              <p className="text-xs font-semibold text-muted-foreground">{c.tagline}</p>
              <button onClick={() => onSelect(c)}
                className={cn("mt-3 rounded-full border-[3px] border-border py-2 font-extrabold shadow-pop-sm", on ? "bg-success text-success-foreground" : "bg-card hover:bg-muted")}>
                {on ? "✓ SELECTED" : "SELECT"}
              </button>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col items-center gap-4">
        <div className="grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {DIFF_ORDER.map((d) => {
            const c = DIFFICULTY[d];
            return (
              <button key={d} onClick={() => onDifficulty(d)}
                className={cn("rounded-3xl border-[3px] border-border p-3 text-left shadow-pop-sm", difficulty === d ? "bg-secondary text-secondary-foreground" : "bg-card")}>
                <p className="font-display text-xl font-bold">{d === "easy" ? "🟢" : d === "medium" ? "🟡" : "🔴"} {c.label}</p>
                <p className="text-sm font-extrabold">{c.module}</p>
                <p className="text-xs font-semibold opacity-80">{c.purpose}</p>
                <p className="mt-1 text-xs font-bold opacity-80">{c.threshold}%+ · hold {c.hold}s · {c.time}s · {c.levels.join("/")} moves</p>
              </button>
            );
          })}
        </div>
        <p className="text-sm font-bold text-muted-foreground">{cfg.module}: {cfg.pool.length} exercises · up to {"⭐".repeat(cfg.maxStars)} per move</p>
        <button disabled={!selected} onClick={onStart}
          className="rounded-full border-[3px] border-border bg-primary px-10 py-4 font-display text-2xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1 disabled:opacity-40">
          {selected ? `Start with ${selected.name}!` : "Select your coach first"}
        </button>
        <button onClick={onDashboard} className="text-sm font-bold underline underline-offset-4">
          📊 History & achievements {best > 0 && `· Best ${best}`}
        </button>
      </div>
    </div>
  );
}
