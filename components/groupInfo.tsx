"use client";

import { useEffect, useState } from "react";
import type { ConversationInfo } from "@/lib/types";
import { api } from "./lib";
import { useApp } from "./AppState";
import { Avatar, AppHeader, IconButton, Skeleton } from "./ui";
import { BackIcon, MoreIcon, VideoIcon, PhoneVoiceIcon, SearchIcon, PlusIcon, ImageIcon, BellIcon, InfoIcon, ShieldIcon, LogoutIcon, StarIcon, UserIcon, CheckIcon } from "./icons";
import type { ReactNode } from "react";

export function GroupInfo({ id, onBack }: { id: string; onBack: () => void }) {
  const { toast } = useApp();
  const [info, setInfo] = useState<ConversationInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<{ conversation: ConversationInfo }>(`/api/conversations/${id}`)
      .then((d) => setInfo(d.conversation))
      .catch(() => setInfo(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex h-full flex-col"><AppHeader title="Info grup" leading={<BackBtn onBack={onBack} />} /><div className="p-4"><Skeleton className="h-24 w-full"/><Skeleton className="mt-3 h-12 w-full"/></div></div>;
  if (!info) return <div className="flex h-full flex-col"><AppHeader title="Info" leading={<BackBtn onBack={onBack} />} /><div className="p-6 text-center text-x-muted">Grup tidak ditemukan</div></div>;

  const isChannel = info.type === "channel";
  const title = info.title ?? "Grup";

  async function leave() {
    if (isChannel) {
      try { await api.post(`/api/channels/${id}/subscribe`, { action: "unsubscribe" }); toast("Berhenti mengikuti", "success"); onBack(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
    } else {
      try { await api.del(`/api/conversations/${id}`).catch(() => {}); toast("Keluar dari grup", "success"); onBack(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); }
    }
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader leading={<BackBtn onBack={onBack} />} title="Info grup" subtitle={isChannel ? `${info.members.length} anggota` : `${info.members.length} peserta`} actions={<IconButton aria-label="Menu"><MoreIcon size={22} /></IconButton>} />
      <div className="flex-1 overflow-y-auto pb-8">
        <div className="flex flex-col items-center gap-3 py-6">
          <Avatar text={(info.avatar ?? title)[0] ?? "X"} color={info.avatar ?? "#FF1111"} size={96} ring />
          <button className="text-[17px] font-semibold text-x-text">{title}</button>
          <button className="max-w-[90%] px-6 text-center text-[13px] text-x-muted">{info.description || "Deskripsi grup"}</button>
          {!isChannel && <div className="flex items-center gap-1 text-[13px] text-x-muted"><ShieldIcon size={15} /> Enkripsi ujung-ke-ujung</div>}
        </div>

        <div className="grid grid-cols-4 gap-2 px-4 py-3">
          <Action icon={<VideoIcon size={22} />} label="Video" />
          <Action icon={<PhoneVoiceIcon size={21} />} label="Audio" />
          <Action icon={<SearchIcon size={21} />} label="Cari" />
          <Action icon={<PlusIcon size={22} />} label="Tambah" />
        </div>

        <InfoRow icon={<ImageIcon size={20} />} label="Media, Link & Dok." value="2" />
        <InfoRow icon={<StarIcon size={20} />} label="Pesan berbintang" />
        <InfoRow icon={<BellIcon size={20} />} label="Bisukan notifikasi" />
        <InfoRow icon={<ImageIcon size={20} />} label="Wallpaper grup" />
        {!isChannel && <><InfoRow icon={<InfoIcon size={20} />} label="Enkripsi" /><InfoRow icon={<CheckIcon size={20} />} label="Pesan sementara" /></>}

        <GroupLabel>{`${info.members.length} peserta · 1 admin`}</GroupLabel>
        {info.members.map((m) => (
          <div key={m.id} className="flex items-center gap-3 px-4 py-2.5">
            <Avatar text={m.avatar[0] ?? "X"} color="#FF1111" size={44} online={m.online} verified={m.verified} />
            <span className="flex flex-1 flex-col">
              <span className="text-[15px] text-x-text">{m.displayName}</span>
              <span className="text-[12px] text-x-muted">@{m.username}</span>
            </span>
            {m.role === "owner" ? <span className="text-[11px] text-x-muted">owner</span> : m.role === "admin" ? <span className="text-[11px] text-x-muted">admin</span> : null}
          </div>
        ))}

        <div className="my-2 border-t border-x-line/60" />
        <InfoRow icon={<LogoutIcon size={20} />} label={isChannel ? "Berhenti mengikuti" : "Keluar dari grup"} danger onClick={leave} />
        <InfoRow icon={<StarIcon size={20} />} label="Laporkan grup" danger />
      </div>
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) { return <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>; }
function Action({ icon, label }: { icon: ReactNode; label: string }) { return <button className="flex flex-col items-center gap-1.5 rounded-xl py-2 text-x-text hover:bg-x-surface2"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-x-surface2">{icon}</span><span className="text-[11px] font-medium">{label}</span></button>; }
function InfoRow({ icon, label, value, danger, onClick }: { icon: ReactNode; label: string; value?: string; danger?: boolean; onClick?: () => void }) {
  return <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3 text-left active:bg-x-surface2 ${danger ? "text-x-red" : "text-x-text"}`}><span className={`flex h-9 w-9 items-center justify-center rounded-full bg-x-surface2 ${danger ? "text-x-red" : ""}`}>{icon}</span><span className="flex-1 truncate text-[15px]">{label}</span>{value && <span className="text-[15px] text-x-muted">{value}</span>}<span className="text-x-muted2">›</span></button>;
}
function GroupLabel({ children }: { children: ReactNode }) { return <div className="px-4 pt-4 pb-1 text-[13px] font-medium text-x-muted">{children}</div>; }
