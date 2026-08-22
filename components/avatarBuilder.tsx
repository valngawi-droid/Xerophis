"use client";

import { useRef, useState } from "react";
import { api, ApiError } from "./lib";
import { useApp } from "./AppState";
import { Screen, IconButton, Skeleton } from "./ui";
import { ChevronRightIcon as BackIcon, CheckIcon, RefreshIcon, UploadIcon } from "./icons";
import { PARTS, defaultConfig, renderAvatarDataUrl, type AvatarConfig, type PartDef, type PartKind } from "./avatarParts";

type Tab = PartKind;

const tabs: { key: Tab; label: string }[] = [
  { key: "body", label: "Karakter" },
  { key: "top", label: "Baju" },
  { key: "bottom", label: "Celana" },
  { key: "accessory", label: "Aksesoris" },
];

export function AvatarBuilderScreen({ onBack }: { onBack: () => void }) {
  const { me, updateProfile, toast } = useApp();
  const [cfg, setCfg] = useState<AvatarConfig>(defaultConfig());
  const [tab, setTab] = useState<Tab>("body");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  function pick(id: string, kind: PartKind) {
    setCfg((c) => ({ ...c, [kind]: id }));
  }

  // Render & save the composed avatar, then upload + attach to profile.
  async function save() {
    setBusy(true);
    try {
      const dataUrl = await renderAvatarDataUrl(cfg, 300);
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "avatar.png", { type: "image/png" });
      const form = new FormData();
      form.append("file", file);
      const up = await api.post<{ url: string }>("/api/upload", form, true);
      await updateProfile({ avatarUrl: up.url });
      toast("Avatar berhasil disimpan", "success");
      onBack();
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Gagal menyimpan avatar", "error");
    } finally {
      setBusy(false);
    }
  }

  const byKind = (k: PartKind) => PARTS.filter((p) => p.kind === k);

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-x-bg/90 px-2 py-2.5 backdrop-blur">
        <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>
        <span className="flex-1 text-[17px] font-semibold text-x-text">Buat Avatar</span>
        <button onClick={save} disabled={busy} className="flex items-center gap-1.5 rounded-full bg-x-red px-4 py-2 text-[13px] font-semibold text-white disabled:opacity-50">
          {busy ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <CheckIcon size={15} />} Simpan
        </button>
      </header>

      <div className="flex-1 overflow-y-auto pb-4">
        {/* Preview */}
        <div className="flex justify-center px-4 pt-3">
          <div className="relative w-full max-w-[300px] overflow-hidden rounded-3xl ring-1 ring-x-line2" style={{ aspectRatio: "300/525", background: "radial-gradient(70% 60% at 50% 0%, #16181a, #050707)" }}>
            <Layer id={cfg.body} />
            <Layer id={cfg.accessory} />
            <Layer id={cfg.top} />
            <Layer id={cfg.bottom} />
          </div>
        </div>

        {/* Tabs */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto px-4">
          {tabs.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium ${tab === t.key ? "bg-x-red text-white" : "bg-x-surface2 text-x-muted"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Parts grid */}
        {byKind(tab).length === 0 && (
          <div className="px-4 py-6 text-center text-[13px] text-x-muted">Opsi untuk kategori ini sedang disiapkan…</div>
        )}
        <div className="grid grid-cols-3 gap-3 px-4 py-3">
          {byKind(tab).map((p: PartDef) => {
            const selected = cfg[tab] === p.id;
            return (
              <button key={p.id} onClick={() => pick(p.id, tab)} className={`relative aspect-square overflow-hidden rounded-2xl bg-x-surface2 ring-2 transition-all ${selected ? "ring-x-red scale-[1.02]" : "ring-x-line2 hover:ring-x-muted2"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.src} alt={p.label} className="h-full w-full object-cover p-1" />
                <span className="absolute inset-x-0 bottom-0 bg-black/60 px-1 py-1 text-center text-[11px] font-medium text-x-text">{p.label}</span>
                {selected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-x-red text-white"><CheckIcon size={14} /></span>}
              </button>
            );
          })}
        </div>

        <button onClick={() => fileRef.current?.click()} className="mx-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full bg-x-surface2 py-3 text-[14px] font-medium text-x-text active:bg-x-surface3">
          <UploadIcon size={17} /> Unggah foto sendiri
        </button>
        <button onClick={() => setCfg(defaultConfig())} className="mx-4 mt-2 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full border border-x-line2 py-3 text-[14px] font-medium text-x-muted active:bg-x-surface2">
          <RefreshIcon size={16} /> Setel ulang
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const form = new FormData(); form.append("file", f);
          try { const up = await api.post<{ url: string }>("/api/upload", form, true); await updateProfile({ avatarUrl: up.url }); toast("Foto profil diunggah", "success"); onBack(); }
          catch (e) { toast(e instanceof ApiError ? e.message : "Gagal mengunggah", "error"); }
        }} />
      </div>
    </Screen>
  );
}

function Layer({ id }: { id: string }) {
  const p = PARTS.find((x) => x.id === id);
  if (!p) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={p.src}
      alt=""
      className="absolute object-contain"
      style={{
        left: `${p.x ?? 9}%`,
        top: p.top ?? "0%",
        width: `${p.w ?? 82}%`,
        mixBlendMode: "normal",
        pointerEvents: "none",
      }}
    />
  );
}
