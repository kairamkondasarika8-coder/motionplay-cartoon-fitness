import { useState } from "react";
import { z } from "zod";
import type { Gender, Profile } from "@/lib/game/storage";
import { cn } from "@/lib/utils";

const GENDERS: Gender[] = ["Male", "Female", "Other", "Prefer not to say"];
const AGES = Array.from({ length: 21 }, (_, i) => i + 5);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(60, "Name must be under 60 characters."),
  age: z.number({ message: "Please select your age." }).int().min(5, "⚠️ Age must be 5 years or above.").max(25, "⚠️ Age must be 25 years or below."),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], { message: "Please choose an option." }),
});
export type ProfileMode = "create" | "edit";
export type ProfileSubmit = { mode: ProfileMode; profile: Profile };

type Props = {
  mode: ProfileMode;
  initial: Profile | null;
  onSubmit: (d: ProfileSubmit) => Promise<string | null>;
  onBack: () => void;
};

export function ProfileForm({ mode, initial, onSubmit, onBack }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState<string>(initial ? String(initial.age) : "");
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    const r = profileSchema.safeParse({ name, age: age === "" ? undefined : Number(age), gender: gender || undefined });
    if (!r.success) r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
    setErrors(errs);
    if (Object.keys(errs).length || !r.success) return;
    setBusy(true); setMsg("");
    const res = await onSubmit({ mode, profile: r.data as Profile });
    setBusy(false);
    if (res) setMsg(res);
  };

  const field = "w-full rounded-2xl border-[3px] border-border bg-card px-4 py-3 text-lg font-bold outline-none focus:ring-4 focus:ring-primary/40";
  const err = (k: string) => errors[k] && <span className="text-sm font-bold text-destructive">{errors[k]}</span>;
  const title = mode === "create" ? "📝 PLAYER PROFILE" : "✏️ EDIT PROFILE";

  return (
    <div className="mx-auto mt-6 max-w-lg px-4 pb-10">
      <button type="button" onClick={onBack} className="mb-3 rounded-full border-[3px] border-border bg-card px-4 py-2 font-bold shadow-pop-sm">⬅ Back to Welcome</button>
      <form onSubmit={submit} className="cartoon-card space-y-5 p-6" noValidate>
        <div className="text-center">
          <p className="font-display text-xl font-bold">{title}</p>
          <h1 className="text-5xl font-bold"><span className="text-primary">MOTION</span><span className="text-secondary">PLAY</span></h1>
          <p className="mt-1 font-bold text-muted-foreground">Your Cartoon Fitness Adventure Starts Here!</p>
        </div>

        <>
            <label className="block space-y-1">
              <span className="font-extrabold">👤 Full Name</span>
              <input className={field} value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              {err("name")}
            </label>
            <label className="block space-y-1">
              <span className="font-extrabold">🎂 Age (5–25)</span>
              <select className={field} value={age} onChange={(e) => setAge(e.target.value)}>
                <option value="">Select age</option>
                {AGES.map((a) => <option key={a} value={a}>{a}</option>)}
              </select>
              {err("age")}
            </label>
            <div className="space-y-1">
              <span className="font-extrabold">⚧️ Gender</span>
              <div className="grid grid-cols-2 gap-2">
                {GENDERS.map((g) => (
                  <button type="button" key={g} onClick={() => setGender(g)}
                    className={cn("rounded-2xl border-[3px] border-border px-3 py-2 font-bold shadow-pop-sm", gender === g ? "bg-secondary text-secondary-foreground" : "bg-card")}>
                    {g}
                  </button>
                ))}
              </div>
              {err("gender")}
            </div>
        </>

        {msg && <p className="rounded-2xl bg-muted p-3 text-center font-bold">{msg}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-full border-[3px] border-border bg-primary py-4 font-display text-2xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1 disabled:opacity-60">
          {busy ? "Please wait…" : mode === "create" ? "SAVE & START 🚀" : "SAVE PROFILE ✅"}
        </button>
      </form>
    </div>
  );
}
