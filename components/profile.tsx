"use client";

import { useState } from "react";
import { useApp } from "./AppState";
import { Avatar, IconButton, AppHeader } from "./ui";
import { BackIcon, PencilIcon } from "./icons";

export function ProfileScreen({ onBack }: { onBack: () => void }) {
  const { me, updateProfile, toast } = useApp();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ displayName: me?.displayName ?? "", username: me?.username ?? "", bio: me?.bio ?? "", phone: me?.phone ?? "" });

  async function save() {
    try {
      await updateProfile({ displayName: form.displayName, username: form.username, bio: form.bio, phone: form.phone });
      toast("Profil diperbarui", "success");
      setEditing(false);
    } catch (e: any) { toast(e.message ?? "Gagal menyimpan", "error"); }
  }

  return (
    <div className="flex h-full flex-col">
      <AppHeader leading={<IconButton aria-label="Kembali" onClick={onBack}><BackIcon size={22} /></IconButton>} title="Profil" actions={editing ? undefined : <IconButton aria-label="Edit" onClick={() => setEditing(true)}><PencilIcon size={20} /></IconButton>} />
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center gap-3 pt-8">
          <Avatar text={me?.displayName[0] ?? "X"} color={me?.avatar ?? "#FF1111"} size={130} ring />
          <div className="text-[20px] font-semibold text-x-text">{me?.displayName}</div>
          <div className="px-8 text-center text-[14px] text-x-muted">{me?.bio || "Hey there! I am using Xerophis."}</div>
        </div>

        {editing ? (
          <div className="mt-5 flex flex-col gap-3 px-4">
            <Field label="Nama" value={form.displayName} onChange={(v) => setForm({ ...form, displayName: v })} />
            <Field label="Username" value={form.username} onChange={(v) => setForm({ ...form, username: v })} />
            <Field label="Bio" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} />
            <Field label="Nomor" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <button onClick={save} className="rounded-full bg-x-red py-3 text-[15px] font-semibold text-white active:bg-x-red-dark">Simpan</button>
          </div>
        ) : (
          <>
            <div className="mx-4 mt-5 overflow-hidden rounded-2xl bg-x-surface">
              <FieldStatic label="Nama" value={me?.displayName ?? ""} />
              <FieldStatic label="Bio" value={me?.bio ?? ""} />
              <FieldStatic label="Nomor" value={me?.phone ?? ""} />
              <FieldStatic label="Username" value={`@${me?.username}`} />
            </div>
            <button onClick={() => setEditing(true)} className="mx-4 mt-4 flex w-[calc(100%-2rem)] items-center justify-center gap-2 rounded-full bg-x-red py-3 text-[15px] font-semibold text-white active:bg-x-red-dark"><PencilIcon size={18} /> Edit Profil</button>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <label className="flex flex-col gap-1"><span className="text-[12px] font-medium text-x-muted">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} className="rounded-xl bg-x-input px-4 py-3 text-[15px] text-x-text outline-none ring-1 ring-x-line focus:ring-x-red" /></label>;
}
function FieldStatic({ label, value }: { label: string; value: string }) {
  return <div className="border-b border-x-line/60 px-4 py-3 last:border-0"><div className="text-[12px] text-x-muted">{label}</div><div className="text-[15px] text-x-text">{value}</div></div>;
}
