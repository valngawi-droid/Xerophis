"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { ChatItem, MessageItem } from "@/lib/types";
import { api } from "./lib";
import { useApp } from "./AppState";
import { useRealtimeEvent } from "./hooks";
import { Avatar, AppHeader, FilterChip, IconButton, ChatSkeleton, EmptyState, ErrorState } from "./ui";
import { CameraIcon, SearchIcon, MoreIcon, PlusIcon, MuteIcon, PinIcon, MicIcon, PaperclipIcon, ImageIcon, UserIcon, PencilIcon, XLogo } from "./icons";

type Filter = "semua" | "belum" | "grup" | "favorit";
const filters: { key: Filter; label: string }[] = [
  { key: "semua", label: "Semua" },
  { key: "belum", label: "Belum dibaca" },
  { key: "grup", label: "Grup" },
  { key: "favorit", label: "Favorit" },
];

export function ChatsTab({ onOpenChat }: { onOpenChat: (id: string) => void }) {
  const { me, toast } = useApp();
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filter, setFilter] = useState<Filter>("semua");
  const [query, setQuery] = useState("");
  const [sheet, setSheet] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const d = await api.get<{ conversations: ChatItem[] }>("/api/conversations");
      setChats(d.conversations);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // optimistic updates for message events
  useRealtimeEvent(["message:new"], (data) => {
    const msg = data as MessageItem;
    setChats((prev) =>
      prev.map((c) => (c.id === msg.conversationId ? { ...c, lastMessage: msg.text, lastTime: msg.time } : c))
    );
  });

  const list = useMemo(() => {
    let out = chats;
    if (filter === "belum") out = out.filter((c) => c.unread > 0);
    else if (filter === "grup") out = out.filter((c) => c.type !== "direct");
    else if (filter === "favorit") out = out.filter((c) => c.pinned);
    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter((c) => c.name.toLowerCase().includes(q) || c.lastMessage.toLowerCase().includes(q));
    }
    return out;
  }, [chats, filter, query]);

  if (loading) return <div className="flex h-full flex-col"><AppHeader title="Xerophis" leading={<Avatar text={me?.displayName[0] ?? "X"} color="#FF1111" size={40} ring />} actions={<HeaderActions />} /><FilterRow filter={filter} setFilter={setFilter} /><ChatSkeleton /></div>;
  if (error) return <div className="flex h-full flex-col"><AppHeader title="Xerophis" leading={<Avatar text={me?.displayName[0] ?? "X"} color="#FF1111" size={40} ring />} actions={<HeaderActions />} /><ErrorState onRetry={load} /></div>;

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        title="Xerophis"
        leading={<Avatar text={me?.displayName[0] ?? "X"} color="#FF1111" size={40} ring />}
        actions={
          <>
            <IconButton aria-label="Kamera"><CameraIcon size={22} /></IconButton>
            <IconButton aria-label="Cari" onClick={() => setQuery((q) => (q ? "" : "placeholder"))}><SearchIcon size={22} /></IconButton>
            <IconButton aria-label="Menu" onClick={() => sheet && setSheet(false)}><MoreIcon size={22} /></IconButton>
          </>
        }
      />
      <div className="px-3 pb-2">
        <div className="flex items-center gap-2 rounded-full bg-x-surface2 px-3 py-2">
          <SearchIcon className="text-x-muted" size={18} />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Cari atau mulai chat" className="flex-1 bg-transparent text-[15px] text-x-text outline-none placeholder:text-x-muted" />
          {query && <button onClick={() => setQuery("")} className="text-x-muted text-sm">✕</button>}
        </div>
      </div>
      <FilterRow filter={filter} setFilter={setFilter} />
      <div className="flex-1 overflow-y-auto pb-24">
        {list.length === 0 ? (
          filter === "semua" && !query ? (
            <EmptyState icon={<XLogo size={28} />} title="Belum ada percakapan" sub="Mulai percakapan baru di Xerophis." actionLabel="Mulai Chat" onAction={() => setSheet(true)} />
          ) : (
            <EmptyState icon={<SearchIcon size={26} />} title="Tidak ada hasil" sub="Coba kata kunci lain." />
          )
        ) : (
          list.map((chat) => <ChatRow key={chat.id} chat={chat} onClick={() => onOpenChat(chat.id)} />)
        )}
        {list.length > 0 && (
          <div className="flex items-center justify-center gap-1 py-4 text-[11px] text-x-muted2">
            <LockMini /> Pesan Anda dilindungi enkripsi ujung-ke-ujung
          </div>
        )}
      </div>

      <button onClick={() => setSheet(true)} aria-label="Chat baru" className="absolute right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-x-red text-white shadow-lg shadow-x-red/40 transition-transform active:scale-95" style={{ bottom: "84px" }}>
        <PlusIcon size={26} />
      </button>

      {sheet && <NewChatSheet onClose={() => setSheet(false)} onOpen={(id) => { setSheet(false); onOpenChat(id); }} />}
    </div>
  );
}

function HeaderActions() {
  return (<>
    <IconButton aria-label="Kamera"><CameraIcon size={22} /></IconButton>
    <IconButton aria-label="Cari"><SearchIcon size={22} /></IconButton>
    <IconButton aria-label="Menu"><MoreIcon size={22} /></IconButton>
  </>);
}

function FilterRow({ filter, setFilter }: { filter: Filter; setFilter: (f: Filter) => void }) {
  return (
    <div className="no-scrollbar flex gap-2 overflow-x-auto px-3 pb-2">
      {filters.map((f) => <FilterChip key={f.key} label={f.label} active={filter === f.key} onClick={() => setFilter(f.key)} />)}
    </div>
  );
}

function ChatRow({ chat, onClick }: { chat: ChatItem; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-3 py-2.5 hover:bg-x-bg2 active:bg-x-surface2">
      <Avatar text={chat.avatar[0] ?? "X"} color={chat.avatarColor} size={52} online={chat.online} verified={chat.verified} />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-1">
          <span className="truncate text-[15px] font-medium text-x-text">{chat.name}</span>
          {chat.muted && <MuteIcon size={15} className="text-x-muted2" />}
          {chat.pinned && <PinIcon size={15} className="text-x-muted2" />}
        </div>
        <span className="truncate text-[13.5px] text-x-muted">{chat.type === "channel" ? "🔔 " : ""}{chat.lastMessage}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[11.5px] text-x-muted">{chat.lastTime}</span>
        {chat.unread > 0 ? (
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-x-red px-1.5 text-[11px] font-semibold text-white">{chat.unread}</span>
        ) : (
          <span className="text-[11.5px] text-x-muted2">{chat.type === "channel" ? "✓" : ""}</span>
        )}
      </div>
    </button>
  );
}

function NewChatSheet({ onClose, onOpen }: { onClose: () => void; onOpen: (id: string) => void }) {
  const [users, setUsers] = useState<{ id: string; displayName: string; username: string; avatar: string }[]>([]);
  const { toast } = useApp();
  useEffect(() => {
    api.get<{ results: { users: { id: string; displayName: string; username: string; avatar: string }[] } }>("/api/search?q=")
      .then(async () => {
        // fetch contact list for starting a chat
        const d = await api.get<{ contacts: { id: string; name: string; username: string; avatar: string }[] }>("/api/contacts");
        setUsers(d.contacts.map((c) => ({ id: c.id, displayName: c.name, username: c.username, avatar: c.avatar })));
      })
      .catch(() => {});
  }, []);

  async function start(id: string) {
    try {
      const d = await api.post<{ conversation: { id: string } }>("/api/conversations", { type: "direct", targetId: id });
      onOpen(d.conversation.id);
    } catch (e: any) {
      toast(e.message ?? "Gagal memulai chat", "error");
    }
  }

  return (
    <div className="absolute inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="animate-slide-up absolute bottom-0 inset-x-0 rounded-t-2xl bg-x-surface2 p-3 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-x-line2" />
        <div className="px-2 pb-2 text-[15px] font-semibold text-x-text">Mulai chat baru</div>
        <button className="flex items-center gap-3 px-2 py-2.5 text-x-red"><span className="flex h-10 w-10 items-center justify-center rounded-full bg-x-red-soft"><PencilIcon size={19} /></span><span className="text-[15px] font-medium">Chat baru</span></button>
        <div className="max-h-[50vh] overflow-y-auto">
          {users.length === 0 && <div className="px-2 py-3 text-center text-[13px] text-x-muted">Tambahkan kontak di Settings → Kontak</div>}
          {users.map((u) => (
            <button key={u.id} onClick={() => start(u.id)} className="flex w-full items-center gap-3 px-2 py-2.5 hover:bg-x-surface3">
              <Avatar text={u.avatar[0] ?? "X"} color="#FF1111" size={44}/>
              <span className="flex flex-1 flex-col text-left">
                <span className="text-[15px] font-medium text-x-text">{u.displayName}</span>
                <span className="text-[12px] text-x-muted">@{u.username}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LockMini() {
  return <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><rect x="5" y="11" width="14" height="9" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>;
}
