"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError } from "./lib";
import { useApp } from "./AppState";
import { Screen, IconButton, Avatar, Skeleton } from "./ui";
import { ChevronRightIcon as BackIcon, UploadIcon, CheckIcon, PaletteIcon } from "./icons";

type Gal = { id: string; src: string; label: string };

/**
 * Custom 3D avatar picker (WhatsApp-style). Choose from a premium gallery or
 * upload your own. Saves via PATCH /api/me (avatarUrl).
 */
export function AvatarScreen({ onBack, onBuilder }: { onBack: () => void; onBuilder?: () => void }) {
  const { me, updateProfile, toast } = useApp();
  const [gallery, setGallery] = useState<Gal[]>([]);
  const [current, setCurrent] = useState<string>(me?.avatar ?? "");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    api.get<{ avatars: Gal[]; current: string }>("/api/avatars")
      .then((d) => { setGallery(d.avatars); setCurrent(d.current || me?.avatar || ""); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [me?.avatar]);

  useEffect(load, [load]);

  async function choose(src: string) {
    setCurrent(src);
    setBusy(true);
    try {
      await updateProfile({ avatarUrl: src });
      toast("Avatar diperbarui", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Gagal menyimpan avatar", "error");
      setCurrent(me?.avatar ?? "");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(f: File | null) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { toast("Format harus JPG/PNG/WebP", "error"); return; }
    if (f.size > 6 * 1024 * 1024) { toast("Ukuran maksimal 6MB", "error"); return; }
    setBusy(true);
    const form = new FormData();
    form.append("file", f);
    try {
      const up = await api.post<{ url: string }>("/api/upload", form, true);
      await updateProfile({ avatarUrl: up.url });
      setCurrent(up.url);
      toast("Foto profil diunggah", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Gagal mengunggah", "error");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <Screen>
      <header className="sticky top-0 z-30 flex items-center gap-2 bg-x-bg/90 px-2 py-2.5 backdrop-blur">
        <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>
        <span className="text-[17px] font-semibold text-x-text">Avatar</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 py-6">
          <Avatar text="X" color={current || "#FF1111"} size={120} ring />
          <div className="text-[15px] font-semibold text-x-text">{me?.displayName}</div>
          {onBuilder && (
            <button onClick={onBuilder} className="flex items-center gap-2 rounded-full bg-x-red px-4 py-2 text-[13px] font-semibold text-white active:bg-x-red-dark">
              <PaletteIcon size={16} /> Buat Avatar 3D
            </button>
          )}
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 rounded-full bg-x-surface2 px-4 py-2 text-[13px] font-medium text-x-text active:bg-x-surface3">
            <UploadIcon size={16} /> Unggah foto sendiri
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0] ?? null)} />
        </div>

        <div className="px-4 pb-1 text-[13px] font-medium text-x-muted">Pilih avatar 3D</div>
        {loading ? (
          <div className="grid grid-cols-3 gap-3 px-4 py-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="aspect-square w-full rounded-2xl" />)}</div>
        ) : (
          <div className="grid grid-cols-3 gap-3 px-4 py-3">
            {gallery.map((g) => {
              const selected = current === g.src;
              return (
                <button key={g.id} onClick={() => choose(g.src)} className={`relative aspect-square overflow-hidden rounded-2xl ring-2 transition-all ${selected ? "ring-x-red scale-[1.02]" : "ring-x-line2 hover:ring-x-muted2"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.src} alt={g.label} className="h-full w-full object-cover" />
                  {selected && <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-x-red text-white"><CheckIcon size={14} /></span>}
                </button>
              );
            })}
          </div>
        )}
        <div className="px-4 py-3 text-[11.5px] leading-relaxed text-x-muted2">
          Avatar ini terlihat oleh kontak sesuai pengaturan privasi Anda.
        </div>
      </div>
    </Screen>
  );
}
