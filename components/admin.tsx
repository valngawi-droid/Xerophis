"use client";

import { useEffect, useState, type ReactNode } from "react";
import { api } from "./lib";
import { useApp } from "./AppState";
import { Avatar, Skeleton, EmptyState, IconButton, ConfirmDialog } from "./ui";
import { ChevronRightIcon as BackIcon, LogoutIcon, UserIcon, ChatIcon, ShieldIcon, InfoIcon, SettingsIcon, CommunitiesIcon, BellIcon, DownloadIcon, GlobeIcon } from "./icons";
import { XerophisLogo } from "./ui";
import { BRAND } from "@/lib/brand";

type AdminPage = "dashboard" | "users" | "messages" | "reports" | "groups" | "communities" | "channels" | "media" | "security" | "notifications" | "audit" | "settings";

const nav: { key: AdminPage; label: string; icon: (s: number) => ReactNode }[] = [
  { key: "dashboard", label: "Dashboard", icon: (s) => <ChartIcon size={s} /> },
  { key: "users", label: "Users", icon: (s) => <UserIcon size={s} /> },
  { key: "messages", label: "Messages", icon: (s) => <ChatIcon size={s} /> },
  { key: "groups", label: "Groups", icon: (s) => <CommunitiesIcon size={s} /> },
  { key: "communities", label: "Communities", icon: (s) => <CommunitiesIcon size={s} /> },
  { key: "channels", label: "Channels", icon: (s) => <GlobeIcon size={s} /> },
  { key: "reports", label: "Reports", icon: (s) => <ShieldIcon size={s} /> },
  { key: "media", label: "Media", icon: (s) => <DownloadIcon size={s} /> },
  { key: "notifications", label: "Notifications", icon: (s) => <BellIcon size={s} /> },
  { key: "security", label: "Security", icon: (s) => <ShieldIcon size={s} /> },
  { key: "audit", label: "Audit Logs", icon: (s) => <InfoIcon size={s} /> },
  { key: "settings", label: "Settings", icon: (s) => <SettingsIcon size={s} /> },
];

function ChartIcon({ size = 20 }: { size?: number }) { return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2" /></svg>; }

export function AdminDashboard({ onExit }: { onExit: () => void }) {
  const [page, setPage] = useState<AdminPage>("dashboard");
  const { toast } = useApp();
  const open = nav.find((n) => n.key === page);

  return (
    <div className="flex h-full w-full">
      {/* Sidebar (desktop) */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-x-line bg-x-bg2 md:flex">
        <div className="flex items-center gap-2 px-5 py-4"><XerophisLogo size={32} showText={false} /><span className="text-[16px] font-bold text-x-text">Xerophis <span className="text-x-red">Admin</span></span></div>
        <div className="flex-1 overflow-y-auto px-2 py-2">
          {nav.map((n) => (
            <button key={n.key} onClick={() => setPage(n.key)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[14px] font-medium ${page === n.key ? "bg-x-red-soft text-x-red" : "text-x-muted hover:bg-x-surface"}`}>
              <span className="flex h-7 w-7 items-center justify-center">{n.icon(18)}</span>{n.label}
            </button>
          ))}
        </div>
        <div className="border-t border-x-line px-5 py-3 text-[11px] text-x-muted2">Demo Environment</div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center gap-3 border-b border-x-line bg-x-bg2 px-4 py-3">
          <IconButton aria-label="Menu" onClick={() => toast("Gunakan sidebar desktop", "info")}><BackIcon size={20} /></IconButton>
          <div className="flex-1"><div className="text-[17px] font-semibold text-x-text">{open?.label}</div><div className="text-[11px] text-x-muted2">{BRAND.app} Admin Panel</div></div>
          <button onClick={onExit} className="flex items-center gap-1.5 rounded-full bg-x-surface2 px-3 py-1.5 text-[12px] font-medium text-x-text"><LogoutIcon size={14} /> Keluar</button>
        </header>
        <div className="flex-1 overflow-y-auto bg-x-bg p-4">
          {page === "dashboard" && <Dashboard />}
          {page === "users" && <AdminUsers />}
          {page === "messages" && <AdminList type="messages" />}
          {page === "reports" && <AdminReports />}
          {page === "groups" && <AdminList type="groups" />}
          {page === "communities" && <AdminList type="communities" />}
          {page === "channels" && <AdminList type="channels" />}
          {page === "media" && <AdminList type="media" />}
          {page === "security" && <AdminList type="security" />}
          {page === "notifications" && <AdminList type="notifications" />}
          {page === "audit" && <AdminAudit />}
          {page === "settings" && <AdminSettings />}
        </div>
      </div>

      {/* Mobile nav strip */}
      <div className="fixed bottom-0 inset-x-0 flex overflow-x-auto gap-2 border-t border-x-line bg-x-bg2 px-2 py-2 md:hidden">
        {nav.map((n) => <button key={n.key} onClick={() => setPage(n.key)} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium ${page === n.key ? "bg-x-red text-white" : "bg-x-surface2 text-x-muted"}`}>{n.icon(14)}{n.label}</button>)}
      </div>
    </div>
  );
}

function Card({ label, value }: { label: string; value: ReactNode }) {
  return <div className="rounded-xl bg-x-surface2 p-4 ring-1 ring-x-line"><div className="text-[12px] text-x-muted">{label}</div><div className="mt-1 text-[22px] font-semibold text-x-text">{value}</div></div>;
}

function Dashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { api.get("/api/admin/stats").then(setData).catch(() => {}).finally(() => setLoading(false)); }, []);
  if (loading) return <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{Array.from({ length: 9 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  if (!data) return <EmptyState title="Gagal memuat statistik" />;
  const c = data.cards;
  return (
    <div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card label="Total Users" value={c.totalUsers} /><Card label="Online" value={c.onlineUsers} /><Card label="Total Messages" value={c.totalMessages} />
        <Card label="Groups" value={c.totalGroups} /><Card label="Channels" value={c.totalChannels} /><Card label="Communities" value={c.totalCommunities} />
        <Card label="Open Reports" value={c.openReports} /><Card label="Storage Used" value={fmtBytes(c.storageUsed)} /><Card label="Demo" value="Yes" />
      </div>
      <div className="mt-4 flex items-center justify-center rounded-xl border border-dashed border-x-line bg-x-surface/40 p-6 text-[12px] text-x-muted2">Grafik (registrasi & pesan per hari) tersedia pada deploy penuh.</div>
    </div>
  );
}

function fmtBytes(n: number) { if (!n) return "0 B"; const u = ["B","KB","MB","GB"]; const i = Math.floor(Math.log(n)/Math.log(1024)); return `${(n/Math.pow(1024,i)).toFixed(1)} ${u[i]}`; }

function Table({ cols, rows }: { cols: string[]; rows: ReactNode[][] }) {
  return <div className="overflow-x-auto rounded-xl bg-x-surface2 ring-1 ring-x-line"><table className="w-full text-left text-[13px]"><thead className="text-x-muted border-b border-x-line"><tr>{cols.map((c) => <th key={c} className="px-3 py-2.5 font-medium">{c}</th>)}</tr></thead><tbody className="divide-y divide-x-line/50">{rows.map((r, i) => <tr key={i} className="text-x-text">{r.map((cell, j) => <td key={j} className="px-3 py-2.5">{cell}</td>)}</tr>)}</tbody></table></div>;
}

function AdminUsers() {
  const { toast } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [confirm, setConfirm] = useState<string | null>(null);
  function load() { api.get<{ users: any[] }>(`/api/admin/users${filter ? `?q=${filter}` : ""}`).then((d) => setUsers(d.users)).catch(() => {}); }
  useEffect(load, [filter]);
  async function changeStatus(u: any, status: string) { try { await api.patch(`/api/admin/users/${u.id}`, { status }); toast(`${u.username}: ${status}`, "success"); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  async function remove() { try { await api.del(`/api/admin/users/${confirm}`); toast("User dihapus", "success"); setConfirm(null); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); setConfirm(null); } }
  return <div>
    <div className="mb-3 flex items-center gap-2"><input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Cari user…" className="w-full max-w-xs rounded-lg bg-x-input px-3 py-2 text-[13px] text-x-text outline-none ring-1 ring-x-line" /></div>
    {users.length === 0 ? <EmptyState title="Tidak ada user" /> : <Table cols={["User", "Email", "Status", "Online", "Aksi"]} rows={users.map((u) => [
      <span className="flex items-center gap-2" key="u"><Avatar text={u.avatar?.[0] ?? "X"} color="#FF1111" size={30} /> {u.username}</span>,
      u.email ?? "—", u.status, u.isOnline ? "🟢" : "⚪",
      <span className="flex gap-1" key="a">
        <button onClick={() => changeStatus(u, u.status === "active" ? "suspended" : "active")} className="rounded bg-x-surface3 px-2 py-1 text-[11px]">{u.status === "active" ? "Suspend" : "Aktifkan"}</button>
        <button onClick={() => setConfirm(u.id)} className="rounded bg-x-red text-white px-2 py-1 text-[11px]">Hapus</button>
      </span>,
    ])} />}
    <ConfirmDialog open={!!confirm} title="Hapus user?" body="This action cannot be undone." onConfirm={remove} onCancel={() => setConfirm(null)} />
  </div>;
}

function AdminReports() {
  const { toast } = useApp();
  const [reports, setReports] = useState<any[]>([]);
  function load() { api.get<{ reports: any[] }>("/api/admin/reports").then((d) => setReports(d.reports)).catch(() => {}); }
  useEffect(load, []);
  async function setStatus(id: string, status: string) { try { await api.patch("/api/admin/reports", { id, status }); toast(`Report ${status}`, "success"); load(); } catch (e: any) { toast(e.message ?? "Gagal", "error"); } }
  if (!reports.length) return <EmptyState title="Tidak ada laporan" sub="Tidak ada laporan masuk." />;
  return <Table cols={["Reporter", "Tipe", "Alasan", "Status", "Aksi"]} rows={reports.map((r) => [
    r.reporter, r.targetType, r.reason, r.status,
    <span className="flex gap-1" key="a"><button onClick={() => setStatus(r.id, "resolved")} className="rounded bg-x-green/20 text-x-green px-2 py-1 text-[11px]">Resolve</button><button onClick={() => setStatus(r.id, "dismissed")} className="rounded bg-x-surface3 px-2 py-1 text-[11px]">Dismiss</button></span>,
  ])} />;
}

function AdminAudit() {
  const [logs, setLogs] = useState<any[]>([]);
  useEffect(() => { api.get<{ logs: any[] }>("/api/admin/audit").then((d) => setLogs(d.logs)).catch(() => {}); }, []);
  if (!logs.length) return <EmptyState title="Belum ada audit log" />;
  return <Table cols={["Admin", "Aksi", "Target", "Waktu"]} rows={logs.map((l) => [l.admin, l.action, l.target, new Date(l.createdAt).toLocaleString("id-ID")])} />;
}

function AdminList({ type }: { type: string }) {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => { api.get(`/api/admin/resources?type=${type}`).then((d: any) => setRows(d[type] ?? d.media ?? d.events ?? d.notifications ?? [])).catch(() => {}); }, [type]);
  if (!rows.length) return <EmptyState title={`Belum ada ${type}`} />;
  const keyMap: Record<string, string[]> = { groups: ["id","title","type"], messages: ["id","text"], communities: ["id","name"], channels: ["id","name"], media: ["id","name","type"], security: ["id","event"], notifications: ["id","title","type"] };
  const keys = keyMap[type] ?? ["id","name"];
  const labels = keys.map((k) => k.toUpperCase());
  return <Table cols={labels} rows={rows.map((r) => keys.map((k) => (typeof r[k] === "string" ? (r[k].length > 60 ? r[k].slice(0,60)+"…" : r[k]) : r[k])))} />;
}

function AdminSettings() {
  const { toast } = useApp();
  const toggles = [{ key: "registration", label: "Registrasi Terbuka" }, { key: "maintenance", label: "Mode Maintenance" }];
  return <div className="max-w-md rounded-xl bg-x-surface2 p-4 ring-1 ring-x-line"><div className="text-[16px] font-semibold text-x-text">Pengaturan Sistem</div><div className="mt-3 space-y-3">{toggles.map((t) => <SettingRowCompact key={t.key} label={t.label} onSave={() => toast(`${t.label} disimpan`, "success")} />)}</div><div className="mt-4 text-[11px] text-x-muted2">{BRAND.app} · {BRAND.team} · {BRAND.footer}</div></div>;
}

function SettingRowCompact({ label, onSave }: { label: string; onSave: () => void }) { const [on, setOn] = useState(false); return <div className="flex items-center justify-between"><span className="text-[14px] text-x-text">{label}</span><button onClick={() => { setOn(!on); onSave(); }} className={`relative h-6 w-11 rounded-full ${on ? "bg-x-red" : "bg-x-surface3"}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5" : "left-0.5"}`} /></button></div>; }
