"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./lib";
import { useApp } from "./AppState";
import { Screen, IconButton, SettingRow, GroupHeader, EmptyState } from "./ui";
import { ChevronRightIcon as BackIcon, LinkDeviceIcon, LogoutIcon, QrIcon } from "./icons";

type Device = { id: string; device: string; browser: string; location: string; lastActive: number; createdAt: number };

export function DevicesScreen({ onBack, onScan }: { onBack: () => void; onScan?: () => void }) {
  const { toast } = useApp();
  const [devices, setDevices] = useState<Device[]>([]);
  const [linking, setLinking] = useState(false);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api.get<{ devices: Device[] }>("/api/devices").then((d) => setDevices(d.devices)).catch(() => {});
  }, []);
  useEffect(load, [load]);

  async function confirmCode() {
    if (code.trim().length < 8) { toast("Masukkan kode 8 digit", "info"); return; }
    setBusy(true);
    try {
      const d = await api.post<{ device: string }>("/api/link/confirm", { code });
      toast(`Perangkat "${d.device}" tertaut`, "success");
      setCode("");
      setLinking(false);
      load();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Kode tidak valid", "error");
    } finally {
      setBusy(false);
    }
  }

  async function removeDevice(id: string) {
    try { await api.del("/api/devices", { deviceId: id }); toast("Perangkat dikeluarkan", "success"); load(); } catch (e) { toast(e instanceof ApiError ? e.message : "Gagal", "error"); }
  }

  return (
    <Screen>
      <header className="flex items-center gap-2 bg-x-bg/90 px-2 py-2.5 backdrop-blur sticky top-0 z-30">
        <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>
        <span className="text-[17px] font-semibold text-x-text">Perangkat Tertaut</span>
      </header>
      <div className="flex-1 overflow-y-auto">
        <p className="px-4 pt-3 pb-2 text-[13px] leading-relaxed text-x-muted">
          Perangkat tertaut membaca pesan secara realtime di perangkat ini. Untuk masuk di perangkat baru, buka Xerophis di sana lalu tautkan dengan kode berikut.
        </p>

        <button
          onClick={() => setLinking((v) => !v)}
          className="flex w-full items-center gap-3 px-4 py-3 text-x-red active:bg-x-surface2"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-x-red-soft"><QrIcon size={20} /></span>
          <span className="flex flex-1 flex-col text-left">
            <span className="text-[15px] font-medium">Tautkan perangkat</span>
            <span className="text-[12.5px] text-x-muted">Masukkan kode atau scan QR dari perangkat baru</span>
          </span>
        </button>

        {onScan && (
          <button onClick={onScan} className="mx-4 mb-2 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full bg-x-surface2 py-2.5 text-[14px] font-medium text-x-text active:bg-x-surface3">
            <QrIcon size={19} /> Scan QR dengan kamera
          </button>
        )}

        {linking && (
          <div className="mx-4 mb-3 rounded-2xl bg-x-surface2 p-4 ring-1 ring-x-line animate-fade-in">
            <div className="text-[15px] font-semibold text-x-text">Masukkan kode 8 digit</div>
            <div className="mt-3 flex gap-2">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^0-9A-Z]/g, "").slice(0, 8))}
                placeholder="ABC 123 DEF 456"
                className="min-w-0 flex-1 rounded-xl bg-x-input px-4 py-3 text-[18px] font-bold tracking-widest text-x-text outline-none ring-1 ring-x-line placeholder:text-[13px] placeholder:font-normal placeholder:tracking-normal placeholder:text-x-muted2 focus:ring-x-red"
              />
              <button onClick={confirmCode} disabled={busy} className="rounded-xl bg-x-red px-5 text-[14px] font-semibold text-white active:bg-x-red-dark disabled:opacity-50">
                {busy ? "…" : "Tautkan"}
              </button>
            </div>
          </div>
        )}

        <GroupHeader>Perangkat ini</GroupHeader>
        {devices.length === 0 && <EmptyState icon={<LinkDeviceIcon size={26} />} title="Belum ada perangkat tertaut" sub="Tautkan HP atau komputer Anda." />}
        {devices.map((d) => (
          <div key={d.id} className="flex items-center gap-3 px-4 py-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-x-surface2 text-x-muted"><LinkDeviceIcon size={20} /></span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="flex items-center gap-1 truncate text-[15px] text-x-text">
                {d.browser === "Linked" ? "Perangkat tertaut" : `${d.device}`}
                <span className="text-[11px] text-x-green">●</span>
              </span>
              <span className="truncate text-[12px] text-x-muted">{d.location || ""} · aktif {new Date(d.lastActive).toLocaleDateString("id-ID")}</span>
            </span>
            <button onClick={() => removeDevice(d.id)} aria-label="Keluar dari perangkat" className="flex h-9 w-9 items-center justify-center rounded-full text-x-muted hover:bg-x-surface2 hover:text-x-red">
              <LogoutIcon size={18} />
            </button>
          </div>
        ))}
      </div>
    </Screen>
  );
}
