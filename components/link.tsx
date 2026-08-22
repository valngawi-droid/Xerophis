"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { api, ApiError } from "./lib";
import { XerophisLogo, IconButton } from "./ui";
import { BackIcon, RefreshIcon } from "./icons";

type State = "start" | "waiting" | "expired" | "done" | "error";

/**
 * Link a device (WhatsApp-style "Linked devices").
 *
 * This screen is opened on the NEW device that is NOT yet logged in. It
 * requests a pairing code, shows it, and waits for the user to confirm it on
 * their phone/main account. Once confirmed, the new device adopts the issued
 * session and enters the app.
 */
export function LinkScreen({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const [state, setState] = useState<State>("start");
  const [label, setLabel] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(0);
  const timer = useRef<any>(null);

  async function start() {
    setState("waiting");
    setError("");
    try {
      const d = await api.post<{ token: string; code: string; label: string; expiry: number; qr: string }>("/api/link/init", {});
      setToken(d.token);
      setCode(d.code);
      setQr(d.qr);
      setLabel(d.label);
      setCountdown(Math.max(0, Math.ceil((d.expiry - Date.now()) / 1000)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Gagal memulai pairing.");
      setState("error");
    }
  }

  // poll status while waiting
  useEffect(() => {
    if (state !== "waiting" || !token) return;
    const poll = async () => {
      try {
        const d = await api.get<{ status: string; sessionToken?: string; hasSession?: boolean }>(`/api/link/status?token=${encodeURIComponent(token)}`);
        if (d.status === "confirmed" && d.sessionToken) {
          const adopt = await api.post("/api/link/adopt", { sessionToken: d.sessionToken }).catch(() => null);
          if (adopt) {
            setState("done");
          } else {
            setState("expired");
          }
        } else if (d.status === "expired") {
          setState("expired");
        }
      } catch {
        /* transient network */
      }
    };
    poll();
    const iv = setInterval(poll, 2000);
    timer.current = iv;
    return () => clearInterval(iv);
  }, [state, token]);

  // decreasing countdown
  useEffect(() => {
    if (state !== "waiting") return;
    const iv = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(iv);
  }, [state]);

  useEffect(() => {
    if (state === "done") {
      const t = setTimeout(onDone, 1200);
      return () => clearTimeout(t);
    }
  }, [state, onDone]);

  if (state === "done") {
    return (
      <Center>
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-x-green/20 text-x-green">✓</div>
        <h1 className="mt-4 text-[20px] font-bold text-x-text">Perangkat tertaut</h1>
        <p className="mt-1 text-[13px] text-x-muted">Mengalihkan ke Xerophis…</p>
      </Center>
    );
  }

  return (
    <div className="flex h-full flex-col bg-x-bg">
      <header className="flex items-center gap-3 px-3 py-2.5">
        <IconButton aria-label="Batal" onClick={onCancel}><BackIcon size={22} /></IconButton>
        <span className="text-[17px] font-semibold text-x-text">Tautkan perangkat</span>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <XerophisLogo size={72} showText={false} />
        <h1 className="mt-5 text-[22px] font-bold text-x-text">Link dengan nomor</h1>

        {state === "start" && (
          <>
            <p className="mt-2 max-w-[300px] text-[14px] leading-relaxed text-x-muted">
              Untuk menggunakan Xerophis di perangkat ini, tautkan ke akun Anda. Anda akan melihat kode yang harus dimasukkan di HP.
            </p>
            <button onClick={start} className="mt-6 rounded-full bg-x-red px-8 py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark">
              Mulai penautan
            </button>
          </>
        )}

        {state === "waiting" && (
          <>
            <p className="mt-3 text-[14px] text-x-muted">Di HP Anda, buka <span className="text-x-text">Xerophis → Perangkat Tertaut → Scan QR</span>, lalu arahkan ke kode ini:</p>
            {qr && (
              <div className="mt-4 rounded-2xl bg-white p-3 shadow-lg ring-1 ring-x-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={qr} alt="QR pairing" width={224} height={224} className="mx-auto h-56 w-56 object-contain" />
              </div>
            )}
            <p className="mt-4 text-[13px] text-x-muted">atau masukkan kode berikut secara manual</p>
            <div className="mt-2 rounded-3xl bg-x-surface2 px-6 py-4 ring-1 ring-x-line">
              <div className="text-[30px] font-bold tracking-[0.18em] text-x-text tabular-nums">
                {code ? code.slice(0, 4) : "····"} <span className="text-x-red">{code ? code.slice(4) : "····"}</span>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-[12px] text-x-muted2">
              <span className="h-1.5 w-1.5 rounded-full bg-x-red animate-pulse" />
              Menunggu konfirmasi di perangkat utama… {countdown > 0 && `(${Math.floor(countdown / 60)}:${String(countdown % 60).padStart(2, "0")})`}
            </div>
            <button onClick={() => setState("start")} className="mt-6 text-[13px] font-medium text-x-muted underline">Batalkan</button>
          </>
        )}

        {state === "expired" && (
          <>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-x-red-soft text-x-red">!</div>
            <p className="mt-3 text-[15px] font-semibold text-x-text">Kode kedaluwarsa</p>
            <p className="mt-1 text-[13px] text-x-muted">Kode ini sudah tidak berlaku. Buat kode baru untuk melanjutkan.</p>
            <button onClick={start} className="mt-5 rounded-full bg-x-red px-7 py-3 text-[14px] font-semibold text-white active:bg-x-red-dark">Buat kode baru</button>
          </>
        )}

        {state === "error" && (
          <>
            <div className="mt-4 flex h-14 w-14 items-center justify-center rounded-full bg-x-red-soft text-x-red">!</div>
            <p className="mt-3 text-[15px] font-semibold text-x-text">Terjadi kesalahan</p>
            <p className="mt-1 max-w-[280px] text-[13px] text-x-muted">{error}</p>
            <button onClick={start} className="mt-5 rounded-full bg-x-red px-7 py-3 text-[14px] font-semibold text-white active:bg-x-red-dark"><span className="inline-flex items-center gap-1.5"><RefreshIcon size={16} /> Coba Lagi</span></button>
          </>
        )}
      </div>
    </div>
  );
}

function Center({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col items-center justify-center bg-x-bg px-6 text-center">{children}</div>;
}
