import type { Profile } from "@/lib/game/storage";

export function Avatar({ profile, size = 48 }: { profile: Pick<Profile, "name" | "avatar">; size?: number }) {
  const style = { width: size, height: size };
  if (profile.avatar)
    return <img src={profile.avatar} alt={`${profile.name}'s selfie`} style={style} className="shrink-0 rounded-full border-[3px] border-border object-cover shadow-pop-sm" />;
  return (
    <div style={{ ...style, fontSize: size * 0.45 }} className="grid shrink-0 place-items-center rounded-full border-[3px] border-border bg-secondary font-display font-bold text-secondary-foreground">
      {profile.name.charAt(0).toUpperCase() || "?"}
    </div>
  );
}
