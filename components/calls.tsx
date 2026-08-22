"use client";

import { useEffect, useState } from "react";
import { api } from "./lib";
import { useApp } from "./AppState";
import { Avatar, IconButton, EmptyState, Skeleton } from "./ui";
import { MoreIcon, PlusIcon, PhoneVoiceIcon, VideoIcon, CallsIcon } from "./icons";

type CallRow = { id: string; name: string; avatar: string; avatarColor: string; kind: string; type: string; time: string; status: string };

export function CallsTab() {
  const { toast } = useApp();
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [loading, setLoading] = useState(true);

  function load() { api.get<{ calls: CallRow[] }>("/api/calls").then((d) => setCalls(d.calls)).catch(() => {}).finally(() => setLoading(false)); }
  useEffect(load, []);

  async function logCall(receiverId: string | null, type: "audio" | "video", status: string) {
    try { await api.post("/api/calls", { receiverId: receiverId ?? "u_garis", type, status }); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
  }

  if (loading) return <div className="flex h-full flex-col"><Header /><div className="p-3"><Skeleton className="h-12 w-full mb-2"/><Skeleton className="h-12 w-full"/></div></div>;

  return (
    <div className="flex h-full flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto pb-24">
        <button onClick={() => logCall(null, "audio", "outgoing")} className="flex w-full items-center gap-3 px-4 py-3 text-x-red hover:bg-x-bg2"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-x-red-soft"><CallsIcon size={20} /></span><span className="text-[15px] font-medium">Buat tautan panggilan</span></button>
        <div className="px-4 pb-1 pt-2 text-[13px] font-medium text-x-muted">Terbaru</div>
        {calls.length === 0 && <EmptyState icon={<CallsIcon size={26} />} title="Belum ada panggilan" sub="Mulai panggilan untuk melihat riwayatnya." />}
        {calls.map((c) => {
          const missed = c.status === "missed";
          return (
            <div key={c.id} className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-x-bg2">
              <Avatar text={c.avatar[0] ?? "X"} color={c.avatarColor} size={48} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className={`truncate text-[15px] font-medium ${missed ? "text-x-red" : "text-x-text"}`}>{c.name}</span>
                <span className={`flex items-center gap-1 text-[12.5px] ${missed ? "text-x-red" : "text-x-muted"}`}>{c.kind === "outgoing" ? "↑" : c.kind === "incoming" ? "↓" : "↗"} {c.time}</span>
              </div>
              <div className="flex items-center gap-3"><IconButton aria-label="Panggilan suara" onClick={() => logCall(null, "audio", "outgoing")}><PhoneVoiceIcon size={21} /></IconButton><IconButton aria-label="Panggilan video" onClick={() => logCall(null, "video", "video")}><VideoIcon size={21} /></IconButton></div>
            </div>
          );
        })}
        <div className="flex items-center justify-center py-6 text-[11px] text-x-muted2">Riwayat panggilan hanya tersedia di perangkat ini</div>
      </div>
    </div>
  );
}

function Header() { return <header className="flex items-center gap-2 bg-x-bg/90 px-3 py-2.5 backdrop-blur"><h1 className="flex-1 text-[22px] font-bold text-x-text">Calls</h1><IconButton aria-label="Tambah"><PlusIcon size={22} /></IconButton><IconButton aria-label="Menu"><MoreIcon size={22} /></IconButton></header>; }
