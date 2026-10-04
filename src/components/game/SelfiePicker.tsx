import { useEffect, useRef, useState } from "react";

const SIZE = 256;

function toSquareJpeg(src: CanvasImageSource, w: number, h: number, mirror = false) {
  const c = document.createElement("canvas");
  c.width = SIZE; c.height = SIZE;
  const ctx = c.getContext("2d")!;
  const s = Math.min(w, h);
  if (mirror) { ctx.translate(SIZE, 0); ctx.scale(-1, 1); }
  ctx.drawImage(src, (w - s) / 2, (h - s) / 2, s, s, 0, 0, SIZE, SIZE);
  return c.toDataURL("image/jpeg", 0.8);
}

export function SelfiePicker({ value, onChange }: { value: string | null; onChange: (v: string | null) => void }) {
  const [mode, setMode] = useState<"idle" | "camera" | "preview">("idle");
  const [shot, setShot] = useState<string | null>(null);
  const [err, setErr] = useState("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const stop = () => { streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null; };
  useEffect(() => stop, []);

  const open = async () => {
    setErr("");
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
      streamRef.current = s;
      setMode("camera");
      requestAnimationFrame(() => { if (videoRef.current) { videoRef.current.srcObject = s; void videoRef.current.play(); } });
    } catch {
      setErr("Camera blocked. Allow camera access or upload a photo instead.");
    }
  };

  const capture = () => {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    setShot(toSquareJpeg(v, v.videoWidth, v.videoHeight, true));
    stop();
    setMode("preview");
  };

  const upload = (f: File | undefined) => {
    if (!f) return;
    if (!f.type.startsWith("image/") || f.size > 10 * 1024 * 1024) { setErr("Please choose an image under 10 MB."); return; }
    const img = new Image();
    img.onload = () => { setShot(toSquareJpeg(img, img.width, img.height)); setMode("preview"); URL.revokeObjectURL(img.src); };
    img.src = URL.createObjectURL(f);
  };

  const btn = "rounded-full border-[3px] border-border px-4 py-2 font-bold shadow-pop-sm";
  return (
    <div className="space-y-2">
      <span className="font-extrabold">🤳 Selfie (profile picture)</span>
      <div className="flex flex-col items-center gap-3 rounded-2xl border-[3px] border-dashed border-border bg-muted p-4">
        {mode === "camera" && (
          <>
            <video ref={videoRef} playsInline muted className="aspect-square w-56 -scale-x-100 rounded-full border-[3px] border-border object-cover" />
            <div className="flex gap-2">
              <button type="button" onClick={capture} className={`${btn} bg-primary text-primary-foreground`}>📸 Capture</button>
              <button type="button" onClick={() => { stop(); setMode("idle"); }} className={`${btn} bg-card`}>Cancel</button>
            </div>
          </>
        )}
        {mode === "preview" && shot && (
          <>
            <img src={shot} alt="Selfie preview" className="w-40 rounded-full border-[3px] border-border" />
            <div className="flex gap-2">
              <button type="button" onClick={() => { setShot(null); void open(); }} className={`${btn} bg-card`}>🔄 Retake</button>
              <button type="button" onClick={() => { onChange(shot); setMode("idle"); }} className={`${btn} bg-success text-success-foreground`}>✅ Use Photo</button>
            </div>
          </>
        )}
        {mode === "idle" && (
          <>
            {value ? <img src={value} alt="Your selfie" className="w-28 rounded-full border-[3px] border-border" /> : <div className="grid h-28 w-28 place-items-center rounded-full border-[3px] border-border bg-card text-4xl">🙂</div>}
            <div className="flex flex-wrap justify-center gap-2">
              <button type="button" onClick={open} className={`${btn} bg-secondary text-secondary-foreground`}>Take Selfie 📷</button>
              <button type="button" onClick={() => fileRef.current?.click()} className={`${btn} bg-card`}>Upload Photo 🖼️</button>
              {value && <button type="button" onClick={() => onChange(null)} className={`${btn} bg-card`}>Remove</button>}
            </div>
          </>
        )}
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
        {err && <p className="text-sm font-bold text-destructive">{err}</p>}
      </div>
    </div>
  );
}
