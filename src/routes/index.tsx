import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { GameScreen } from "@/components/game/GameScreen";
import { Dashboard } from "@/components/game/Dashboard";
import { VoiceControls } from "@/components/game/VoiceControls";
import { ProfileForm, type AuthMode, type AuthSubmit } from "@/components/game/ProfileForm";
import { Avatar } from "@/components/game/Avatar";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { CHARACTERS, type AchievementId, type Character, type Difficulty } from "@/lib/game/config";
import { loadCoins, loadVoice, personalBest, saveProfile, saveVoice, type Profile, type Session, type VoiceSettings } from "@/lib/game/storage";
import { VoiceCoach } from "@/lib/game/voice";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "MotionPlay — Cartoon Fitness Game with Voice Coach" },
      { name: "description", content: "Copy your cartoon coach's poses on webcam, get live voice coaching, earn stars and combos." },
      { property: "og:title", content: "MotionPlay — Cartoon Fitness Game" },
      { property: "og:description", content: "Webcam pose game with a talking cartoon coach, levels, stars and achievements." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: App,
});

type Screen = "splash" | "auth" | "profile" | "select" | "game" | "dashboard";

function App() {
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>(() => loadVoice());
  const voiceRef = useRef<VoiceCoach>(new VoiceCoach(voiceSettings));
  const voice = voiceRef.current;
  const [screen, setScreen] = useState<Screen>("splash");
  const [character, setCharacter] = useState<Character | null>(null);
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [session, setSession] = useState<Session | null>(null);
  const [newAch, setNewAch] = useState<AchievementId[]>([]);
  const [gameKey, setGameKey] = useState(0);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("signup");

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    void supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setProfile(null); return; }
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("profiles").select("name, age, gender, avatar").eq("id", user.id).maybeSingle();
      let p = data as Profile | null;
      if (!p) {
        const m = user.user_metadata ?? {};
        const pendingAvatar = localStorage.getItem("mp.pendingAvatar");
        p = { name: String(m["name"] ?? user.email?.split("@")[0] ?? "Player"), age: Number(m["age"]) || 10, gender: (m["gender"] ?? "Prefer not to say") as Profile["gender"], avatar: pendingAvatar };
        await supabase.from("profiles").insert({ id: user.id, ...p });
        localStorage.removeItem("mp.pendingAvatar");
      }
      if (!cancelled) { setProfile(p); saveProfile(p); }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const handleAuth = async (d: AuthSubmit): Promise<string | null> => {
    if (d.mode === "login") {
      const { error } = await supabase.auth.signInWithPassword({ email: d.email, password: d.password });
      if (error) return error.message;
      void voice.speak("Welcome back! Choose your cartoon coach.", { interrupt: true });
      setScreen("select");
      return null;
    }
    if (d.mode === "signup") {
      const { name, age, gender, avatar } = d.profile;
      if (avatar) localStorage.setItem("mp.pendingAvatar", avatar); else localStorage.removeItem("mp.pendingAvatar");
      const { data, error } = await supabase.auth.signUp({ email: d.email, password: d.password, options: { emailRedirectTo: window.location.origin, data: { name, age, gender } } });
      if (error) return error.message;
      if (!data.session) { setAuthMode("login"); return "🎉 Account created! Check your email to confirm, then log in."; }
      void voice.speak(`Welcome, ${name}! Choose your cartoon coach.`, { interrupt: true });
      setScreen("select");
      return null;
    }
    if (!user) return "Please log in first.";
    const { error } = await supabase.from("profiles").update({ ...d.profile, updated_at: new Date().toISOString() }).eq("id", user.id);
    if (error) return error.message;
    setProfile(d.profile); saveProfile(d.profile);
    setScreen("select");
    return null;
  };

  const logout = async () => { voice.cancel(); await supabase.auth.signOut(); setCharacter(null); setScreen("splash"); };

  useEffect(() => {
    voice.settings = voiceSettings;
    saveVoice(voiceSettings);
    if (!voiceSettings.enabled) voice.cancel();
  }, [voiceSettings, voice]);

  const selectChar = (c: Character) => {
    setCharacter(c);
    voice.character = c;
    void voice.speak(`You selected ${c.name}. Let's start your workout!`, { interrupt: true });
  };

  return (
    <div className="min-h-screen bg-sky">
      <header className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 pt-4">
        <button onClick={() => { voice.cancel(); setScreen("splash"); }} className="font-display text-3xl font-bold">
          <span className="text-primary">Motion</span><span className="text-secondary">Play</span>
        </button>
        <div className="flex items-center gap-2">
        <span className="rounded-full border-2 border-border bg-card px-3 py-1 text-sm font-extrabold">💎 {loadCoins()}</span>
        <VoiceControls settings={voiceSettings} supported={voice.supported} onChange={setVoiceSettings} />
        </div>
      </header>

      {screen === "splash" && (
        <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-12 text-center">
          <div className="flex -space-x-6">
            {CHARACTERS.map((c, i) => (
              <img key={c.id} src={c.image} alt={c.name} width={1024} height={1024} className="h-28 w-28 animate-bob object-contain sm:h-36 sm:w-36" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </div>
          {user && profile ? (
            <>
              <div className="mt-6"><Avatar profile={profile} size={112} /></div>
              <h1 className="mt-4 text-5xl font-bold sm:text-6xl">Welcome back, {profile.name}! 👋</h1>
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Ready for another cartoon workout?</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={() => setScreen("select")} className="rounded-full border-[3px] border-border bg-primary px-10 py-4 font-display text-3xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1">▶ Continue</button>
                <button onClick={() => setScreen("profile")} className="rounded-full border-[3px] border-border bg-card px-6 py-4 font-display text-xl font-bold shadow-pop-sm">✏️ Edit Profile</button>
                <button onClick={logout} className="rounded-full border-[3px] border-border bg-card px-6 py-4 font-display text-xl font-bold shadow-pop-sm">🚪 Log out</button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-5xl font-bold sm:text-6xl">Welcome to MotionPlay!</h1>
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Your webcam watches your pose, your coach talks you through every move.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => { void voice.speak("Welcome to MotionPlay! Create your account to begin.", { interrupt: true }); setAuthMode("signup"); setScreen("auth"); }}
                  className="rounded-full border-[3px] border-border bg-primary px-12 py-4 font-display text-3xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1"
                >
                  👋 Get Started
                </button>
                <button onClick={() => { setAuthMode("login"); setScreen("auth"); }} className="rounded-full border-[3px] border-border bg-card px-8 py-4 font-display text-2xl font-bold shadow-pop-sm">🔐 Login</button>
              </div>
            </>
          )}
        </div>
      )}

      {screen === "auth" && !user && (
        <ProfileForm key={authMode} mode={authMode} initial={null} onModeChange={setAuthMode} onSubmit={handleAuth} onBack={() => setScreen("splash")} />
      )}

      {screen !== "splash" && screen !== "auth" && !user && (
        <ProfileForm key={`gate-${authMode}`} mode={authMode} initial={null} onModeChange={setAuthMode} onSubmit={handleAuth} onBack={() => setScreen("splash")} />
      )}

      {screen === "profile" && user && profile && (
        <ProfileForm key={`edit-${profile.avatar?.length ?? 0}`} mode="edit" initial={profile} onSubmit={handleAuth} onBack={() => setScreen("splash")} />
      )}

      {screen === "select" && profile && (
        <CharacterSelect
          profile={profile}
          onEditProfile={() => setScreen("profile")}
          selected={character}
          difficulty={difficulty}
          onSelect={selectChar}
          onDifficulty={setDifficulty}
          onStart={() => { setGameKey((k) => k + 1); setScreen("game"); }}
          onDashboard={() => { setSession(null); setNewAch([]); setScreen("dashboard"); }}
          best={personalBest()}
        />
      )}

      {screen === "game" && character && profile && (
        <GameScreen
          key={gameKey}
          character={character}
          difficulty={difficulty}
          profile={profile}
          voice={voice}
          onFinish={(s, a) => { setSession(s); setNewAch(a); setScreen("dashboard"); }}
          onQuit={() => { voice.cancel(); setScreen("select"); }}
        />
      )}

      {screen === "dashboard" && user && (
        <Dashboard
          session={session}
          profile={profile}
          newAchievements={newAch}
          onPlayAgain={() => { if (character) { setGameKey((k) => k + 1); setScreen("game"); } else setScreen("select"); }}
          onHome={() => setScreen("select")}
        />
      )}
    </div>
  );
}
