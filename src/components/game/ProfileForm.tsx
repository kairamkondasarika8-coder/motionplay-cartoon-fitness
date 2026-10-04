import { useState } from "react";
import { z } from "zod";
import type { Gender, Profile } from "@/lib/game/storage";
import { cn } from "@/lib/utils";
import { SelfiePicker } from "./SelfiePicker";

const GENDERS: Gender[] = ["Male", "Female", "Other", "Prefer not to say"];
const AGES = Array.from({ length: 21 }, (_, i) => i + 5);

const profileSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name.").max(60, "Name must be under 60 characters."),
  age: z.number({ message: "Please select your age." }).int().min(5, "⚠️ Age must be 5 years or above.").max(25, "⚠️ Age must be 25 years or below."),
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"], { message: "Please choose an option." }),
});
const emailSchema = z.string().trim().email("Please enter a valid email.").max(255);
const pwSchema = z.string().min(6, "Password must be at least 6 characters.").max(72);

export type AuthMode = "signup" | "login" | "edit";
export type AuthSubmit =
  | { mode: "signup"; email: string; password: string; profile: Profile }
  | { mode: "login"; email: string; password: string }
  | { mode: "edit"; profile: Profile };

type Props = {
  mode: AuthMode;
  initial: Profile | null;
  onModeChange?: (m: AuthMode) => void;
  onSubmit: (d: AuthSubmit) => Promise<string | null>;
  onBack: () => void;
};

export function ProfileForm({ mode, initial, onModeChange, onSubmit, onBack }: Props) {
  const [name, setName] = useState(initial?.name ?? "");
  const [age, setAge] = useState<string>(initial ? String(initial.age) : "");
  const [gender, setGender] = useState<Gender | "">(initial?.gender ?? "");
  const [avatar, setAvatar] = useState<string | null>(initial?.avatar ?? null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs: Record<string, string> = {};
    let profile: Profile | null = null;
    if (mode !== "login") {
      const r = profileSchema.safeParse({ name, age: age === "" ? undefined : Number(age), gender: gender || undefined });
      if (!r.success) r.error.issues.forEach((i) => { errs[String(i.path[0])] ??= i.message; });
      else profile = { ...(r.data as Profile), avatar };
    }
    if (mode !== "edit") {
      const em = emailSchema.safeParse(email); if (!em.success) errs["email"] = em.error.issues[0]!.message;
      const pw = pwSchema.safeParse(password); if (!pw.success) errs["password"] = pw.error.issues[0]!.message;
      if (mode === "signup" && confirm !== password) errs["confirm"] = "Passwords do not match.";
    }
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true); setMsg("");
    const res = mode === "edit" ? await onSubmit({ mode, profile: profile! })
      : mode === "signup" ? await onSubmit({ mode, email: email.trim(), password, profile: profile! })
      : await onSubmit({ mode, email: email.trim(), password });
    setBusy(false);
    if (res) setMsg(res);
  };

  const field = "w-full rounded-2xl border-[3px] border-border bg-card px-4 py-3 text-lg font-bold outline-none focus:ring-4 focus:ring-primary/40";
  const err = (k: string) => errors[k] && <span className="text-sm font-bold text-destructive">{errors[k]}</span>;
  const title = mode === "signup" ? "📝 SIGN UP" : mode === "login" ? "🔐 LOGIN" : "✏️ EDIT PROFILE";

  return (
    <div className="mx-auto mt-6 max-w-lg px-4 pb-10">
      <button type="button" onClick={onBack} className="mb-3 rounded-full border-[3px] border-border bg-card px-4 py-2 font-bold shadow-pop-sm">⬅ Back to Welcome</button>
      <form onSubmit={submit} className="cartoon-card space-y-5 p-6" noValidate>
        <div className="text-center">
          <p className="font-display text-xl font-bold">{title}</p>
          <h1 className="text-5xl font-bold"><span className="text-primary">MOTION</span><span className="text-secondary">PLAY</span></h1>
          <p className="mt-1 font-bold text-muted-foreground">Your Cartoon Fitness Adventure Starts Here!</p>
        </div>

        {mode !== "login" && (
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
        )}

        {mode !== "edit" && (
          <>
            <label className="block space-y-1">
              <span className="font-extrabold">📧 Email</span>
              <input type="email" autoComplete="email" className={field} value={email} maxLength={255} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              {err("email")}
            </label>
            <label className="block space-y-1">
              <span className="font-extrabold">🔑 Password</span>
              <input type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} className={field} value={password} onChange={(e) => setPassword(e.target.value)} />
              {err("password")}
            </label>
            {mode === "signup" && (
              <label className="block space-y-1">
                <span className="font-extrabold">🔑 Confirm Password</span>
                <input type="password" autoComplete="new-password" className={field} value={confirm} onChange={(e) => setConfirm(e.target.value)} />
                {err("confirm")}
              </label>
            )}
          </>
        )}

        {mode !== "login" && <SelfiePicker value={avatar} onChange={setAvatar} />}

        {msg && <p className="rounded-2xl bg-muted p-3 text-center font-bold">{msg}</p>}

        <button type="submit" disabled={busy} className="w-full rounded-full border-[3px] border-border bg-primary py-4 font-display text-2xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1 disabled:opacity-60">
          {busy ? "Please wait…" : mode === "signup" ? "SIGN UP & START 🚀" : mode === "login" ? "LOGIN & START 🚀" : "SAVE PROFILE ✅"}
        </button>

        {mode !== "edit" && onModeChange && (
          <p className="text-center font-bold">
            {mode === "login" ? "New here? " : "Already have an account? "}
            <button type="button" className="text-primary underline underline-offset-4" onClick={() => { setMsg(""); setErrors({}); onModeChange(mode === "login" ? "signup" : "login"); }}>
              {mode === "login" ? "Sign up" : "Login"}
            </button>
          </p>
        )}
      </form>
    </div>
  );
}
