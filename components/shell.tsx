"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AppProvider, useApp } from "./AppState";
import { AuthFlow } from "./auth";
import { LinkScreen } from "./link";
import { DevicesScreen } from "./devices";
import { ChatsTab } from "./chats";
import { Conversation } from "./conversation";
import { GroupInfo } from "./groupInfo";
import { UpdatesTab } from "./updates";
import { CommunitiesTab } from "./communities";
import { CallsTab } from "./calls";
import { SettingsTab, AccountScreen, PrivacyScreen, ChatSettingsScreen, NotificationsScreen, StorageScreen, HelpScreen, SessionsScreen, SecurityScreen, type SettingsRoute } from "./settings";
import { AvatarScreen } from "./avatar";
import { AvatarBuilderScreen } from "./avatarBuilder";
import { QrScanScreen } from "./qrscan";
import { ProfileScreen } from "./profile";
import { AdminDashboard } from "./admin";
import { ToastViewport } from "./ui";
import { ChatIcon, UpdatesIcon, CommunitiesIcon, CallsIcon, SettingsIcon, XLogo, BellIcon, LogoutIcon } from "./icons";
import { XerophisLogo } from "./ui";

// ---- tiny hash router ----
type Route = { path: string; parts: string[] };
function parseHash(): Route {
  if (typeof window === "undefined") return { path: "/", parts: [] };
  const h = window.location.hash.replace(/^#/, "") || "/";
  const parts = h.split("/").filter(Boolean);
  return { path: h, parts };
}
function navigate(to: string) { window.location.hash = to; }

function useRoute() {
  const [route, setRoute] = useState<Route>(parseHash());
  useEffect(() => {
    const on = () => setRoute(parseHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return route;
}

const tabs = [
  { key: "chats", label: "Chats", icon: (s: number) => <ChatIcon size={s} /> },
  { key: "updates", label: "Updates", icon: (s: number) => <UpdatesIcon size={s} /> },
  { key: "communities", label: "Komunitas", icon: (s: number) => <CommunitiesIcon size={s} /> },
  { key: "calls", label: "Calls", icon: (s: number) => <CallsIcon size={s} /> },
  { key: "settings", label: "Settings", icon: (s: number) => <SettingsIcon size={s} /> },
];

export function AppRoot() {
  return (
    <AppProvider>
      <Root />
    </AppProvider>
  );
}

function Root() {
  const { me, initializing } = useApp();
  const route = useRoute();

  if (initializing) {
    return (
      <AppFrame>
        <div className="flex h-full flex-col items-center justify-center bg-x-bg">
          <XerophisLogo size={64} />
          <div className="mt-3 text-[12px] text-x-muted2">Menyiapkan workspace…</div>
        </div>
      </AppFrame>
    );
  }

  // Device linking: this screen runs on a device that is NOT logged in yet.
  if (route.parts[0] === "link") {
    return (
      <AppFrame>
        <LinkScreen
          onDone={() => { window.location.href = "/"; }}
          onCancel={() => { window.location.hash = "/"; }}
        />
      </AppFrame>
    );
  }

  if (!me) {
    return (
      <AppFrame>
        <AuthFlow />
      </AppFrame>
    );
  }

  return (
    <AppFrame>
      <MainShell />
    </AppFrame>
  );
}

function AppFrame({ children }: { children: ReactNode }) {
  const { toasts, dismissToast } = useApp();
  return (
    <div className="mx-auto flex h-dvh w-full max-w-[440px] flex-col bg-x-bg ring-1 ring-x-line/70 md:max-w-none md:ring-0">
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

function MainShell() {
  const route = useRoute();
  const { toast } = useApp();
  const [p0, p1, p2] = route.parts;
  const tab = p0 && tabs.find((t) => t.key === p0) ? p0 : "chats";
  const isAdmin = p0 === "admin";
  const inSub = ["chat", "group", "profile", "settings"].includes(p0) || isAdmin;
  const showBottomNav = !inSub;

  function onOpenChat(id: string) { navigate(`/chat/${id}`); }
  function onOpenGroup(id: string) { navigate(`/group/${id}`); }

  let content: ReactNode;
  if (isAdmin) {
    content = <AdminDashboard onExit={() => navigate("/")} />;
  } else if (p0 === "chat" && p1) {
    content = <Conversation id={p1} onBack={() => navigate(tab === "chats" ? "/chats" : `/${tab}`)} onOpenInfo={() => navigate(`/group/${p1}`)} />;
  } else if (p0 === "group" && p1) {
    content = <GroupInfo id={p1} onBack={() => navigate(`/chat/${p1}`)} />;
  } else if (p0 === "profile") {
    content = <ProfileScreen onBack={() => navigate(`/${tab}`)} />;
  } else if (p0 === "settings" && p1) {
    const sub = p1 as SettingsRoute;
    const back = () => navigate(`/settings`);
    if (sub === "avatar-builder") content = <AvatarBuilderScreen onBack={back} />;
    else if (sub === "account") content = <AccountScreen onBack={back} />;
    else if (sub === "privacy") content = <PrivacyScreen onBack={back} />;
    else if (sub === "avatar") content = <AvatarScreen onBack={back} onBuilder={() => navigate("/settings/avatar-builder")} />;
    else if (sub === "chat") content = <ChatSettingsScreen onBack={back} />;
    else if (sub === "notifications") content = <NotificationsScreen onBack={back} />;
    else if (sub === "storage") content = <StorageScreen onBack={back} />;
    else if (sub === "help") content = <HelpScreen onBack={back} toast={(t) => toast(t, "info")} />;
    else if (sub === "sessions") content = <SessionsScreen onBack={back} />;
    else if (sub === "devices") content = <DevicesScreen onBack={back} onScan={() => navigate("/settings/qrscan")} />;
    else if (sub === "qrscan") content = <QrScanScreen onBack={back} onLinked={() => navigate("/settings/devices")} />;
    else if (sub === "security") content = <SecurityScreen onBack={back} />;
    else content = <SettingsTab onNavigate={(r) => navigate(`/settings/${r}`)} onOpenProfile={() => navigate("/profile")} />;
  } else if (p0 === "settings") {
    content = <SettingsTab onNavigate={(r) => navigate(`/settings/${r}`)} onOpenProfile={() => navigate("/profile")} />;
  } else {
    const c = tabs.find((t) => t.key === tab)!;
    content = (
      <>
        {c.key === "chats" && <ChatsTab onOpenChat={onOpenChat} />}
        {c.key === "updates" && <UpdatesTab />}
        {c.key === "communities" && <CommunitiesTab />}
        {c.key === "calls" && <CallsTab />}
        {c.key === "settings" && <SettingsTab onNavigate={(r) => navigate(`/settings/${r}`)} onOpenProfile={() => navigate("/profile")} />}
      </>
    );
  }

  return (
    <div className="flex h-full w-full overflow-hidden md:flex-row">
      <Sidebar tab={tab} isAdmin={isAdmin} onTab={(t) => navigate(`/${t}`)} onAdmin={() => navigate("/admin")} />
      <main className="relative flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        {content}
        {showBottomNav && <BottomNav tab={tab} onChange={(t) => navigate(`/${t}`)} />}
      </main>
    </div>
  );
}

function Sidebar({ tab, isAdmin, onTab, onAdmin }: { tab: string; isAdmin: boolean; onTab: (t: string) => void; onAdmin: () => void }) {
  const { me, logout } = useApp();
  if (isAdmin) {
    return (
      <aside className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-x-line bg-x-bg2 py-4 md:flex">
        <button onClick={onAdmin} className="flex h-11 w-11 items-center justify-center rounded-full ring-2 ring-x-red"><XLogo size={22} /></button>
      </aside>
    );
  }
  return (
    <aside className="hidden w-16 shrink-0 flex-col items-center gap-2 border-r border-x-line bg-x-bg2 py-4 md:flex">
      <button onClick={() => onTab("chats")} className="flex h-11 w-11 items-center justify-center rounded-full bg-x-red-soft"><XLogo size={22} className="text-x-red" /></button>
      <div className="my-2 h-px w-8 bg-x-line" />
      {tabs.map((t) => (
        <button key={t.key} onClick={() => onTab(t.key)} aria-label={t.label} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${tab === t.key ? "bg-x-red text-white" : "text-x-muted hover:bg-x-surface2"}`}>{t.icon(22)}</button>
      ))}
      <div className="flex-1" />
      <button onClick={onAdmin} aria-label="Admin" className="flex h-10 w-10 items-center justify-center rounded-full text-x-muted hover:bg-x-surface2"><BellIcon size={20} /></button>
      <button onClick={onAdmin} aria-label="Admin panel" className="flex h-10 w-10 items-center justify-center rounded-full text-x-muted hover:bg-x-surface2"><SettingsIcon size={20} /></button>
      <button onClick={logout} aria-label="Keluar" className="flex h-10 w-10 items-center justify-center rounded-full text-x-muted hover:bg-x-surface2"><LogoutIcon size={20} /></button>
    </aside>
  );
}

function BottomNav({ tab, onChange }: { tab: string; onChange: (t: string) => void }) {
  return (
    <nav className="flex items-stretch bg-x-bg/95 backdrop-blur safe-bottom">
      {tabs.map((item) => {
        const active = item.key === tab;
        return (
          <button key={item.key} onClick={() => onChange(item.key)} className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${active ? "text-x-red" : "text-x-muted"}`}>
            <span className={active ? "text-x-red" : ""}>{item.icon(23)}</span>
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}
