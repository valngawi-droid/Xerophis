"use client";

import { useEffect, useRef, useState } from "react";
import { api, ApiError } from "./lib";
import { useApp } from "./AppState";
import { Avatar, IconButton, EmptyState, Skeleton } from "./ui";
import { CameraIcon, MoreIcon, PlusIcon, XLogo, BellIcon, ImageIcon } from "./icons";

type Row = { id: string; name: string; avatar: string; content: string; mediaUrl?: string | null; mine: boolean; createdAt: number; viewers: number };
type Chan = { id: string; name: string; avatar: string; subscriberCount: number; subscribed: boolean };

export function UpdatesTab() {
  const { me, toast } = useApp();
  const [statuses, setStatuses] = useState<Row[]>([]);
  const [channels, setChannels] = useState<Chan[]>([]);
  const [loading, setLoading] = useState(true);
  const [composer, setComposer] = useState(false);
  const [draft, setDraft] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  function load() {
    setLoading(true);
    Promise.all([api.get<{ statuses: Row[] }>("/api/status"), api.get<{ channels: Chan[] }>("/api/channels")])
      .then(([s, c]) => { setStatuses(s.statuses); setChannels(c.channels); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function publish() {
    if (!draft.trim()) return;
    try { await api.post("/api/status", { content: draft }); toast("Status dipublikasikan", "success"); setDraft(""); setComposer(false); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
  }
  async function publishPhoto(f: File | null) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { toast("Format harus JPG/PNG/WebP", "error"); return; }
    const form = new FormData();
    form.append("file", f);
    try {
      const up = await api.post<{ url: string }>("/api/upload", form, true);
      await api.post("/api/status", { mediaUrl: up.url });
      toast("Foto status dipublikasikan", "success");
      setComposer(false); setDraft(""); load();
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: any) { toast(e instanceof ApiError ? e.message : "Gagal", "error"); }
  }
  async function toggleSubscribe(ch: Chan) {
    try { await api.post(`/api/channels/${ch.id}/subscribe`, { action: ch.subscribed ? "unsubscribe" : "subscribe" }); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
  }

  if (loading) return <div className="flex h-full flex-col"><Header /><div className="p-3"><Skeleton className="h-16 w-full mb-3"/><Skeleton className="h-12 w-full"/></div></div>;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-24">
        <button onClick={() => setComposer(true)} className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-x-bg2">
          <span className="relative">
            <span className="block h-12 w-12 overflow-hidden rounded-full ring-2 ring-x-red"><Avatar text={me?.displayName[0] ?? "X"} color="#FF1111" size={48} /></span>
            <span className="absolute -right-0.5 -bottom-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-x-red text-white ring-2 ring-x-bg"><PlusIcon size={13} /></span>
          </span>
          <span className="flex flex-col"><span className="text-[15px] font-medium text-x-text">Status saya</span><span className="text-[13px] text-x-muted">Ketuk untuk membuat update</span></span>
        </button>

        <div className="px-4 pb-1 pt-2 text-[13px] font-medium text-x-muted">Pembaruan terbaru</div>
        {statuses.filter((s) => !s.mine).length === 0 && <EmptyState icon={<XLogo size={26} />} title="Belum ada update" sub="Tambahkan yang pertama." />}
        {statuses.filter((s) => !s.mine).map((s) => (
          <div key={s.id} className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-x-bg2">
            <span className="overflow-hidden rounded-full p-[2px] ring-2 ring-x-surface3"><Avatar text={s.avatar[0] ?? "X"} color={s.avatar === "#FF1111" ? "#FF1111" : s.avatar} size={46} /></span>
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] font-medium text-x-text">{s.name}</span>
              <span className="flex items-center gap-1.5 truncate text-[12.5px] text-x-muted">
                {s.mediaUrl && <span className="inline-block h-3 w-3 shrink-0 rounded-sm bg-cover" style={{ backgroundImage: `url(${s.mediaUrl})` }} />}
                <span className="truncate">{s.content || "Foto"}</span>
              </span>
            </span>
            <span className="text-[11.5px] text-x-muted2">{s.viewers} lihat</span>
          </div>
        ))}

        <div className="mt-3 px-4 pb-1 text-[13px] font-medium text-x-muted">Saluran</div>
        {channels.length === 0 && <EmptyState icon={<BellIcon size={26} />} title="Belum ada channel" sub="Ikuti channel untuk pembaruan." />}
        {channels.map((ch) => (
          <button key={ch.id} onClick={() => toggleSubscribe(ch)} className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-x-bg2">
            <Avatar text={ch.avatar[0] ?? "X"} color="#FF1111" size={48} verified />
            <span className="flex flex-1 flex-col"><span className="text-[15px] font-medium text-x-text">{ch.name}</span><span className="text-[12.5px] text-x-muted">{ch.subscriberCount.toLocaleString("id")} subscriber</span></span>
            <span className={`rounded-full px-3 py-1 text-[12px] font-medium ${ch.subscribed ? "bg-x-surface2 text-x-muted" : "bg-x-red text-white"}`}>{ch.subscribed ? "Mengikuti" : "Ikuti"}</span>
          </button>
        ))}
      </div>

      {composer && (
        <div className="absolute inset-0 z-50 flex flex-col bg-x-bg">
          <div className="flex items-center gap-3 px-3 py-2.5"><IconButton aria-label="Tutup" onClick={() => setComposer(false)}><span className="text-x-text">✕</span></IconButton><span className="text-[17px] font-semibold text-x-text">Update status</span><span className="flex-1" /><IconButton aria-label="Foto" onClick={() => fileRef.current?.click()}><ImageIcon size={21} /></IconButton></div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <textarea autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Ketik status…" className="flex-1 resize-none rounded-xl bg-x-input p-4 text-[16px] text-x-text outline-none ring-1 ring-x-line placeholder:text-x-muted" />
            <button onClick={publish} disabled={!draft.trim()} className="rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white disabled:opacity-50">Publikasikan</button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => publishPhoto(e.target.files?.[0] ?? null)} />
        </div>
      )}
    </div>
  );
}

function Header() {
  return <header className="flex items-center gap-2 bg-x-bg/90 px-3 py-2.5 backdrop-blur"><h1 className="flex-1 text-[22px] font-bold text-x-text">Updates</h1><IconButton aria-label="Kamera"><CameraIcon size={22} /></IconButton><IconButton aria-label="Menu"><MoreIcon size={22} /></IconButton></header>;
}
