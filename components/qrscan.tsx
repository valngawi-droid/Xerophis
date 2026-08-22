"use client";

import { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { api, ApiError } from "./lib";
import { useApp } from "./AppState";
import { Screen, IconButton } from "./ui";
import { ChevronRightIcon as BackIcon } from "./icons";

/**
 * Scan a Xerophis pairing QR with the device camera, then confirm the link
 * (equivalent to typing the 8-digit code). Falls back gracefully if the camera
 * is unavailable or permission is denied.
 */
export function QrScanScreen({ onBack, onLinked }: { onBack: () => void; onLinked: (device: string) => void }) {
  const { toast } = useApp();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const [cam, setCam] = useState<"idle" | "starting" | "on" | "error">("idle");
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      setCam("starting");
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" }, audio: false });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute("playsinline", "true");
          await videoRef.current.play();
        }
        setCam("on");
        loop();
      } catch (e: any) {
        setCam("error");
        setErr(e?.name === "NotAllowedError" ? "Izin kamera ditolak." : "Kamera tidak tersedia di perangkat ini.");
      }
    }
    function loop() {
      const video = videoRef.current, canvas = canvasRef.current;
      if (video && canvas && scanning) {
        if (video.readyState === video.HAVE_ENOUGH_DATA) {
          const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(img.data, img.width, img.height, { inversionAttempts: "dontInvert" });
          if (code?.data) {
            setScanning(false);
            confirmScan(code.data);
            return;
          }
        }
      }
      rafRef.current = requestAnimationFrame(loop);
    }
    start();
    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  async function confirmScan(tok: string) {
    try {
      const d = await api.post<{ device: string }>("/api/link/confirm", { token: tok });
      toast(`Perangkat "${d.device}" tertaut`, "success");
      onLinked(d.device);
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "QR tidak valid", "error");
      setScanning(true);
      loopAgain();
    }
  }
  function loopAgain() {
    rafRef.current = requestAnimationFrame(() => {
      // re-prime scanning flag to restart loop
      setScanning((s) => !s); // toggles back; useEffect restarts if scanning true
    });
  }

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-x-bg/90 px-2 py-2.5 backdrop-blur">
        <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>
        <span className="flex-1 text-[17px] font-semibold text-x-text">Scan QR</span>
      </header>

      <div className="relative flex-1 overflow-hidden bg-black">
        <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" muted playsInline />
        <canvas ref={canvasRef} className="hidden" />
        {/* scan frame */}
        {cam === "on" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-64 w-64">
              <div className="absolute inset-0 rounded-2xl border-2 border-x-red/90" />
              <div className="absolute left-1/2 top-1/2 h-0.5 w-44 -translate-x-1/2 -translate-y-1/2 animate-pulse bg-x-red/80" />
            </div>
          </div>
        )}
        {cam === "starting" && <div className="absolute inset-0 flex items-center justify-center text-[14px] text-x-muted">Mengaktifkan kamera…</div>}
        {cam === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-x-red-soft text-x-red">!</div>
            <div className="text-[16px] font-semibold text-x-text">Kamera tidak dapat diakses</div>
            <div className="max-w-[280px] text-[13px] text-x-muted">{err || "Pastikan izin kamera diberikan."}</div>
            <button onClick={onBack} className="rounded-full bg-x-red px-6 py-2.5 text-[14px] font-semibold text-white">Kembali</button>
          </div>
        )}
      </div>

      <div className="bg-x-bg px-4 py-4 text-center text-[12.5px] text-x-muted">
        Arahkan kamera ke <span className="text-x-text">QR</span> yang muncul di perangkat yang ingin ditautkan.
      </div>
    </Screen>
  );
}
