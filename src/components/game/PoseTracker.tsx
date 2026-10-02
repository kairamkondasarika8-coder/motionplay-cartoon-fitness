import { useEffect, useRef, useState } from "react";
import { features, type Kp, type P } from "@/lib/game/poses";

const IDX: Record<keyof Kp, number> = { ls: 11, rs: 12, le: 13, re: 14, lw: 15, rw: 16, lh: 23, rh: 24, lk: 25, rk: 26, la: 27, ra: 28 };
const LINES = [[11, 12], [11, 13], [13, 15], [12, 14], [14, 16], [11, 23], [12, 24], [23, 24], [23, 25], [25, 27], [24, 26], [26, 28]];

export function PoseTracker({ onFeatures, children }: { onFeatures: (f: number[] | null) => void; children?: React.ReactNode }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cb = useRef(onFeatures);
  cb.current = onFeatures;
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [err, setErr] = useState("");

  useEffect(() => {
    let stopped = false; let raf = 0; let stream: MediaStream | null = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let lm: any = null;
    (async () => {
      try {
        const vision = await import("@mediapipe/tasks-vision");
        const fs = await vision.FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm");
        lm = await vision.PoseLandmarker.createFromOptions(fs, {
          baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task", delegate: "GPU" },
          runningMode: "VIDEO", numPoses: 1,
        });
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" } });
        if (stopped) return;
        const v = videoRef.current!;
        v.srcObject = stream; await v.play();
        setStatus("ready");
        let last = -1;
        const loop = () => {
          if (stopped) return;
          raf = requestAnimationFrame(loop);
          if (v.readyState < 2 || v.currentTime === last) return;
          last = v.currentTime;
          const res = lm.detectForVideo(v, performance.now());
          const pts = res.landmarks?.[0];
          const c = canvasRef.current!; const ctx = c.getContext("2d")!;
          c.width = v.videoWidth; c.height = v.videoHeight;
          ctx.clearRect(0, 0, c.width, c.height);
          if (!pts) { cb.current(null); return; }
          const color = getComputedStyle(c).color;
          ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 6; ctx.lineCap = "round";
          for (const [a, b] of LINES as [number, number][]) {
            ctx.beginPath(); ctx.moveTo(pts[a].x * c.width, pts[a].y * c.height); ctx.lineTo(pts[b].x * c.width, pts[b].y * c.height); ctx.stroke();
          }
          for (const i of Object.values(IDX)) { ctx.beginPath(); ctx.arc(pts[i].x * c.width, pts[i].y * c.height, 7, 0, Math.PI * 2); ctx.fill(); }
          const vis = Object.values(IDX).filter((i) => (pts[i].visibility ?? 1) > 0.4).length;
          if (vis < 9) { cb.current(null); return; }
          const aspect = c.width / c.height;
          const kp = {} as Kp;
          (Object.keys(IDX) as (keyof Kp)[]).forEach((k) => { const p = pts[IDX[k]]; kp[k] = [p.x * aspect, p.y] as P; });
          cb.current(features(kp));
        };
        loop();
      } catch (e) {
        setStatus("error");
        setErr(e instanceof Error ? e.message : "Camera unavailable");
      }
    })();
    return () => { stopped = true; cancelAnimationFrame(raf); stream?.getTracks().forEach((t) => t.stop()); lm?.close?.(); };
  }, []);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl border-4 border-foreground bg-foreground">
      <video ref={videoRef} playsInline muted className="absolute inset-0 h-full w-full -scale-x-100 object-cover" />
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full -scale-x-100 object-cover text-secondary" />
      {children}
      {status !== "ready" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-foreground/80 p-6 text-center text-background">
          {status === "loading" ? (
            <p className="font-display text-xl">Starting camera & pose tracker…</p>
          ) : (
            <>
              <p className="font-display text-xl">Camera couldn't start</p>
              <p className="text-sm opacity-80">{err}. Please allow camera access and reload.</p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
