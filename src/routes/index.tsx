import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CharacterSelect } from "@/components/game/CharacterSelect";
import { GameScreen } from "@/components/game/GameScreen";
import { Dashboard } from "@/components/game/Dashboard";
import { VoiceControls } from "@/components/game/VoiceControls";
import { ProfileForm, type ProfileSubmit } from "@/components/game/ProfileForm";
import { Avatar } from "@/components/game/Avatar";
import { CHARACTERS, type AchievementId, type Character, type Difficulty } from "@/lib/game/config";
import { loadCoins, loadProfile, loadVoice, personalBest, saveProfile, saveVoice, type Profile, type Session, type VoiceSettings } from "@/lib/game/storage";
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

type Screen = "splash" | "profile" | "select" | "game" | "dashboard";

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
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());

  const handleProfile = async (d: ProfileSubmit): Promise<string | null> => {
    setProfile(d.profile); saveProfile(d.profile);
    void voice.speak(`Welcome, ${d.profile.name}! Choose your cartoon coach.`, { interrupt: true });
    setScreen("select");
    return null;
  };

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
          {profile ? (
            <>
              <div className="mt-6"><Avatar profile={profile} size={112} /></div>
              <h1 className="mt-4 text-5xl font-bold sm:text-6xl">Welcome back, {profile.name}! 👋</h1>
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Ready for another cartoon workout?</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button onClick={() => setScreen("select")} className="rounded-full border-[3px] border-border bg-primary px-10 py-4 font-display text-3xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1">▶ Continue</button>
                <button onClick={() => setScreen("profile")} className="rounded-full border-[3px] border-border bg-card px-6 py-4 font-display text-xl font-bold shadow-pop-sm">✏️ Edit Profile</button>
              </div>
            </>
          ) : (
            <>
              <h1 className="mt-6 text-5xl font-bold sm:text-6xl">Welcome to MotionPlay!</h1>
              <p className="mt-4 text-lg font-semibold text-muted-foreground">Your webcam watches your pose, your coach talks you through every move.</p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <button
                  onClick={() => { void voice.speak("Welcome to MotionPlay! Create your player profile to begin.", { interrupt: true }); setScreen("profile"); }}
                  className="rounded-full border-[3px] border-border bg-primary px-12 py-4 font-display text-3xl font-bold text-primary-foreground shadow-pop transition active:translate-y-1"
                >
                  👋 Create Profile
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {screen === "profile" && (
        <ProfileForm key={profile ? "edit" : "create"} mode={profile ? "edit" : "create"} initial={profile} onSubmit={handleProfile} onBack={() => setScreen("splash")} />
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

      {screen === "dashboard" && profile && (
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
