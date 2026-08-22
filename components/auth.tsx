"use client";

import { useState } from "react";
import { useApp } from "./AppState";
import { ApiError } from "./lib";
import { XerophisLogo, IconButton } from "./ui";
import { BackIcon } from "./icons";

type AuthView = "splash" | "onboarding" | "login" | "register" | "forgot";

export function AuthFlow() {
  const [view, setView] = useState<AuthView>("splash");

  if (view === "splash") return <Splash onDone={() => setView("onboarding")} />;
  if (view === "onboarding") return <Onboarding onLogin={() => setView("login")} onRegister={() => setView("register")} />;
  if (view === "login") return <Login onBack={() => setView("onboarding")} onForgot={() => setView("forgot")} onRegister={() => setView("register")} />;
  if (view === "register") return <Register onBack={() => setView("login")} />;
  return <Forgot onBack={() => setView("login")} />;
}

function Splash({ onDone }: { onDone: () => void }) {
  setTimeout(onDone, 1600);
  return (
    <div className="flex h-full flex-col items-center justify-center bg-x-bg">
      <XerophisLogo size={96} />
      <div className="mt-4 flex items-center gap-1 text-[13px] text-x-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-x-red animate-pulse" />
        <span className="h-1.5 w-1.5 rounded-full bg-x-red/60 animate-pulse" style={{ animationDelay: "0.15s" }} />
        <span className="h-1.5 w-1.5 rounded-full bg-x-red/30 animate-pulse" style={{ animationDelay: "0.3s" }} />
      </div>
      <div className="mt-2 text-[12px] text-x-muted2">Pall</div>
    </div>
  );
}

function Onboarding({ onLogin, onRegister }: { onLogin: () => void; onRegister: () => void }) {
  const [step, setStep] = useState(0);
  const slides = [
    { title: "Welcome to Xerophis", body: "A private and modern way to stay connected." },
    { title: "Chat freely", body: "Send messages, photos, files and more." },
    { title: "Your space. Your control.", body: "Privacy and personalization designed around you." },
  ];
  const s = slides[step];
  return (
    <div className="flex h-full flex-col bg-x-bg px-6 pb-8">
      <div className="flex justify-end pt-4">
        <button onClick={onLogin} className="text-[13px] font-medium text-x-muted">Lewati</button>
      </div>
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div className="mb-8 flex h-28 w-28 items-center justify-center rounded-3xl bg-x-surface2 ring-1 ring-x-line">
          <XerophisLogo size={96} showText={false} />
        </div>
        <h1 className="text-[26px] font-bold text-x-text">{s.title}</h1>
        <p className="mt-3 max-w-[280px] text-[14px] leading-relaxed text-x-muted">{s.body}</p>
      </div>
      <div className="mb-6 flex items-center justify-center gap-2">
        {slides.map((_, i) => <span key={i} className={`h-1.5 rounded-full transition-all ${i === step ? "w-6 bg-x-red" : "w-3 bg-x-surface3"}`} />)}
      </div>
      <button
        onClick={() => (step < slides.length - 1 ? setStep(step + 1) : onRegister())}
        className="w-full rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark"
      >
        {step < slides.length - 1 ? "Lanjut" : "Get Started"}
      </button>
    </div>
  );
}

function Field({ label, type = "text", value, onChange, placeholder, autoComplete }: { label?: string; type?: string; value: string; onChange: (v: string) => void; placeholder?: string; autoComplete?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      {label && <span className="px-1 text-[12px] font-medium text-x-muted">{label}</span>}
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-x-input px-4 py-3 text-[15px] text-x-text outline-none ring-1 ring-x-line placeholder:text-x-muted2 focus:ring-x-red"
      />
    </label>
  );
}

function Submit({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <button disabled={loading} className="mt-4 flex w-full items-center justify-center rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark disabled:opacity-60">
      {loading ? <LoadingDots /> : children}
    </button>
  );
}

function LoadingDots() {
  return <span className="flex gap-1"><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white"/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" style={{animationDelay:"0.15s"}}/><span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" style={{animationDelay:"0.3s"}}/></span>;
}

import type { ReactNode } from "react";

function Login({ onBack, onForgot, onRegister }: { onBack: () => void; onForgot: () => void; onRegister: () => void }) {
  const { login, toast } = useApp();
  const [identifier, setIdentifier] = useState("xerophis");
  const [password, setPassword] = useState("Xerophis#2025");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    try {
      await login(identifier, password);
      toast("Berhasil masuk", "success");
    } catch (e) {
      const msg = e instanceof ApiError ? e.message : "Terjadi kesalahan.";
      toast(msg, "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-x-bg px-6 pb-6">
      <div className="pt-4"><IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton></div>
      <div className="flex flex-1 flex-col justify-center">
        <XerophisLogo size={64} showText={false} />
        <h1 className="mt-4 text-[28px] font-bold text-x-text">Welcome back</h1>
        <p className="mt-1 text-[14px] text-x-muted">Masuk ke akun Xerophis Anda.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Field label="Email / Username" value={identifier} onChange={setIdentifier} placeholder="kamu@xerophis.app" autoComplete="username" />
          <Field label="Password" type="password" value={password} onChange={setPassword} placeholder="••••••••" autoComplete="current-password" />
        </div>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-[12px] text-x-muted2">Demo: xerophis / Xerophis#2025</span>
          <button onClick={onForgot} className="text-[13px] font-medium text-x-red">Forgot password?</button>
        </div>
        <button onClick={submit} disabled={!identifier || !password || loading} className="mt-4 flex w-full items-center justify-center rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark disabled:opacity-50">
          {loading ? <LoadingDots /> : "Log In"}
        </button>
        <p className="mt-4 text-center text-[13px] text-x-muted">
          Belum punya akun? <button onClick={onRegister} className="font-semibold text-x-red">Daftar</button>
        </p>
      </div>
    </div>
  );
}

function Register({ onBack }: { onBack: () => void }) {
  const { register, toast } = useApp();
  const [form, setForm] = useState({ displayName: "", username: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  async function submit() {
    if (form.password !== form.confirm) { toast("Konfirmasi password tidak cocok", "error"); return; }
    setLoading(true);
    try {
      await register({ displayName: form.displayName, username: form.username, email: form.email || undefined, password: form.password });
      toast("Akun dibuat", "success");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-full flex-col bg-x-bg px-6 pb-6">
      <div className="pt-4"><IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton></div>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[26px] font-bold text-x-text">Create your Xerophis account</h1>
        <p className="mt-1 text-[14px] text-x-muted">Mulai percakapan Anda dalam hitungan detik.</p>
        <div className="mt-6 flex flex-col gap-3">
          <Field label="Nama tampilan" value={form.displayName} onChange={(v) => set("displayName", v)} placeholder="Nama Anda" autoComplete="name" />
          <Field label="Username" value={form.username} onChange={(v) => set("username", v.replace(/\s/g, ""))} placeholder="username" />
          <Field label="Email (opsional)" type="email" value={form.email} onChange={(v) => set("email", v)} placeholder="kamu@xerophis.app" autoComplete="email" />
          <Field label="Password" type="password" value={form.password} onChange={(v) => set("password", v)} placeholder="Minimal 8 karakter" autoComplete="new-password" />
          <Field label="Konfirmasi password" type="password" value={form.confirm} onChange={(v) => set("confirm", v)} placeholder="Ulangi password" autoComplete="new-password" />
        </div>
        <button onClick={submit} disabled={!form.displayName || !form.username || !form.password || form.password.length < 8 || loading} className="mt-5 flex w-full items-center justify-center rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark disabled:opacity-50">
          {loading ? <LoadingDots /> : "Create Account"}
        </button>
      </div>
    </div>
  );
}

function Forgot({ onBack }: { onBack: () => void }) {
  const { toast } = useApp();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit() {
    setLoading(true);
    try {
      const d = await postJson<{ resetToken?: string; message?: string }>("/api/auth/forgot-password", { email });
      toast(d.resetToken ? `Token demo: ${d.resetToken}` : (d.message ?? "Tautan reset dikirim."), "info");
    } catch (e) {
      toast(e instanceof ApiError ? e.message : "Terjadi kesalahan.", "error");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="flex h-full flex-col bg-x-bg px-6 pb-6">
      <div className="pt-4"><IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton></div>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-[26px] font-bold text-x-text">Reset password</h1>
        <p className="mt-1 text-[14px] text-x-muted">Masukkan email terdaftar Anda.</p>
        <div className="mt-6"><Field label="Email" type="email" value={email} onChange={setEmail} placeholder="kamu@xerophis.app" /></div>
        <button onClick={submit} disabled={!email || loading} className="mt-4 flex w-full items-center justify-center rounded-full bg-x-red py-3.5 text-[15px] font-semibold text-white active:bg-x-red-dark disabled:opacity-50">
          {loading ? <LoadingDots /> : "Kirim tautan reset"}
        </button>
      </div>
    </div>
  );
}

async function postJson<T = unknown>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body), credentials: "same-origin" });
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new ApiError(data?.error?.code ?? "ERROR", data?.error?.message ?? "Terjadi kesalahan.", res.status);
  return data as T;
}
