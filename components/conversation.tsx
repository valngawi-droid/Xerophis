"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { MessageItem } from "@/lib/types";
import { api } from "./lib";
import { useApp } from "./AppState";
import { useRealtimeEvent } from "./hooks";
import { sendRealtime } from "./realtime";
import { Avatar, AppHeader, IconButton, MessageSkeleton, ConfirmDialog, ErrorState } from "./ui";
import { BackIcon, MoreIcon, VideoIcon, PhoneVoiceIcon, EmojiIcon, PlusIcon, CameraIcon, MicIcon, SendIcon, DoubleCheckIcon, CheckIcon, ReplyIcon, CopyIcon, StarIcon, PinIcon, ForwardIcon, EditIcon, TrashIcon } from "./icons";

export function Conversation({ id, onBack, onOpenInfo }: { id: string; onBack: () => void; onOpenInfo: () => void }) {
  const { toast } = useApp();
  const [info, setInfo] = useState<{ title: string; avatar: string; avatarColor: string; type: string; online: boolean; verified: boolean; memberCount: number } | null>(null);
  const [messages, setMessages] = useState<(MessageItem & { pending?: boolean })[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [replyTo, setReplyTo] = useState<MessageItem | null>(null);
  const [menuFor, setMenuFor] = useState<MessageItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [typing, setTyping] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<any>(null);

  const load = useCallback(async () => {
    setLoading(true); setError(false);
    try {
      const [infoD, msgD] = await Promise.all([
        api.get<{ conversation: any }>(`/api/conversations/${id}`),
        api.get<{ messages: MessageItem[] }>(`/api/conversations/${id}/messages`),
      ]);
      const c = infoD.conversation;
      setInfo({ title: c.title ?? "Chat", avatar: c.avatar ?? "X", avatarColor: c.avatar ?? "#FF1111", type: c.type, online: false, verified: false, memberCount: c.members?.length ?? 0 });
      setMessages(msgD.messages);
    } catch { setError(true); }
    finally { setLoading(false); }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages.length]);

  // Realtime: new message, reactions, typing
  useRealtimeEvent("message:new", (data) => {
    const m = data as MessageItem;
    if (m.conversationId !== id) return;
    setMessages((prev) => {
      const hasTmp = prev.find((p) => p.id.startsWith("tmp-") && p.text === m.text);
      if (hasTmp) return prev.map((p) => (p.id === hasTmp.id ? { ...p, ...m, id: m.id, pending: false } : p));
      return [...prev, m];
    });
  });
  useRealtimeEvent("message:reaction", (data) => {
    const d = data as { messageId: string; reactions: string[] };
    setMessages((prev) => prev.map((m) => (m.id === d.messageId ? { ...m, reactions: d.reactions } : m)));
  });
  useRealtimeEvent("message:delete", (data) => {
    const d = data as { id: string };
    setMessages((prev) => prev.filter((m) => m.id !== d.id));
  });
  useRealtimeEvent("typing:start", (data) => {
    const d = data as { conversationId: string; name: string; userId: string };
    if (d.conversationId !== id) return;
    setTyping(d.name);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => setTyping(null), 3500);
  });

  function typeInComposer() {
    if (text.trim()) sendRealtime("typing:start", { conversationId: id });
  }

  async function send() {
    const body = text.trim();
    if (!body) return;
    const tmpId = `tmp-${Date.now()}`;
    const optimistic: MessageItem & { pending: boolean } = {
      id: tmpId, conversationId: id, senderId: "me", from: "me", senderName: "Anda", text: body, kind: "text", replyTo: replyTo?.id ?? null, status: "sent", time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }), date: "Hari ini", reactions: [], pending: true,
    };
    setText("");
    setReplyTo(null);
    setMessages((prev) => [...prev, optimistic]);
    try {
      const d = await api.post<{ message: MessageItem }>(`/api/conversations/${id}/messages`, { text: body, replyTo: replyTo?.id });
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...d.message, pending: false } : m)));
      toast("Pesan terkirim", "success");
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      toast(e.message ?? "Gagal mengirim pesan", "error");
    }
  }

  // Attach & send a photo (uploads then posts an image message).
  async function sendImage(f: File | null) {
    if (!f) return;
    if (!/^image\/(jpeg|png|webp|gif)$/.test(f.type)) { toast("Format harus JPG/PNG/WebP", "error"); return; }
    if (f.size > 10 * 1024 * 1024) { toast("Ukuran maksimal 10MB", "error"); return; }
    const form = new FormData();
    form.append("file", f);
    const tmpId = `tmp-${Date.now()}`;
    setMessages((prev) => [...prev, {
      id: tmpId, conversationId: id, senderId: "me", from: "me", senderName: "Anda", text: "", kind: "image", mediaUrl: null, replyTo: replyTo?.id ?? null, status: "sent", time: "", date: "Hari ini", reactions: [], pending: true,
    } as MessageItem & { pending: boolean }]);
    try {
      const up = await api.post<{ url: string }>("/api/upload", form, true);
      const d = await api.post<{ message: MessageItem }>(`/api/conversations/${id}/messages`, { attachments: [{ type: "image", url: up.url, name: f.name, size: f.size, mime: f.type }] });
      setMessages((prev) => prev.map((m) => (m.id === tmpId ? { ...d.message, pending: false } : m)));
      setReplyTo(null);
      toast("Foto terkirim", "success");
    } catch (e: any) {
      setMessages((prev) => prev.filter((m) => m.id !== tmpId));
      toast(e.message ?? "Gagal mengirim foto", "error");
    }
  }

  const fileRef = useRef<HTMLInputElement>(null);

  async function toggleReaction(msg: MessageItem, emoji: string) {
    setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, reactions: m.reactions.includes(emoji) ? m.reactions.filter((r) => r !== emoji) : [...m.reactions, emoji] } : m));
    try {
      const d = await api.post<{ reactions: string[] }>(`/api/messages/${msg.id}/reactions`, { emoji });
      setMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, reactions: d.reactions } : m));
    } catch (e: any) {
      toast(e.message ?? "Gagal menambah reaksi", "error");
    }
  }

  async function copy(msg: MessageItem) {
    try { await navigator.clipboard.writeText(msg.text); toast("Tersalin", "success"); } catch { toast("Gagal menyalin", "error"); }
    setMenuFor(null);
  }

  async function removeMessage() {
    const target = messages.find((m) => m.id === deleteConfirm);
    setDeleteConfirm(null);
    setMenuFor(null);
    if (!target) return;
    try {
      await api.del(`/api/messages/${target.id}`);
      setMessages((prev) => prev.filter((m) => m.id !== target.id));
      toast("Pesan dihapus", "success");
    } catch (e: any) {
      toast(e.message ?? "Gagal menghapus", "error");
    }
  }

  const canSend = text.trim().length > 0;

  if (loading) return <div className="flex h-full flex-col"><AppHeader leading={<BackBtn onBack={onBack} />} title="Memuat…" /><MessageSkeleton /></div>;
  if (error || !info) return <><AppHeader leading={<BackBtn onBack={onBack} />} title="Chat" /><div className="flex-1"><ErrorState onRetry={load} /></div></>;

  return (
    <div className="flex h-full flex-col">
      <AppHeader
        leading={<BackBtn onBack={onBack} />}
        title={<button onClick={onOpenInfo} className="text-left"><span className="truncate text-[16px] font-semibold">{info?.title}</span></button>}
        subtitle={info?.type === "channel" ? `${info?.memberCount ?? 0} anggota` : typing ? <span className="text-x-red">{typing} sedang mengetik...</span> : "online"}
        actions={<>
          <IconButton aria-label="Video"><VideoIcon size={22} /></IconButton>
          <IconButton aria-label="Panggilan"><PhoneVoiceIcon size={21} /></IconButton>
          <IconButton aria-label="Menu" onClick={onOpenInfo}><MoreIcon size={22} /></IconButton>
        </>}
      />

      <div className="relative flex-1 overflow-y-auto px-3 pb-3">
        <div className="mx-auto my-2 max-w-[280px] rounded-lg bg-x-surface/60 px-3 py-2 text-center text-[11px] leading-relaxed text-x-muted">
          {info?.type === "channel" ? "Pesan dikirim ke semua anggota channel ini." : "Pesan dilindungi dengan enkripsi ujung-ke-ujung."}
        </div>
        {messages.map((msg, i) => {
          const prev = messages[i - 1];
          const showDate = !prev || (prev as any).date !== msg.date;
          return (
            <div key={msg.id}>
              {showDate && <DateChip label={msg.date} />}
              <Bubble msg={msg} onReaction={toggleReaction} onMenu={(m) => setMenuFor(m)} onReply={(m) => { setReplyTo(m); }} pending={!!msg.pending} />
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {replyTo && (
        <div className="mx-3 mb-1 flex items-center gap-2 rounded-xl bg-x-surface2 px-3 py-2">
          <span className="flex-1 text-[12px] text-x-muted truncate">Balas: <span className="text-x-text">{replyTo.text}</span></span>
          <button onClick={() => setReplyTo(null)} className="text-x-muted2">✕</button>
        </div>
      )}

      <div className="flex items-end gap-2 px-2 pb-2 safe-bottom">
        <div className="relative flex flex-1 items-center rounded-[24px] bg-x-surface2 px-2 py-1.5">
          <IconButton aria-label="Emoji"><PlusIcon size={24} /></IconButton>
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); typeInComposer(); }}
            onKeyDown={(e) => { if (e.key === "Enter") send(); }}
            placeholder="Ketik pesan"
            className="min-w-0 flex-1 bg-transparent py-1 text-[16px] text-x-text outline-none placeholder:text-x-muted"
          />
          <IconButton aria-label="Lampirkan" onClick={() => fileRef.current?.click()}><PlusIcon size={22} /></IconButton>
        </div>
        <IconButton aria-label="Kamera" onClick={() => fileRef.current?.click()}><CameraIcon size={22} /></IconButton>
        <button onClick={send} aria-label="Kirim" className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-colors ${canSend ? "bg-x-red text-white" : "bg-x-surface2 text-x-muted"}`}>
          {canSend ? <SendIcon size={22} /> : <MicIcon size={22} />}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => sendImage(e.target.files?.[0] ?? null)} />
      </div>

      {menuFor && <MessageMenu msg={menuFor} onClose={() => setMenuFor(null)} onReply={() => { setReplyTo(menuFor); setMenuFor(null); }} onCopy={() => copy(menuFor)} onDelete={() => setDeleteConfirm(menuFor.id)} />}
      <ConfirmDialog open={!!deleteConfirm} title="Hapus pesan?" body="Pesan ini akan dihapus dari percakapan." onConfirm={removeMessage} onCancel={() => setDeleteConfirm(null)} />
    </div>
  );
}

function BackBtn({ onBack }: { onBack: () => void }) {
  return <IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>;
}

function pendingSpinner(msg: MessageItem) {
  return <span className="mb-1 block h-4 w-4 animate-spin rounded-full border-2 border-x-muted2 border-t-transparent" />;
}

function DateChip({ label }: { label: string }) {
  return <div className="my-3 flex justify-center"><span className="rounded-lg bg-x-surface/80 px-3 py-1 text-[11px] text-x-muted">{label}</span></div>;
}

const REACTIONS = ["❤️", "😂", "🔥", "👍", "😮", "😢", "🙏"];

function Bubble({ msg, pending, onReaction, onMenu, onReply }: {
  msg: MessageItem; pending?: boolean; onReaction: (m: MessageItem, emoji: string) => void; onMenu: (m: MessageItem) => void; onReply: (m: MessageItem) => void;
}) {
  const mine = msg.from === "me";
  return (
    <div className={`relative flex ${mine ? "justify-end" : "justify-start"} ${msg.reactions?.length ? "mb-4" : "mb-1.5"}`}>
      <div
        className={`relative max-w-[78%] rounded-2xl px-3 py-2 ${pending ? "opacity-70" : ""} ${mine ? "rounded-br-md bg-[#3a0d0d] text-x-text ring-1 ring-x-red/40" : "rounded-bl-md bg-x-surface2 text-x-text"}`}
        onClick={() => onMenu(msg)}
      >
        {msg.kind === "image" && msg.mediaUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={msg.mediaUrl} alt="Foto" className="mb-1 max-h-[220px] w-full rounded-xl object-cover" style={{ minWidth: "160px" }} />
        )}
        {msg.text && <div className="whitespace-pre-wrap break-words text-[15px] leading-snug">{msg.text}</div>}
        {msg.kind === "image" && !msg.mediaUrl && pendingSpinner(msg)}
        <div className={`mt-1 flex items-center justify-end gap-1 ${mine ? "text-x-muted2" : "text-x-muted2"}`}>
          <span className="text-[10.5px]">{msg.time}</span>
          {mine && <span className="text-[14px] leading-none">{pending ? <span className="inline-block h-3 w-3 rounded-full border-2 border-x-muted2 border-t-transparent animate-spin" /> : msg.status === "read" ? <DoubleCheckIcon size={14} className="text-x-blue" /> : <CheckIcon size={14} />}</span>}
        </div>
        {msg.reactions?.length > 0 && (
          <div className={`absolute -bottom-4 flex gap-0.5 ${mine ? "left-1" : "right-1"}`} style={{ zIndex: 5 }}>
            {msg.reactions.map((r, i) => (
              <span key={i} className="flex h-6 w-6 items-center justify-center rounded-full bg-x-surface2 text-[12px] ring-1 ring-x-line">{r}</span>
            ))}
          </div>
        )}
      </div>
      {!mine && (
        <div className="ml-2 flex flex-col items-center gap-1">
          <button onClick={() => onReply(msg)} aria-label="Balas" className="flex h-8 w-8 items-center justify-center rounded-full bg-x-surface2 text-x-muted hover:text-x-text"><ReplyIcon size={16} /></button>
        </div>
      )}
    </div>
  );
}

function MessageMenu({ msg, onClose, onReply, onCopy, onDelete }: { msg: MessageItem; onClose: () => void; onReply: () => void; onCopy: () => void; onDelete: () => void }) {
  return (
    <div className="absolute inset-0 z-50" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50" />
      <div className="animate-slide-up absolute inset-x-0 bottom-0 rounded-t-2xl bg-x-surface2 p-2 pb-6" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-x-line2" />
        <div className="px-2 py-1 text-[13px] text-x-muted2">{msg.text}</div>
        <div className="grid grid-cols-4 gap-1 py-2">
          <MenuItem icon={<ReplyIcon size={20} />} label="Balas" onClick={onReply} />
          <MenuItem icon={<CopyIcon size={20} />} label="Salin" onClick={onCopy} />
          <MenuItem icon={<StarIcon size={20} />} label="Bintang" onClick={onClose} />
          <MenuItem icon={<PinIcon size={20} />} label="Semat" onClick={onClose} />
          <MenuItem icon={<ForwardIcon size={20} />} label="Teruskan" onClick={onClose} />
          <MenuItem icon={<EditIcon size={20} />} label="Edit" onClick={onClose} />
          <MenuItem icon={<TrashIcon size={20} />} label="Hapus" onClick={onDelete} danger />
          <MenuItem icon={<MoreIcon size={20} />} label="Lainnya" onClick={onClose} />
        </div>
      </div>
    </div>
  );
}

function MenuItem({ icon, label, onClick, danger }: { icon: ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return <button onClick={onClick} className={`flex flex-col items-center gap-1 rounded-xl py-2 ${danger ? "text-x-red" : "text-x-text"} active:bg-x-surface3`}><span>{icon}</span><span className="text-[11px]">{label}</span></button>;
}
