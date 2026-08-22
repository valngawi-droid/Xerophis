"use client";

import { useEffect, useState } from "react";
import { api } from "./lib";
import { useApp } from "./AppState";
import { Avatar, IconButton, EmptyState, Skeleton } from "./ui";
import { MoreIcon, PlusIcon, CommunitiesIcon } from "./icons";

type Com = { id: string; name: string; description: string; avatar: string; memberCount: number; joined: boolean };

export function CommunitiesTab() {
  const { toast } = useApp();
  const [communities, setCommunities] = useState<Com[]>([]);
  const [loading, setLoading] = useState(true);
  const [create, setCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", description: "" });

  function load() {
    setLoading(true);
    api.get<{ communities: Com[] }>("/api/communities").then((d) => setCommunities(d.communities)).catch(() => {}).finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function toggleJoin(c: Com) {
    try { await api.post(`/api/communities/${c.id}/members`, { action: c.joined ? "leave" : "join" }); toast(c.joined ? "Keluar komunitas" : "Bergabung", "success"); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
  }
  async function createCommunity() {
    if (!draft.name.trim()) return;
    try { await api.post("/api/communities", draft); toast("Komunitas dibuat", "success"); setCreate(false); setDraft({ name: "", description: "" }); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
  }

  if (loading) return <div className="flex h-full flex-col"><Header /><div className="p-3"><Skeleton className="h-20 w-full"/></div></div>;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-24">
        <button onClick={() => setCreate(true)} className="flex w-full items-center gap-3 px-4 py-3 text-x-red hover:bg-x-bg2"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-x-red-soft"><PlusIcon size={20} /></span><span className="text-[15px] font-medium">Buat komunitas</span></button>
        <p className="px-4 py-2 text-[13px] leading-relaxed text-x-muted">Komunitas menghubungkan grup-grup terkait menjadi satu tempat.</p>
        {communities.length === 0 && <EmptyState icon={<CommunitiesIcon size={26} />} title="Belum ada community" sub="Buat komunitas pertama Anda." />}
        {communities.map((c) => (
          <div key={c.id} className="flex items-center gap-3 px-4 py-3">
            <Avatar text={c.avatar[0] ?? "X"} color="#FF1111" size={52} />
            <span className="flex flex-1 flex-col"><span className="text-[15px] font-semibold text-x-text">{c.name}</span><span className="truncate text-[12.5px] text-x-muted">{c.description}</span><span className="text-[11.5px] text-x-muted2">{c.memberCount.toLocaleString("id")} anggota</span></span>
            <button onClick={() => toggleJoin(c)} className={`rounded-full px-3 py-1 text-[12px] font-medium ${c.joined ? "bg-x-surface2 text-x-muted" : "bg-x-red text-white"}`}>{c.joined ? "Bergabung" : "Gabung"}</button>
          </div>
        ))}
      </div>

      {create && (
        <div className="absolute inset-0 z-50 flex flex-col bg-x-bg">
          <div className="flex items-center gap-3 px-3 py-2.5"><IconButton aria-label="Tutup" onClick={() => setCreate(false)}><span className="text-x-text">✕</span></IconButton><span className="text-[17px] font-semibold text-x-text">Buat komunitas</span></div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="Nama komunitas" className="rounded-xl bg-x-input px-4 py-3 text-[15px] text-x-text outline-none ring-1 ring-x-line focus:ring-x-red" />
            <textarea value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Deskripsi" className="flex-1 resize-none rounded-xl bg-x-input p-4 text-[15px] text-x-text outline-none ring-1 ring-x-line" />
            <button onClick={createCommunity} disabled={!draft.name.trim()} className="rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white disabled:opacity-50">Buat</button>
          </div>
        </div>
      )}
    </div>
  );
}

function Header() { return <header className="flex items-center gap-2 bg-x-bg/90 px-3 py-2.5 backdrop-blur"><h1 className="flex-1 text-[22px] font-bold text-x-text">Komunitas</h1><IconButton aria-label="Menu"><MoreIcon size={22} /></IconButton></header>; }
