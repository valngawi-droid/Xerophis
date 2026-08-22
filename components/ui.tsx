"use client";

import type { ReactNode } from "react";
import { VerifiedIcon, ChevronRightIcon } from "./icons";

export function XerophisLogo({ size = 64, showText = true, useImage = true }: { size?: number; showText?: boolean; useImage?: boolean }) {
  if (useImage) {
    return (
      <span className="flex flex-col items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/xerophis-icon.png" alt="Xerophis" width={size} height={size} className="rounded-[22%] object-cover" style={{ width: size, height: size }} />
        {showText && <span className="text-[26px] font-bold tracking-tight text-x-text">Xerophis</span>}
      </span>
    );
  }
  return (
    <span className="flex flex-col items-center gap-2">
      <span
        className="flex items-center justify-center"
        style={{ width: size, height: size, background: "#0d0d10", borderRadius: size * 0.24, boxShadow: "0 0 0 2px rgba(255,17,17,0.3)" }}
      >
        <svg width={size * 0.5} height={size * 0.5} viewBox="0 0 100 100">
          <path d="M25 25 L75 75 M75 25 L25 75" stroke="#FF1111" strokeWidth={14} strokeLinecap="round" />
        </svg>
      </span>
      {showText && (
        <span className="text-[26px] font-bold tracking-tight text-x-text">Xerophis</span>
      )}
    </span>
  );
}

export function Avatar({
  text,
  color,
  size = 48,
  online,
  verified,
  ring,
  onClick,
}: {
  text?: string;
  color?: string;
  size?: number;
  online?: boolean;
  verified?: boolean;
  ring?: boolean;
  onClick?: () => void;
}) {
  const isImage = !!color && !color.startsWith("#") && color !== "";
  const c = color && color.startsWith("#") ? color : "#FF1111";
  const fontSize = size * 0.42;
  const Wrapper = (onClick ? "button" : "span") as any;
  return (
    <Wrapper onClick={onClick} className={`relative inline-block shrink-0 ${onClick ? "cursor-pointer" : ""}`} style={{ width: size, height: size }}>
      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={color} alt={text ?? "avatar"} width={size} height={size} className="object-cover" style={{ width: size, height: size, borderRadius: "50%", boxShadow: ring ? `0 0 0 2px #050707, 0 0 0 4px #FF1111` : undefined }} />
      ) : (
        <span
          className="flex items-center justify-center font-bold select-none text-white"
          style={{ width: size, height: size, borderRadius: "50%", background: c, fontSize, boxShadow: ring ? `0 0 0 2px #050707, 0 0 0 4px ${c}` : undefined }}
        >
          {text ?? "X"}
        </span>
      )}
      {online && <span className="absolute right-0 bottom-0 rounded-full bg-x-green online-dot" style={{ width: size * 0.3, height: size * 0.3, border: "2px solid #050707" }} />}
      {verified && <span className="absolute right-0 bottom-0" style={{ width: size * 0.34, height: size * 0.34 }}>
        <VerifiedIcon size={size * 0.34} />
      </span>}
    </Wrapper>
  );
}

export function IconButton({
  children,
  onClick,
  active,
  "aria-label": label,
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  active?: boolean;
  "aria-label"?: string;
  disabled?: boolean;
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={`flex h-10 w-10 items-center justify-center rounded-full text-x-text transition-colors ${active ? "bg-x-red text-white" : "hover:bg-x-surface2 active:bg-x-surface3"} ${disabled ? "opacity-40 pointer-events-none" : ""}`}
    >
      {children}
    </button>
  );
}

export function AppHeader({ leading, title, subtitle, actions }: { leading?: ReactNode; title: ReactNode; subtitle?: ReactNode; actions?: ReactNode }) {
  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 bg-x-bg/90 px-3 py-2.5 backdrop-blur">
      {leading}
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="truncate text-[17px] font-semibold leading-tight text-x-text">{title}</div>
        {subtitle && <div className="truncate text-[12px] text-x-muted leading-tight">{subtitle}</div>}
      </div>
      {actions && <div className="flex items-center gap-1">{actions}</div>}
    </header>
  );
}

export function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`shrink-0 rounded-full px-4 py-1.5 text-[13px] font-medium transition-colors ${active ? "bg-x-red text-white" : "bg-x-surface2 text-x-muted hover:bg-x-surface3"}`}>
      {label}
    </button>
  );
}

export function Toggle({ on, onChange, disabled }: { on: boolean; onChange?: (v: boolean) => void; disabled?: boolean }) {
  return (
    <button
      onClick={() => !disabled && onChange?.(!on)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? "bg-x-red hover:bg-x-red2" : "bg-x-surface3"} ${disabled ? "opacity-50" : ""}`}
      role="switch"
      aria-checked={on}
    >
      <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all" style={{ left: on ? "22px" : "2px" }} />
    </button>
  );
}

export function SettingRow({ icon, iconBg = "bg-x-surface2 text-x-text", label, sub, right, chevron = true, onClick, danger, divider, isLink, badge }: {
  icon?: ReactNode; iconBg?: string; label: ReactNode; sub?: ReactNode; right?: ReactNode; chevron?: boolean; onClick?: () => void; danger?: boolean; divider?: boolean; isLink?: boolean; badge?: ReactNode;
}) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-3 px-4 py-3 text-left ${isLink ? "" : "active:bg-x-surface2"} ${divider ? "border-b border-x-line/60" : ""}`}>
      {icon && <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconBg} ${danger ? "text-x-red" : ""}`}>{icon}</span>}
      <span className="flex min-w-0 flex-1 flex-col">
        <span className={`truncate text-[15px] ${danger ? "text-x-red" : "text-x-text"}`}>{label}</span>
        {sub && <span className="truncate text-[12.5px] text-x-muted">{sub}</span>}
      </span>
      <span className="flex items-center gap-2">{badge}{right}{chevron && <ChevronRightIcon className="text-x-muted2" size={20} />}</span>
    </button>
  );
}

export function GroupHeader({ children }: { children: ReactNode }) {
  return <div className="px-4 pt-4 pb-1 text-[13px] font-medium text-x-muted uppercase tracking-wide">{children}</div>;
}

export function Screen({ children }: { children: ReactNode }) {
  return <div className="flex h-full flex-col">{children}</div>;
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-md ${className}`} />;
}

export function ChatSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="px-3 py-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-2.5">
          <Skeleton className="h-[52px] w-[52px] rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-3.5 w-1/2" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function MessageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-hidden px-3 py-4">
      <div className="mx-auto max-w-[200px]"><Skeleton className="h-8 w-[200px]" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-12 ${i % 2 ? "w-2/3 bg-red-900/20" : "w-3/5"}`} />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ icon, title, sub, actionLabel, onAction }: { icon?: ReactNode; title: string; sub?: string; actionLabel?: string; onAction?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-x-surface2 text-x-muted2">{icon}</div>
      <div className="text-[16px] font-semibold text-x-text">{title}</div>
      {sub && <div className="max-w-[280px] text-[13px] text-x-muted">{sub}</div>}
      {actionLabel && onAction && (
        <button onClick={onAction} className="mt-1 rounded-full bg-x-red px-5 py-2.5 text-[14px] font-semibold text-white active:bg-x-red-dark">{actionLabel}</button>
      )}
    </div>
  );
}

export function ErrorState({ message = "Terjadi kesalahan", sub = "Coba lagi beberapa saat lagi.", onRetry }: { message?: string; sub?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center animate-fade-in">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-x-red-soft text-x-red">!</div>
      <div className="text-[16px] font-semibold text-x-text">{message}</div>
      <div className="max-w-[280px] text-[13px] text-x-muted">{sub}</div>
      {onRetry && <button onClick={onRetry} className="mt-1 rounded-full border border-x-line2 px-5 py-2.5 text-[14px] font-medium text-x-text active:bg-x-surface2">Coba Lagi</button>}
    </div>
  );
}

export function ToastViewport({ toasts, onDismiss }: { toasts: { id: number; text: string; kind: string }[]; onDismiss: (id: number) => void }) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div key={t.id} className={`toast-in pointer-events-auto flex items-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium shadow-xl ring-1 ${t.kind === "error" ? "bg-[#1a1010] text-x-red ring-x-red/30" : t.kind === "info" ? "bg-surface2 text-x-text ring-x-line" : "bg-[#101614] text-x-green ring-x-green/30"}`}>
          <span>{t.text}</span>
          <button onClick={() => onDismiss(t.id)} aria-label="Tutup" className="ml-1 text-x-muted2">✕</button>
        </div>
      ))}
    </div>
  );
}

export function ConfirmDialog({ open, title, body, confirmLabel = "Hapus", cancelLabel = "Batal", danger = true, onConfirm, onCancel }: {
  open: boolean; title: string; body?: string; confirmLabel?: string; cancelLabel?: string; danger?: boolean; onConfirm: () => void; onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center px-6">
      <div className="absolute inset-0 bg-black/70" onClick={onCancel} />
      <div className="animate-slide-up relative w-full max-w-sm rounded-2xl bg-x-surface2 p-5 ring-1 ring-x-line">
        <div className="text-[16px] font-semibold text-x-text">{title}</div>
        {body && <p className="mt-2 text-[13.5px] leading-relaxed text-x-muted">{body}</p>}
        <div className="mt-5 flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-full border border-x-line2 py-2.5 text-[14px] font-medium text-x-text active:bg-x-surface3">{cancelLabel}</button>
          <button onClick={onConfirm} className={`flex-1 rounded-full py-2.5 text-[14px] font-semibold text-white active:opacity-90 ${danger ? "bg-x-red" : "bg-x-surface3 text-x-text"}`}>{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
