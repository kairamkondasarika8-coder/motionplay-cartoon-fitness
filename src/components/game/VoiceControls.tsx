import { Settings2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { VoiceSettings, VoiceSpeed, VoiceVolume } from "@/lib/game/storage";
import { cn } from "@/lib/utils";

type Props = { settings: VoiceSettings; supported: boolean; onChange: (s: VoiceSettings) => void };

function Seg<T extends string>({ value, options, onPick }: { value: T; options: T[]; onPick: (v: T) => void }) {
  return (
    <div className="grid grid-cols-3 gap-1 rounded-full border-2 border-border bg-muted p-1">
      {options.map((o) => (
        <button
          key={o}
          onClick={() => onPick(o)}
          className={cn(
            "rounded-full px-2 py-1 text-xs font-bold capitalize transition",
            value === o ? "bg-primary text-primary-foreground" : "hover:bg-card",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

export function VoiceControls({ settings, supported, onChange }: Props) {
  if (!supported)
    return (
      <div className="rounded-full border-2 border-border bg-muted px-3 py-1.5 text-xs font-bold">
        🔇 Voice coaching is unavailable on this browser.
      </div>
    );
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => onChange({ ...settings, enabled: !settings.enabled })}
        className={cn(
          "rounded-full border-[3px] border-border px-4 py-1.5 text-sm font-extrabold shadow-pop-sm transition active:translate-y-0.5",
          settings.enabled ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground",
        )}
        aria-pressed={settings.enabled}
      >
        {settings.enabled ? "🔊 Voice ON" : "🔇 Voice OFF"}
      </button>
      <Popover>
        <PopoverTrigger
          className="grid h-9 w-9 place-items-center rounded-full border-[3px] border-border bg-card shadow-pop-sm"
          aria-label="Voice settings"
        >
          <Settings2 className="h-4 w-4" />
        </PopoverTrigger>
        <PopoverContent className="w-64 space-y-3 rounded-2xl border-[3px] border-border">
          <h3 className="text-lg font-bold">Voice Settings</h3>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Volume</p>
            <Seg<VoiceVolume> value={settings.volume} options={["low", "medium", "high"]} onPick={(v) => onChange({ ...settings, volume: v })} />
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-muted-foreground">Speed</p>
            <Seg<VoiceSpeed> value={settings.speed} options={["slow", "normal", "fast"]} onPick={(v) => onChange({ ...settings, speed: v })} />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
