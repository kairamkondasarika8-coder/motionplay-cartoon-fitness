import { useEffect, useRef, useState } from "react";
import type { Landmark } from "@/lib/game/exercises";

const WASM = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@1.0.1/wasm";
const MODEL =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

export type PoseStatus = "loading" | "ready" | "camera-error" | "model-error";

/** Webcam + MediaPipe pose landmarker. Landmarks are written to a ref every frame (no re-render). */
export function usePose() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarksRef = useRef<Landmark[] | undefined>(undefined);
  const [status, setStatus] = useState<PoseStatus>("loading");

  useEffect(() => {
    let stopped = false;
    let raf = 0;
    let stream: MediaStream | null = null;
    let landmarker: { detectForVideo: (v: HTMLVideoElement, t: number) => { landmarks: Landmark[][] }; close: () => void } | null = null;

    (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: "user" }, audio: false });
      } catch {
        if (!stopped) setStatus("camera-error");
        return;
      }
      const video = videoRef.current;
      if (!video || stopped) return;
      video.srcObject = stream;
      await video.play().catch(() => {});

      try {
        const { FilesetResolver, PoseLandmarker, DrawingUtils } = await import("@mediapipe/tasks-vision");
        const fileset = await FilesetResolver.forVisionTasks(WASM);
        const lm = await PoseLandmarker.createFromOptions(fileset, {
          baseOptions: { modelAssetPath: MODEL, delegate: "GPU" },
          runningMode: "VIDEO",
          numPoses: 1,
        });
        if (stopped) { lm.close(); return; }
        landmarker = lm as unknown as typeof landmarker;
        setStatus("ready");
        const canvas = canvasRef.current!;
        const ctx = canvas.getContext("2d")!;
        const draw = new DrawingUtils(ctx);
        let last = -1;
        const loop = () => {
          if (stopped) return;
          if (video.readyState >= 2 && video.currentTime !== last) {
            last = video.currentTime;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const res = lm.detectForVideo(video, performance.now());
            const pose = res.landmarks[0];
            landmarksRef.current = pose;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            if (pose) {
              draw.drawConnectors(pose, PoseLandmarker.POSE_CONNECTIONS, { color: "#22d3ee", lineWidth: 5 });
              draw.drawLandmarks(pose, { color: "#facc15", fillColor: "#f97316", radius: 4 });
            }
          }
          raf = requestAnimationFrame(loop);
        };
        loop();
      } catch (e) {
        console.error(e);
        if (!stopped) setStatus("model-error");
      }
    })();

    return () => {
      stopped = true;
      cancelAnimationFrame(raf);
      landmarker?.close();
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  return { videoRef, canvasRef, landmarksRef, status };
}
