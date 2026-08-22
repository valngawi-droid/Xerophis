"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api } from "./lib";
import { useApp } from "./AppState";
import { Avatar, SettingRow, GroupHeader, Toggle, Screen, IconButton } from "./ui";
import { SearchIcon, MoreIcon, ChevronRightIcon, SettingsIcon, ShieldIcon, LockIcon, StarIcon, BellIcon, NetworkIcon, InfoIcon, ShareIcon, KeyIcon, UserIcon, TrashIcon, GlobeIcon, LogoutIcon, DownloadIcon, PhoneVoiceIcon, ImageIcon, CheckIcon, LinkDeviceIcon } from "./icons";

export type SettingsRoute = "account" | "privacy" | "avatar" | "avatar-builder" | "chat" | "notifications" | "storage" | "help" | "sessions" | "security" | "devices" | "qrscan";

export function SettingsTab({ onNavigate, onOpenProfile }: { onNavigate: (r: SettingsRoute) => void; onOpenProfile: () => void }) {
  const { me, toast } = useApp();
  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center gap-2 bg-x-bg/90 px-3 py-2.5 backdrop-blur"><h1 className="flex-1 text-[22px] font-bold text-x-text">Settings</h1><IconButton aria-label="Cari"><SearchIcon size={21} /></IconButton><IconButton aria-label="Menu"><MoreIcon size={21} /></IconButton></header>
      <div className="flex-1 overflow-y-auto pb-24">
        <button onClick={onOpenProfile} className="flex w-full items-center gap-3 px-4 py-4 hover:bg-x-bg2">
          <Avatar text={me?.displayName[0] ?? "X"} color={me?.avatar ?? "#FF1111"} size={64} ring />
          <span className="flex flex-1 flex-col"><span className="text-[16px] font-semibold text-x-text">{me?.displayName}</span><span className="text-[13px] text-x-muted">{me?.bio || "Hey there! I am using Xerophis."}</span></span>
          <ChevronRightIcon className="text-x-muted2" size={20} />
        </button>
        <div className="mx-4 mt-2 flex divide-x divide-x-line rounded-2xl bg-x-surface">
          <MiniStat value="5" label="Chat" /><MiniStat value="99" label="Stats" /><MiniStat value="8" label="Grup" />
        </div>
        <div className="mt-3 border-t border-x-line/60" />
        <SettingRow icon={<SettingsIcon size={19} />} label="Akun" sub="keamanan akun, nomor, dan lainnya" onClick={() => onNavigate("account")} />
        <SettingRow icon={<LockIcon size={19} />} label="Privasi" sub="kontrol siapa yang bisa melihat Anda" onClick={() => onNavigate("privacy")} />
        <SettingRow icon={<StarIcon size={19} />} label="Avatar" sub="atur avatar dan foto profil" onClick={() => onNavigate("avatar")} />
        <SettingRow icon={<LinkDeviceIcon size={19} />} label="Perangkat Tertaut" sub="kelola HP & komputer yang masuk" onClick={() => onNavigate("devices")} />
        <SettingRow icon={<KeyIcon size={19} />} label="Keamanan" sub="dua langkah, sesi, dan perangkat" onClick={() => onNavigate("security")} />
        <SettingRow icon={<BellIcon size={19} />} label="Chat" sub="pengaturan tampilan dan perilaku chat" onClick={() => onNavigate("chat")} />
        <SettingRow icon={<BellIcon size={19} />} label="Notifikasi" sub="atur notifikasi pesan dan panggilan" onClick={() => onNavigate("notifications")} />
        <SettingRow icon={<NetworkIcon size={19} />} label="Penyimpanan dan Data" sub="kelola penggunaan data dan ruang" onClick={() => onNavigate("storage")} />
        <SettingRow icon={<InfoIcon size={19} />} label="Bantuan" sub="pusat bantuan Xerophis" onClick={() => onNavigate("help")} />
        <div className="my-2 border-t border-x-line/60" />
        <SettingRow icon={<ShareIcon size={19} />} label="Undang teman" sub="Ajak teman untuk bergabung ke Xerophis" onClick={() => toast("Tautan undangan disalin", "success")} />
        <div className="flex flex-col items-center gap-1 py-8"><div className="text-[14px] font-semibold text-x-text">Xerophis</div><div className="text-[11px] text-x-muted2">Xerophis Team Dev · Developed with ♥ by Pall</div></div>
      </div>
    </div>
  );
}

function SettingsScreenHeader({ title, subtitle, onBack }: { title: string; subtitle?: string; onBack: () => void }) {
  return <div className="sticky top-0 z-30 flex items-center gap-3 bg-x-bg/90 px-2 py-2.5 backdrop-blur"><IconButton aria-label="Kembali" onClick={onBack}><ChevronLeftIcon /></IconButton><div className="min-w-0 flex-1"><div className="truncate text-[17px] font-semibold">{title}</div>{subtitle && <div className="truncate text-[12px] text-x-muted">{subtitle}</div>}</div></div>;
}
import { ChevronRightIcon as ChevronLeftIcon } from "./icons";

export function AccountScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  return <Screen><SettingsScreenHeader title="Akun" subtitle="keamanan akun, nomor, dan lainnya" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <SettingRow icon={<ShieldIcon size={19} />} label="Notifikasi keamanan" sub="Dapatkan notifikasi saat masuk di perangkat lain" onClick={() => toast("Notifikasi keamanan aktif", "success")} />
    <SettingRow icon={<KeyIcon size={19} />} label="Verifikasi dua langkah" sub="Lindungi akun dengan PIN ekstra" onClick={() => toast("Verifikasi dua langkah dipilih", "success")} />
    <SettingRow icon={<PhoneVoiceIcon size={19} />} label="Ganti nomor" onClick={() => toast("Ganti nomor dipilih", "success")} />
    <SettingRow icon={<InfoIcon size={19} />} label="Minta info akun" onClick={() => toast("Info akun diminta", "success")} />
    <SettingRow icon={<TrashIcon size={19} />} label="Hapus akun saya" danger onClick={() => toast("Konfirmasi diperlukan", "error")} />
  </div></Screen>;
}

export function PrivacyScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  const [s, setS] = useState<Record<string, any>>({});
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { Promise.all([api.get<{ privacy: Record<string, any> }>("/api/settings")]).then(([d]) => { setS(d.privacy ?? {}); setLoaded(true); }).catch(() => setLoaded(true)); }, []);
  async function save(key: string, value: any) { const next = { ...s, [key]: value }; setS(next); try { await api.patch("/api/settings", { section: "privacy", values: { [key]: value } }); toast("Perubahan disimpan", "success"); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  return <Screen><SettingsScreenHeader title="Privasi" subtitle="kontrol siapa yang bisa melihat Anda" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <SettingRow icon={<GlobeIcon size={19} />} label="Terakhir dilihat dan online" sub={s.lastSeen ?? "Everyone"} onClick={() => save("lastSeen", (s.lastSeen === "Everyone" ? "Contacts" : "Everyone"))} />
    <SettingRow icon={<ImageIcon size={19} />} label="Foto profil" sub={s.profilePhoto ?? "Everyone"} onClick={() => save("profilePhoto", (s.profilePhoto === "Everyone" ? "Contacts" : "Everyone"))} />
    <SettingRow icon={<InfoIcon size={19} />} label="Info" sub={s.about ?? "Everyone"} onClick={() => save("about", (s.about === "Everyone" ? "Contacts" : "Everyone"))} />
    <SettingRow icon={<StarIcon size={19} />} label="Status" sub={s.status ?? "Contacts"} onClick={() => save("status", (s.status === "Contacts" ? "Everyone" : "Contacts"))} />
    <SettingRow icon={<UserIcon size={19} />} label="Grup" sub={s.groupAdd ?? "Contacts"} onClick={() => save("groupAdd", (s.groupAdd === "Contacts" ? "Nobody" : "Contacts"))} />
    <SettingRow icon={<CheckIcon size={19} />} label="Tanda terima baca" right={<Toggle on={!!s.readReceipts} onChange={(v) => save("readReceipts", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<LockIcon size={19} />} label="Lokasi langsung" sub={s.liveLocation ?? "Nobody"} onClick={() => save("liveLocation", "Nobody")} />
    <SettingRow icon={<LogoutIcon size={19} />} label="Keluar akun" sub="Keluar dari semua perangkat" danger onClick={() => toast("Fitur keamanan", "info")} />
  </div></Screen>;
}

export function ChatSettingsScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  const [s, setS] = useState<Record<string, any>>({});
  useEffect(() => { api.get<{ chat: Record<string, any> }>("/api/settings").then((d) => setS(d.chat ?? {})).catch(() => {}); }, []);
  async function save(k: string, v: any) { setS((p) => ({ ...p, [k]: v })); try { await api.patch("/api/settings", { section: "chat", values: { [k]: v } }); toast("Perubahan disimpan", "success"); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  return <Screen><SettingsScreenHeader title="Chat" subtitle="pengaturan tampilan dan perilaku chat" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <GroupHeader>Tampilan</GroupHeader>
    <SettingRow icon={<ImageIcon size={19} />} label="Tema" sub={s.theme === "light" ? "Terang" : "Gelap"} onClick={() => save("theme", s.theme === "light" ? "dark" : "light")} />
    <SettingRow icon={<ImageIcon size={19} />} label="Wallpaper" onClick={() => toast("Wallpaper dipilih", "info")} />
    <SettingRow icon={<GlobeIcon size={19} />} label="Bahasa" sub="Indonesia" onClick={() => toast("Bahasa dipilih", "info")} />
    <GroupHeader>Pengaturan chat</GroupHeader>
    <SettingRow icon={<CheckIcon size={19} />} label="Enter untuk mengirim" right={<Toggle on={!!s.enterToSend} onChange={(v) => save("enterToSend", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<ImageIcon size={19} />} label="Visibilitas media" sub={s.mediaVisibility ?? "Default"} onClick={() => toast("Visibilitas media", "info")} />
    <SettingRow icon={<StarIcon size={19} />} label="Ukuran font" sub={s.fontSize ?? "Medium"} onClick={() => save("fontSize", s.fontSize === "large" ? "medium" : "large")} />
    <GroupHeader>Riwayat</GroupHeader>
    <SettingRow icon={<LogoutIcon size={19} />} label="Riwayat chat" onClick={() => toast("Riwayat dipilih", "info")} />
  </div></Screen>;
}

export function NotificationsScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  const [s, setS] = useState<Record<string, any>>({});
  useEffect(() => { api.get<{ notifications: Record<string, any> }>("/api/settings").then((d) => setS(d.notifications ?? {})).catch(() => {}); }, []);
  async function save(k: string, v: any) { setS((p) => ({ ...p, [k]: v })); try { await api.patch("/api/settings", { section: "notifications", values: { [k]: v } }); toast("Perubahan disimpan", "success"); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  return <Screen><SettingsScreenHeader title="Notifikasi" subtitle="atur notifikasi pesan dan panggilan" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <GroupHeader>Pesan</GroupHeader>
    <SettingRow icon={<BellIcon size={19} />} label="Suara notifikasi" right={<Toggle on={!!s.messageSound} onChange={(v) => save("messageSound", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<BellIcon size={19} />} label="Getaran" right={<Toggle on={!!s.messageVibration} onChange={(v) => save("messageVibration", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<BellIcon size={19} />} label="Popup" right={<Toggle on={!!s.popup} onChange={(v) => save("popup", v ? 1 : 0)} />} chevron={false} />
    <GroupHeader>Grup</GroupHeader>
    <SettingRow icon={<BellIcon size={19} />} label="Suara grup" right={<Toggle on={!!s.groupSound} onChange={(v) => save("groupSound", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<BellIcon size={19} />} label="Getaran grup" right={<Toggle on={!!s.groupVibration} onChange={(v) => save("groupVibration", v ? 1 : 0)} />} chevron={false} />
    <GroupHeader>Panggilan</GroupHeader>
    <SettingRow icon={<PhoneVoiceIcon size={19} />} label="Nada dering" right={<Toggle on={!!s.callRingtone} onChange={(v) => save("callRingtone", v ? 1 : 0)} />} chevron={false} />
    <SettingRow icon={<PhoneVoiceIcon size={19} />} label="Getaran panggilan" right={<Toggle on={!!s.callVibration} onChange={(v) => save("callVibration", v ? 1 : 0)} />} chevron={false} />
  </div></Screen>;
}

export function StorageScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  return <Screen><SettingsScreenHeader title="Penyimpanan dan Data" subtitle="kelola penggunaan data dan ruang" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <GroupHeader>Pemakaian</GroupHeader>
    <SettingRow icon={<NetworkIcon size={19} />} label="Data mobile" sub="Saat menggunakan data seluler" onClick={() => toast("Data mobile dipilih", "info")} />
    <SettingRow icon={<ImageIcon size={19} />} label="Kualitas unggah" sub="Standard" onClick={() => toast("Kualitas unggah dipilih", "info")} />
    <SettingRow icon={<DownloadIcon size={19} />} label="Manajemen penyimpanan" sub="Kelola file media" onClick={() => toast("Manajemen penyimpanan", "info")} />
    <SettingRow icon={<NetworkIcon size={19} />} label="Wi-Fi" right={undefined} onClick={() => toast("Wi-Fi dipilih", "info")} />
    <SettingRow icon={<GlobeIcon size={19} />} label="Roaming" right={undefined} onClick={() => toast("Roaming dipilih", "info")} />
  </div></Screen>;
}

export function HelpScreen({ onBack, toast }: { onBack: () => void; toast: (t: string) => void }) {
  return <Screen><SettingsScreenHeader title="Bantuan" subtitle="pusat bantuan Xerophis" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <SettingRow icon={<InfoIcon size={19} />} label="Pusat bantuan" onClick={() => toast("Pusat bantuan dibuka")} />
    <SettingRow icon={<PhoneVoiceIcon size={19} />} label="Hubungi kami" onClick={() => toast("Hubungi kami dibuka")} />
    <SettingRow icon={<LockIcon size={19} />} label="Kebijakan privasi" onClick={() => toast("Kebijakan privasi dibuka")} />
    <SettingRow icon={<GlobeIcon size={19} />} label="Syarat dan ketentuan" onClick={() => toast("Syarat dibuka")} />
    <div className="flex flex-col items-center gap-1 py-10 pb-6"><Avatar text="X" color="#FF1111" size={46} /><div className="mt-2 text-sm font-semibold">Xerophis</div><div className="text-[11px] text-x-muted">Xerophis Team Dev</div><div className="text-[11px] text-x-muted2">Developed with ♥ by Pall</div><div className="text-[10px] text-x-muted2">All rights reserved.</div></div>
  </div></Screen>;
}

export function SessionsScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  const [sessions, setSessions] = useState<any[]>([]);
  useEffect(() => { api.get<{ sessions: any[] }>("/api/auth/sessions").then((d) => setSessions(d.sessions)).catch(() => {}); }, []);
  async function logoutAll() { try { await api.del("/api/auth/sessions"); toast("Semua sesi lain telah keluar", "success"); setSessions([]); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  return <Screen><SettingsScreenHeader title="Sesi Aktif" subtitle="kelola perangkat yang login" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    {sessions.map((s) => <div key={s.id} className="flex items-center gap-3 px-4 py-3"><span className="flex h-9 w-9 items-center justify-center rounded-full bg-x-surface2 text-x-muted"><GlobeIcon size={18} /></span><div className="flex flex-1 flex-col"><span className="text-[15px] text-x-text">{s.device} · {s.browser}</span><span className="text-[12px] text-x-muted">{s.location || "—"}</span></div><span className="text-[11px] text-x-muted2">{new Date(s.lastActive).toLocaleDateString("id-ID")}</span></div>)}
    <div className="my-2 border-t border-x-line/60" />
    <SettingRow icon={<LogoutIcon size={19} />} label="Keluar dari semua perangkat lain" danger onClick={logoutAll} />
  </div></Screen>;
}

export function SecurityScreen({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  return <Screen><SettingsScreenHeader title="Keamanan" subtitle="dua langkah, sesi, dan perangkat" onBack={onBack} /><div className="flex-1 overflow-y-auto">
    <SettingRow icon={<KeyIcon size={19} />} label="Verifikasi dua langkah" sub="Aktifkan PIN ekstra" onClick={() => toast("Verifikasi dua langkah", "info")} />
    <SettingRow icon={<ShieldIcon size={19} />} label="Log keamanan" sub="Peristiwa masuk akun" onClick={() => toast("Log keamanan", "info")} />
  </div></Screen>;
}

function MiniStat({ value, label }: { value: string; label: string }) { return <div className="flex flex-1 flex-col items-center py-2.5"><span className="text-[16px] font-semibold text-x-text">{value}</span><span className="text-[11px] text-x-muted">{label}</span></div>; }
