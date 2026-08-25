/* ============================================================
   XEROPHIS — mobile-first SPA (no build step)
   Developed with ♥ by Pall — Xerophis Team Dev
   ============================================================ */
import * as e2ee from '/e2ee.js';

/* tangkap prompt install PWA biar bisa ditawarkan lewat Settings */
let deferredInstall = null;
if (typeof window !== 'undefined') window.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferredInstall = e; });

/* ---------- icons ---------- */
const I = {
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  status: '<circle cx="12" cy="12" r="9" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="3.5"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>',
  camera: '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>',
  more: '<circle cx="12" cy="5" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.6" fill="currentColor" stroke="none"/><circle cx="12" cy="19" r="1.6" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  mic: '<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v4"/>',
  clip: '<path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/>',
  back: '<path d="M19 12H5M12 19l-7-7 7-7"/>',
  video: '<path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  checks: '<path d="M18 7 8.5 16.5 5 13"/><path d="M22 7l-9.5 9.5-1.5-1.5"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  x: '<path d="M18 6 6 18M6 6l12 12"/>',
  send: '<path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  star: '<path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z"/>',
  copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
  trash: '<path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
  db: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
  help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>',
  qr: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v.01M14 21v.01M21 21v.01M17.5 17.5H21v3.5"/>',
  edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5z"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
  crown: '<path d="M3 18h18"/><path d="m4 16 -1-8 5 3 4-6 4 6 5-3-1 8z"/>',
  vcheck: '<circle cx="12" cy="12" r="10" fill="#3b82f6" stroke="none"/><path d="m8 12.5 2.7 2.7L16.5 9" stroke="#fff" stroke-width="2.4"/>',
  bolt: '<path d="M13 2 3 14h7l-1 8 10-12h-7z"/>',
  down: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
  broadcast: '<path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9"/><path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5"/><circle cx="12" cy="12" r="2"/><path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5"/><path d="M19.1 4.9C23 8.8 23 15.2 19.1 19.1"/>',
  key: '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',
  palette: '<circle cx="13.5" cy="6.5" r=".9" fill="currentColor" stroke="none"/><circle cx="17.5" cy="10.5" r=".9" fill="currentColor" stroke="none"/><circle cx="8.5" cy="7.5" r=".9" fill="currentColor" stroke="none"/><circle cx="6.5" cy="12.5" r=".9" fill="currentColor" stroke="none"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/>',
};
const icon = (n, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24">${I[n]}</svg>`;

/* ---------- utils ---------- */
const $ = (s, r = document) => r.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtTime = (iso) => { const d = new Date(iso); return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`; };
const dayKey = (iso) => iso.slice(0, 10);
const dayLabel = (iso) => {
  const d = new Date(iso); const now = new Date();
  const today = new Date(now); const yest = new Date(now - 864e5);
  if (dayKey(d.toISOString()) === dayKey(today.toISOString())) return 'Hari ini';
  if (dayKey(d.toISOString()) === dayKey(yest.toISOString())) return 'Kemarin';
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};
let toastTimer;
function toast(msg, err = false) {
  const t = $('#toast'); t.textContent = msg; t.className = err ? 'show err' : 'show';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => (t.className = ''), 2200);
}

/* ---------- state ---------- */
const state = {
  token: localStorage.getItem('xerophis.token') || '',
  me: null,
  conversations: [],
  online: new Set(),
  typing: new Map(), // convId -> {name, until}
  activeChat: null,
  messages: [],
  filter: 'all',
  search: '',
  ws: null,
};

async function api(path, opts = {}) {
  const doFetch = (extra) => fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}`, 'x-client': location.search.includes('app=1') ? 'app' : 'web', ...extra, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let res = await doFetch(state.pin ? { 'x-admin-pin': state.pin } : {});
  let data = await res.json().catch(() => ({}));
  if (res.status === 401 && data.error === 'PIN_REQUIRED') {
    const pin = await askPin();
    if (pin !== null) {
      state.pin = pin;
      res = await doFetch({ 'x-admin-pin': pin });
      data = await res.json().catch(() => ({}));
    }
  }
  if (res.status === 401 && !path.startsWith('/auth')) {
    // sesi kedaluwarsa: lempar ke login, jangan diam saja
    state.token = ''; localStorage.removeItem('xerophis.token');
    if (location.hash !== '#/login') location.hash = '#/login';
  }
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}
function askPin() {
  return new Promise((res) => {
    closeSheet();
    const ov = document.createElement('div');
    ov.className = 'overlay open'; ov.id = 'sheet-overlay';
    ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>🔐 Verifikasi 2 langkah</h3>
      <div class="field"><label>PIN admin kamu</label><input id="pin-in" type="password" inputmode="numeric" /></div>
      <button class="btn-red" id="pin-go">Buka panel</button></div>`;
    $('#app').appendChild(ov);
    const done = (v) => { ov.remove(); res(v); };
    $('#pin-go').onclick = () => done($('#pin-in').value || null);
    ov.addEventListener('click', (e) => { if (e.target === ov) done(null); });
    setTimeout(() => $('#pin-in')?.focus(), 60);
  });
}

/* ---------- realtime ---------- */
function connectWS() {
  if (state.ws) { try { state.ws.close(); } catch {} }
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  const ws = new WebSocket(`${proto}://${location.host}/ws?token=${encodeURIComponent(state.token)}`);
  state.ws = ws;
  ws.onmessage = (e) => { let m; try { m = JSON.parse(e.data); } catch { return; } onWS(m); };
  ws.onclose = () => { if (state.token) setTimeout(connectWS, 2500); };
}
function wsSend(m) { if (state.ws && state.ws.readyState === 1) state.ws.send(JSON.stringify(m)); }

function onWS(m) {
  switch (m.type) {
    case 'hello': state.online = new Set(m.online); refreshPresence(); break;
    case 'presence': m.online ? state.online.add(m.userId) : state.online.delete(m.userId); refreshPresence(); break;
    case 'typing': {
      if (m.userId === state.me?.id) break;
      state.typing.set(m.conversationId, { name: m.name, until: Date.now() + 2600 });
      if (state.activeChat === m.conversationId) updateChatSubtitle();
      setTimeout(() => { if ((state.typing.get(m.conversationId)?.until || 0) <= Date.now()) { state.typing.delete(m.conversationId); if (state.activeChat === m.conversationId) updateChatSubtitle(); } }, 2700);
      break;
    }
    case 'message:new': onIncoming(m); break;
    case 'conversations:changed': loadConversations(false); if (routeName() === 'main') renderMain(true); break;
    case 'announce': setAnnounce(m.text); toast(m.text ? '📢 Pengumuman sistem' : 'Pengumuman dicabut'); break;
    case 'message:pinned': {
      if (state.activeChat === m.conversationId) renderPinned(m.pinned ? m.message : null);
      break;
    }
    case 'message:edited': {
      const row = $(`[data-mid="${m.messageId}"]`);
      if (row) { row.querySelector('.body').textContent = m.body; const t = row.querySelector('.t'); if (t && !t.textContent.includes('diedit')) t.textContent += ' · diedit'; }
      const mm = state.messages.find((x) => x.id === m.messageId); if (mm) { mm.body = m.body; mm.edited = true; }
      break;
    }
    case 'message:react': {
      const cont = $(`[data-rx="${m.messageId}"]`);
      if (cont) cont.innerHTML = reactChips({ reactions: m.reactions });
      const mm = state.messages.find((x) => x.id === m.messageId);
      if (mm) mm.reactions = m.reactions;
      break;
    }
    case 'call:offer': startCallUI('callee', m.call); break;
    case 'call:accept': if (state.call?.call.id === m.call.id) { startCallUI('caller', m.call, true); setupRTC(true, m.call.callee_id); } break;
    case 'call:reject': if (state.call?.call.id === m.call.id) { closeCallUI(); toast('❌ Ditolak'); if (routeName() === 'calls') renderCalls(); } break;
    case 'call:end': if (state.call?.call.id === m.call.id) { closeCallUI(); toast('📞 Panggilan berakhir'); if (routeName() === 'calls') renderCalls(); } break;
    case 'rtc': state.rtcHandler?.(m.payload); break;
    case 'message:deleted': {
      if (state.activeChat === m.conversationId) { $(`[data-mid="${m.messageId}"]`)?.remove(); }
      loadConversations(false);
      break;
    }
    case 'read': {
      if (state.activeChat === m.conversationId) {
        document.querySelectorAll('#messages .msgrow.out').forEach((row) => {
          const mid = Number(row.dataset.mid);
          if (Number.isFinite(mid) && mid <= m.messageId) {
            const tk = row.querySelector('.ticks');
            if (tk && !tk.classList.contains('read')) tk.outerHTML = `<span class="ticks read">${icon('checks')}</span>`;
          }
        });
      }
      break;
    }
  }
}

function setAnnounce(text) {
  state.announcement = text || '';
  const b = $('#ann-banner');
  if (!b) return;
  b.classList.toggle('hidden', !state.announcement);
  b.textContent = `📢 ${state.announcement}`;
}

function refreshPresence() {
  if (state.activeChat) updateChatSubtitle();
  if (routeName() === 'main') refreshMainSoft();
  const dots = document.querySelectorAll('.avatar[data-uid]');
  dots.forEach((a) => {
    const on = state.online.has(Number(a.dataset.uid));
    a.querySelector('.dot')?.remove();
    if (on) a.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
  });
}

async function onIncoming(m) {
  if (m.message.enc && state.e2eeKey) { try { m.message.body = await e2ee.decryptText(state.e2eeKey, m.message.body); } catch { m.message.body = '🔒'; } }
  const mine = m.message.senderId === state.me?.id;
  if (!mine) {
    if (state.activeChat === m.conversationId && routeName() === 'chat') {
      if (!$(`[data-mid="${m.message.id}"]`)) {
        const stick = nearBottom();
        state.messages.push(m.message); appendBubble(m.message);
        if (stick) scrollToBottom();
      }
      api(`/conversations/${m.conversationId}/read`, { method: 'POST', body: { messageId: m.message.id } }).catch(() => {});
    } else {
      const muted = state.conversations.find((c) => c.id === m.conversationId)?.muted;
      if (!muted) {
        toast(`💬 ${m.message.senderName}: ${m.message.body.slice(0, 40)}`);
        if (localStorage.getItem('xero.sound') === '1') beep();
        if (typeof document !== 'undefined' && document.hidden && 'Notification' in window && Notification.permission === 'granted') {
          try { new Notification(`💬 ${m.message.senderName}`, { body: String(m.message.body).slice(0, 80), icon: '/icon.svg' }); } catch {}
        }
      }
    }
  }
  loadConversations(routeName() === 'main');
}

/* ---------- routing ---------- */
function routeName() {
  const h = location.hash || '#/';
  if (h.startsWith('#/login')) return 'login';
  if (h.startsWith('#/register')) return 'register';
  if (h.startsWith('#/chat/')) return 'chat';
  if (h.startsWith('#/settings')) return 'settings';
  if (h.startsWith('#/updates')) return 'updates';
  if (h.startsWith('#/communities')) return 'communities';
  if (h.startsWith('#/calls')) return 'calls';
  if (h.startsWith('#/newchat')) return 'newchat';
  if (h.startsWith('#/admin')) return 'admin';
  return 'main';
}
function route() {
  if (!state.me && !['login', 'register'].includes(routeName())) { location.hash = '#/login'; return; }
  if (state.me && ['login', 'register'].includes(routeName())) { location.hash = '#/'; return; }
  state.activeChat = routeName() === 'chat' ? Number(location.hash.split('/')[2]) : null;
  const view = $('#view');
  view.innerHTML = '';
  ({ login: renderAuth, register: renderAuth, main: renderMain, chat: renderChat, settings: renderSettings,
     updates: renderUpdates, communities: renderCommunities, calls: renderCalls, newchat: renderNewChat,
     admin: renderAdmin }[routeName()] || renderMain)();
}
window.addEventListener('hashchange', route);

/* ---------- auth ---------- */
function renderAuth() {
  const isLogin = routeName() === 'login';
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="auth-wrap">
        <div class="logo-ring"><svg viewBox="0 0 64 64" fill="none"><path d="M18 14 L46 50 M46 14 L18 50" stroke="#ff1e1e" stroke-width="8" stroke-linecap="round"/></svg></div>
        <div class="auth-title">Xerophis</div>
        <div class="auth-sub">${isLogin ? 'Masuk ke akun kamu' : 'Buat akun — Developed with ♥ by Pall'}</div>
        <div class="field"><label>Username</label><input id="f-user" autocomplete="username" placeholder="username" /></div>
        ${isLogin ? '' : '<div class="field"><label>Nama tampilan</label><input id="f-name" placeholder="Nama kamu" /></div>'}
        <div class="field"><label>Password</label><input id="f-pass" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" placeholder="••••••••" /></div>
        <div class="form-error" id="f-err"></div>
        <button class="btn-red" id="f-go">${isLogin ? 'Masuk' : 'Daftar'}</button>
        ${isLogin ? '<button class="demo-chip" id="f-demo">⚡ Isi akun demo (xerophisuser / xerophis)</button>' : ''}
        <div class="auth-switch">${isLogin ? 'Belum punya akun? <b id="f-switch">Daftar</b>' : 'Sudah punya akun? <b id="f-switch">Masuk</b>'}</div>
        ${isLogin ? '<div class="auth-switch"><b id="f-forgot">Lupa password? Reset via email OTP</b></div>' : ''}
        <div class="auth-switch">atau <b id="f-otp-toggle">📧 masuk tanpa password (email OTP)</b></div>
        <div id="otp-box" class="hidden" style="width:100%">
          <div class="field"><label>Email</label><input id="f-email" placeholder="kamu@domain.com" /></div>
          <button class="btn-outline" id="f-otp-req" style="margin-bottom:10px">Kirim kode OTP</button>
          <div class="field"><label>Kode OTP</label><input id="f-code" inputmode="numeric" placeholder="6 digit" /></div>
          <button class="btn-red" id="f-otp-ver">Verifikasi & masuk</button>
        </div>
      </div>
    </section>`;
  $('#f-switch').onclick = () => { location.hash = isLogin ? '#/register' : '#/login'; };
  $('#f-otp-toggle').onclick = () => $('#otp-box').classList.toggle('hidden');
  $('#f-otp-req').onclick = async () => {
    try {
      const r = await api('/auth/otp/request', { method: 'POST', body: { email: $('#f-email').value.trim() } });
      toast(r.dev ? `📧 [dev] Kode OTP: ${r.dev}` : '📧 Kode OTP dikirim ke email kamu');
      if (r.dev) $('#f-code').value = r.dev;
    } catch (e) { toast(e.message, true); }
  };
  $('#f-otp-ver').onclick = async () => {
    try {
      const r = await api('/auth/otp/verify', { method: 'POST', body: { email: $('#f-email').value.trim(), code: $('#f-code').value.trim() } });
      state.token = r.token; localStorage.setItem('xerophis.token', r.token);
      await boot(); location.hash = '#/';
    } catch (e) { toast(e.message, true); }
  };
  $('#f-forgot')?.addEventListener('click', () => {
    const ov = document.createElement('div'); ov.className = 'overlay open'; ov.id = 'sheet-overlay';
    ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>Reset password</h3>
      <div class="field"><label>Email akun</label><input id="rs-email" placeholder="email kamu" /></div>
      <button class="btn-outline" id="rs-req" style="margin-bottom:10px">Kirim kode OTP</button>
      <div class="field"><label>Kode OTP</label><input id="rs-code" inputmode="numeric" /></div>
      <div class="field"><label>Password baru</label><input id="rs-new" type="password" /></div>
      <button class="btn-red" id="rs-go">Reset password</button></div>`;
    $('#app').appendChild(ov);
    ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
    $('#rs-req').onclick = async () => { try { const r = await api('/auth/otp/request', { method: 'POST', body: { email: $('#rs-email').value.trim() } }); toast(r.dev ? `[dev] kode: ${r.dev}` : '📧 kode dikirim'); if (r.dev) $('#rs-code').value = r.dev; } catch (e) { toast(e.message, true); } };
    $('#rs-go').onclick = async () => { try { await api('/auth/reset', { method: 'POST', body: { email: $('#rs-email').value.trim(), code: $('#rs-code').value.trim(), newPassword: $('#rs-new').value } }); closeSheet(); toast('🔑 Password diganti — silakan masuk'); } catch (e) { toast(e.message, true); } };
  });
  $('#f-demo')?.addEventListener('click', () => { $('#f-user').value = 'xerophisuser'; $('#f-pass').value = 'xerophis'; });
  const go = async () => {
    $('#f-err').textContent = '';
    try {
      const body = { username: $('#f-user').value.trim(), password: $('#f-pass').value };
      if (!isLogin) body.displayName = $('#f-name').value.trim() || body.username;
      const r = await api(`/auth/${isLogin ? 'login' : 'register'}`, { method: 'POST', body });
      state.token = r.token; localStorage.setItem('xerophis.token', r.token);
      await boot(); location.hash = '#/';
    } catch (e) { $('#f-err').textContent = e.message; }
  };
  $('#f-go').onclick = go;
  $('#f-pass').addEventListener('keydown', (e) => e.key === 'Enter' && go());
  $('#f-user').addEventListener('keydown', (e) => e.key === 'Enter' && $('#f-pass').focus());
}

/* ---------- bottom nav ---------- */
function navHTML(active) {
  const unreadTotal = state.conversations.reduce((n, c) => n + (c.unread || 0), 0);
  const item = (id, hash, ic, lbl) => `
    <button data-nav="${id}" class="${active === id ? 'active' : ''}" onclick="location.hash='${hash}'">
      ${icon(ic)}<span>${lbl}</span>${id === 'chats' && unreadTotal ? `<span class="nav-badge">${unreadTotal}</span>` : ''}
    </button>`;
  return `<nav class="bottom-nav">
    ${item('chats', '#/', 'chat', 'Chats')}
    ${item('updates', '#/updates', 'status', 'Updates')}
    ${item('communities', '#/communities', 'users', 'Communities')}
    ${item('calls', '#/calls', 'phone', 'Calls')}
    ${item('settings', '#/settings', 'gear', 'Settings')}
  </nav>`;
}

/* ---------- main / chats list ---------- */
async function loadConversations(rerender = true) {
  try {
    const r = await api('/conversations');
    state.conversations = r.conversations;
    if (rerender && routeName() === 'main') refreshMainSoft();
    document.querySelectorAll('[data-nav="chats"] .nav-badge').forEach((n) => n.remove());
    const total = state.conversations.reduce((n, c) => n + (c.unread || 0), 0);
    if (total && routeName() !== 'chat') $('[data-nav="chats"]')?.insertAdjacentHTML('beforeend', `<span class="nav-badge">${total}</span>`);
  } catch { /* sesi habis */ }
}

async function searchMessages(q) {
  const box = $('#msg-results'); if (!box) return;
  if ((q || '').trim().length < 2) { box.innerHTML = ''; return; }
  try {
    const { results } = await api(`/search?q=${encodeURIComponent(q)}`);
    box.innerHTML = results.length ? `<div class="section-lbl" style="padding:6px 16px 0">PESAN YANG COCOK</div>` + results.map((r) => `
      <div class="conv" data-goto="${r.cid}">
        <div class="avatar" style="width:40px;height:40px;font-size:12px;color:var(--red)">${icon('search', 'sm')}</div>
        <div class="meta"><div class="line1"><span class="name">${esc(r.conv_title || 'Chat')}</span><span class="spacer"></span><span class="time">${fmtTime(r.created_at)}</span></div>
        <div class="line2"><span class="preview">${esc(r.sender_name)}: ${esc(String(r.body).slice(0, 60))}</span></div></div>
      </div>`).join('') : '';
    box.querySelectorAll('[data-goto]').forEach((el) => el.onclick = () => { location.hash = `#/chat/${el.dataset.goto}`; });
  } catch { /* abaikan */ }
}

/* refresh ringan: cuma repaint list + badge, tanpa rebuild layar (fokus/scroll aman) */
function refreshMainSoft() {
  const listEl = $('#conv-list'); if (!listEl) return;
  const q = (state.search || '').toLowerCase();
  const filtered = state.conversations.filter((c) => (c.title || '').toLowerCase().includes(q) && passFilter(c));
  const scroll = listEl.scrollTop;
  paintList(filtered);
  listEl.scrollTop = scroll;
}

function renderMain(keep = false) {
  const convs = state.conversations.filter((c) => {
    if (state.search && !(c.title || '').toLowerCase().includes(state.search.toLowerCase())) return false;
    if (state.filter === 'unread') return c.unread > 0;
    if (state.filter === 'group') return c.type === 'group';
    if (state.filter === 'fav') return c.favorite;
    return true;
  });
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top">
        <h1>Xerophis</h1><span class="spacer"></span>
        <button class="iconbtn" id="m-cam">${icon('camera')}</button>
        <button class="iconbtn" id="m-more">${icon('more')}</button>
      </div>
      ${!location.search.includes('app=1') && /android/i.test(navigator.userAgent) && !localStorage.getItem('xero.apkhide') ? `
      <div class="apk-banner" id="apk-banner">
        <span>📲 <b>Ini bukan website</b> — install aplikasi Android Xerophis</span>
        <a class="btn-red" style="width:auto;padding:8px 12px" href="/xerophis.apk">Unduh APK</a>
        <button class="iconbtn" id="apk-x">${icon('x', 'sm')}</button>
      </div>` : ''}
      <div class="ann hidden" id="ann-banner"></div>
      <div class="searchbar">${icon('search', 'sm')}<input id="m-search" placeholder="Cari atau mulai chat" value="${esc(state.search)}" /></div>
      <div class="chips">
        ${[['all', 'Semua'], ['unread', 'Belum dibaca'], ['group', 'Grup'], ['fav', 'Favorit']].map(([id, lbl]) =>
          `<button class="chip ${state.filter === id ? 'active' : ''}" data-f="${id}">${lbl}</button>`).join('')}
      </div>
      <div class="conv-list" id="conv-list"></div>
      <div id="msg-results"></div>
      <button class="fab" id="m-fab" title="Chat baru">${icon('plus')}</button>
      ${navHTML('chats')}
    </section>`;
  paintList(convs);
  setAnnounce(state.announcement);
  $('#m-search').addEventListener('input', (e) => {
    state.search = e.target.value;
    /* pintu rahasia panel admin */
    if (state.search.trim().toLowerCase() === 'kingpall') {
      toast('👑');
      setTimeout(() => { state.search = ''; location.hash = '#/admin'; }, 380);
      return;
    }
    paintList(state.conversations.filter((c) => (c.title || '').toLowerCase().includes(state.search.toLowerCase()) && passFilter(c)));
    searchMessages(state.search);
  });
  document.querySelectorAll('.chip').forEach((ch) => ch.onclick = () => { state.filter = ch.dataset.f; renderMain(); });
  $('#m-fab').onclick = () => { location.hash = '#/newchat'; };
  $('#m-cam').onclick = () => postStatusSheet();
  $('#m-more').onclick = () => toast('Xerophis v1.2 — Xerophis Team Dev');
  $('#apk-x')?.addEventListener('click', () => { localStorage.setItem('xero.apkhide', '1'); $('#apk-banner')?.remove(); });
}
function passFilter(c) {
  if (state.filter === 'unread') return c.unread > 0;
  if (state.filter === 'group') return c.type === 'group';
  if (state.filter === 'fav') return c.favorite;
  return true;
}
function paintList(convs) {
  const list = $('#conv-list');
  if (!list) return;
  if (!convs.length) {
    list.innerHTML = `<div class="empty"><div class="ring">${icon('chat')}</div><h3>Belum ada chat</h3><p>Ketuk tombol + untuk memulai percakapan baru.</p></div>`;
    return;
  }
  list.innerHTML = convs.map((c) => {
    const cp = c.counterpart;
    const last = c.lastMessage;
    let preview = last ? (last.kind === 'system' ? last.body : `${last.senderId === state.me.id ? 'Anda' : (c.type === 'group' ? (last.senderName || '').split(' ')[0] : 'Anda')}: ${last.body}`) : 'Ketik untuk memulai chat 👋';
    if (last && last.senderId === state.me.id && c.type === 'private') preview = `Anda: ${last.body}`;
    if (last?.enc) preview = `🔒 pesan terenkripsi`;
    return `<div class="conv" data-id="${c.id}">
      <div class="avatar" ${cp ? `data-uid="${cp.id}"` : ''} style="background: radial-gradient(circle at 35% 30%, ${esc(c.avatarColor || '#7a1216')}, #170405 70%)">
        ${cp?.avatarUrl ? `<img class="av-img" src="${cp.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />` : esc(c.avatarText || '?')}${cp && state.online.has(cp.id) ? '<span class="dot"></span>' : ''}
      </div>
      <div class="meta">
        <div class="line1"><span class="name">${esc(c.title)}</span>${cp?.verified ? icon('vcheck', 'sm vcheck') : ''}${cp?.title ? `<span class="title-chip">${esc(cp.title)}</span>` : ''}${cp?.isBot ? '<span class="bot-tag"> Bot</span>' : ''}${c.favorite ? `<span class="star-tag">${icon('star', 'sm')}</span>` : ''}<span class="spacer"></span><span class="time ${c.unread ? 'unread' : ''}">${last ? fmtTime(last.createdAt) : ''}</span></div>
        <div class="line2"><span class="preview">${esc(preview)}</span>${c.unread ? `<span class="badge">${c.unread}</span>` : ''}</div>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('.conv').forEach((el) => el.onclick = () => { location.hash = `#/chat/${el.dataset.id}`; });
}

/* ---------- chat ---------- */
function fileToDataUrl(file) {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
}
async function imageToUpload(file) {
  const dataUrl = await fileToDataUrl(file);
  if (!file.type.startsWith('image/')) return dataUrl;
  try {
    const img = new Image();
    await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = dataUrl; });
    const max = 1280;
    const sc = Math.min(1, max / Math.max(img.width, img.height));
    if (sc === 1 && file.size < 900 * 1024) return dataUrl;
    const cv = document.createElement('canvas');
    cv.width = Math.max(1, Math.round(img.width * sc)); cv.height = Math.max(1, Math.round(img.height * sc));
    cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL('image/jpeg', 0.82);
  } catch { return dataUrl; }
}
function openMediaViewer(src) {
  const ov = document.createElement('div');
  ov.className = 'overlay open media-viewer';
  ov.innerHTML = `<img src="${src}" alt="media" /><button class="iconbtn mv-x" style="color:#fff">${icon('x')}</button>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', () => ov.remove());
}
function reactChips(m) {
  const groups = {};
  for (const r of m.reactions || []) (groups[r.emoji] = groups[r.emoji] || []).push(r.name);
  return Object.entries(groups).map(([e, names]) => `<span class="rx" title="${esc(names.join(', '))}">${e} ${names.length > 1 ? names.length : ''}</span>`).join('');
}
function ticksHTML(m) {
  if (m.senderId !== state.me.id || m.kind === 'system') return '';
  if (m.pending) return `<span class="ticks pending">${icon('clock')}</span>`;
  const read = (m.readBy || []).length > 0;
  return `<span class="ticks ${read ? 'read' : 'sent'}">${read ? icon('checks') : icon('check')}</span>`;
}
function bubbleHTML(m, showSender) {
  if (m.kind === 'system') return `<div class="sysline" data-mid="${m.id}">${esc(m.body)}</div>`;
  const out = m.senderId === state.me.id;
  const quoted = m.replyTo ? (state.messages || []).find((x) => x.id === m.replyTo) : null;
  return `<div class="msgrow ${out ? 'out' : ''}" data-mid="${m.id}">
    <div class="bubble">
      ${showSender ? `<div class="sender">${esc(m.senderName)}</div>` : ''}
      ${m.forwarded ? '<div class="fwd">↪ Diteruskan</div>' : ''}
      ${m.replyTo ? `<div class="reply-q">${quoted ? `<b>${esc(quoted.senderName)}</b> ${esc(String(quoted.body).slice(0, 60))}` : '💬 Pesan dibalas'}</div>` : ''}
      ${m.mediaId ? ((m.mediaMime || '').startsWith('audio')
        ? `<audio controls src="/media/${m.mediaId}?token=${encodeURIComponent(state.token)}"></audio>`
        : `<img class="msg-img" src="/media/${m.mediaId}?token=${encodeURIComponent(state.token)}" alt="media" loading="lazy" />`) : ''}
      ${m.body ? `<div class="body">${esc(m.body)}</div>` : ''}
      ${m.buttons?.length ? `<div class="btns">${m.buttons.map((b, i) => `<button class="cta" data-b="${i}">${esc(b.label)}</button>`).join('')}</div>` : ''}
      <div class="reacts" data-rx="${m.id}">${reactChips(m)}</div>
      <div class="tail"><span class="t">${fmtTime(m.createdAt)}${m.edited ? ' · diedit' : ''}</span>${ticksHTML(m)}</div>
    </div>
  </div>`;
}
function appendBubble(m) {
  const wrap = $('#messages'); if (!wrap) return;
  const prev = state.messages[state.messages.length - 2];
  const showSender = m.kind !== 'system' && m.senderId !== state.me.id && (!prev || prev.senderId !== m.senderId || dayKey(prev.createdAt) !== dayKey(m.createdAt));
  wrap.insertAdjacentHTML('beforeend', bubbleHTML(m, showSender));
  bindBubble(wrap.lastElementChild, m);
}
function filterChatBubbles(q) {
  const s = (q || '').toLowerCase();
  document.querySelectorAll('#messages .msgrow, #messages .datechip, #messages .sysline').forEach((el) => {
    el.style.display = !s || (el.textContent || '').toLowerCase().includes(s) ? '' : 'none';
  });
}
function scrollToBottom() { const w = $('#messages'); if (w) w.scrollTop = w.scrollHeight; }
const nearBottom = () => { const w = $('#messages'); return !w || (w.scrollHeight - w.scrollTop - w.clientHeight) < 160; };

function markTicksRead(messageId, userId) {
  const row = $(`[data-mid="${messageId}"]`); if (!row) return;
  const tk = row.querySelector('.ticks'); if (!tk) return;
  tk.outerHTML = `<span class="ticks read">${icon('checks')}</span>`;
}

function renderPinned(p) {
  const b = $('#pinned-bar'); if (!b) return;
  b.classList.toggle('hidden', !p);
  if (p) b.innerHTML = `${icon('star', 'sm')} <span>Pesan disematkan: ${esc(String(p.body).slice(0, 60))}</span>`;
}

function updateChatSubtitle() {
  const s = $('#chat-sub'); if (!s) return;
  const convId = state.activeChat;
  const t = state.typing.get(convId);
  if (t && t.until > Date.now()) { s.textContent = 'sedang mengetik…'; s.className = 's typing'; return; }
  const conv = state.conversations.find((c) => c.id === convId);
  const cp = conv?.counterpart;
  if (conv?.type === 'group') { s.textContent = `Grup · ${conv.memberCount} peserta`; s.className = 's'; }
  else if (cp) { const on = state.online.has(cp.id); s.textContent = on ? 'online' : 'terakhir dilihat baru saja'; s.className = `s ${on ? 'online' : ''}`; }
  else { s.textContent = 'catatan pribadi'; s.className = 's'; }
}

async function renderChat() {
  const id = state.activeChat;
  state.replyTo = null;
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="chat-top">
        <button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button>
        <div class="avatar" id="chat-av">•</div>
        <div class="who" id="chat-who"><div class="t" id="chat-title">…</div><div class="s" id="chat-sub"></div></div>
        <button class="iconbtn" id="c-search">${icon('search')}</button>
        <button class="iconbtn" id="c-vid">${icon('video')}</button>
        <button class="iconbtn" id="c-call">${icon('phone')}</button>
        <button class="iconbtn" id="c-more">${icon('more')}</button>
      </div>
      <div class="searchbar hidden" id="chat-searchbar" style="margin:6px 12px">${icon('search', 'sm')}<input id="chat-q" placeholder="Cari di chat ini…" /></div>
      <div class="pinned-bar hidden" id="pinned-bar"></div>
      <div class="ann hidden" id="ann-banner"></div>
      <div class="messages" id="messages"></div>
      <button class="fab fab-chat hidden" id="chat-down" title="Ke pesan terbaru">${icon('down')}</button>
      <div class="composer">
        <div class="media-chip hidden" id="c-chip"></div>
        <div class="reply-chip hidden" id="reply-chip"></div>
        <input type="file" id="c-file" accept="image/*" hidden />
        <div class="inputwrap">
          <button class="iconbtn" id="c-emoji">${icon('smile')}</button>
          ${state.me.isAdmin ? `<button class="iconbtn" id="c-quick" title="Balasan cepat">${icon('bolt', 'sm')}</button>` : ''}
          <input id="c-input" placeholder="Ketik pesan" autocomplete="off" />
          <button class="iconbtn" id="c-clip">${icon('clip')}</button>
          <button class="iconbtn" id="c-cam">${icon('camera')}</button>
        </div>
        <button class="micbtn" id="c-send">${icon('mic')}</button>
      </div>
      ${navHTML('chats')}
    </section>`;
  $('#c-search').onclick = () => {
    const bar = $('#chat-searchbar');
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) $('#chat-q').focus();
    else { $('#chat-q').value = ''; filterChatBubbles(''); }
  };
  $('#chat-q')?.addEventListener('input', (e) => filterChatBubbles(e.target.value));
  $('#c-vid').onclick = () => state.activeCounterpart ? startCall(state.activeCounterpart, 'video') : toast('🎥 Panggilan video — hanya untuk chat privat');
  $('#c-call').onclick = () => state.activeCounterpart ? startCall(state.activeCounterpart, 'voice') : toast('📞 Panggilan suara — hanya untuk chat privat');
  $('#c-emoji').onclick = () => { const i = $('#c-input'); i.value += ' 🔥'; i.focus(); };
  let pendingMedia = null;
  const fileIn = $('#c-file');
  $('#c-clip').onclick = () => { fileIn.removeAttribute('capture'); fileIn.click(); };
  $('#c-cam').onclick = () => { fileIn.setAttribute('capture', 'environment'); fileIn.click(); };
  fileIn.onchange = async () => {
    const f = fileIn.files[0]; if (!f) return;
    if (!f.type.startsWith('image/')) { toast('Gunakan file gambar (jpg/png/webp)', true); return; }
    try {
      const dataUrl = await imageToUpload(f); // kompresi otomatis biar gak mentok limit
      const r = await api('/media', { method: 'POST', body: { dataUrl } });
      pendingMedia = r.mediaId;
      const chip = $('#c-chip');
      chip.classList.remove('hidden');
      chip.innerHTML = `📷 ${esc(f.name)} (dikompres) <span class="spacer"></span><button class="iconbtn" id="c-chip-x">${icon('x', 'sm')}</button>`;
      $('#c-chip-x').onclick = () => { pendingMedia = null; chip.classList.add('hidden'); };
    } catch (e) { toast(e.message, true); }
    fileIn.value = '';
  };
  const mw = $('#messages');
  mw?.addEventListener('scroll', () => {
    const far = !nearBottom();
    $('#chat-down')?.classList.toggle('hidden', !far);
  });
  $('#chat-down')?.addEventListener('click', () => { scrollToBottom(); $('#chat-down')?.classList.add('hidden'); });
  $('#c-quick')?.addEventListener('click', async () => {
    try {
      const { quick } = await api('/quick');
      if (!quick.length) return toast('Belum ada template — kelola di King Panel › Otomasi');
      openSheet(quick.map((q) => ({ ic: 'bolt', lbl: `${q.title}: ${q.body.slice(0, 44)}`, fn: () => { const i = $('#c-input'); i.value = q.body; i.focus(); i.dispatchEvent(new Event('input')); } })));
    } catch (e) { toast(e.message, true); }
  });
  $('#c-more').onclick = () => openSheet(chatMenuSheet());
  $('#chat-who').onclick = () => openProfile();

  try {
    const [meta, msgs] = await Promise.all([api(`/conversations/${id}`), api(`/conversations/${id}/messages`)]);
    state.messages = msgs.messages;
    if (state.e2eeKey) for (const m of state.messages) if (m.enc) { try { m.body = await e2ee.decryptText(state.e2eeKey, m.body); } catch { m.body = '🔒 (gagal dekripsi)'; } }
    const conv = meta.conversation;
    renderPinned(conv.pinned);
    setAnnounce(state.announcement);
    const cpMeta = conv.counterpart;
    state.activeCounterpart = cpMeta ? cpMeta.id : null;
    state.e2eeKey = null;
    if (cpMeta && !cpMeta.isBot && state.myPriv) {
      try {
        const { pubkey } = await api(`/keys/${cpMeta.id}`);
        if (pubkey) state.e2eeKey = await e2ee.sharedKey(state.myPriv, pubkey);
      } catch {}
    }
    $('#chat-title').innerHTML = `${state.e2eeKey ? '🔒 ' : ''}${esc(conv.title)} ${cpMeta?.verified ? icon('vcheck', 'sm vcheck') : ''}${cpMeta?.title ? `<span class="title-chip">${esc(cpMeta.title)}</span>` : ''}`;
    const cp = conv.counterpart;
    const av = $('#chat-av');
    if (cp) {
      if (cp.avatarUrl) av.innerHTML = `<img class="av-img" src="${cp.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />`;
      else av.textContent = cp.avatarText;
      av.style.background = `radial-gradient(circle at 35% 30%, ${cp.avatarColor}, #170405 70%)`;
      av.dataset.uid = cp.id; if (state.online.has(cp.id)) av.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
    }
    else if (conv.type === 'group') { av.textContent = (conv.title || 'G').slice(0, 2).toUpperCase(); av.style.background = 'radial-gradient(circle at 35% 30%, #5c0f13, #170405 70%)'; }
    else { if (state.me.avatarUrl) av.innerHTML = `<img class="av-img" src="${state.me.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />`; else av.textContent = state.me.avatarText; }
    updateChatSubtitle();

    const wrap = $('#messages');
    wrap.innerHTML = `<div class="sysnote">${icon('lock', 'sm')} Pesan dan panggilan terenkripsi secara end-to-end. Tidak seorang pun di luar chat ini, termasuk Xerophis, yang dapat membaca atau mendengarkannya. Ketuk untuk info selengkapnya.</div>`;
    let lastDay = null, lastSender = null;
    for (const m of state.messages) {
      if (dayKey(m.createdAt) !== lastDay) { wrap.insertAdjacentHTML('beforeend', `<div class="datechip">${dayLabel(m.createdAt)}</div>`); lastDay = dayKey(m.createdAt); lastSender = null; }
      const showSender = m.kind !== 'system' && m.senderId !== state.me.id && m.senderId !== lastSender;
      wrap.insertAdjacentHTML('beforeend', bubbleHTML(m, showSender));
      bindBubble(wrap.lastElementChild, m);
      lastSender = m.senderId;
    }
    scrollToBottom();
    if (state.messages.length) api(`/conversations/${id}/read`, { method: 'POST', body: { messageId: state.messages[state.messages.length - 1].id } }).catch(() => {});
  } catch (e) { toast(e.message, true); }

  /* composer */
  const input = $('#c-input');
  let lastTypingSent = 0;
  input.addEventListener('input', () => {
    $('#c-send').innerHTML = input.value.trim() ? icon('send') : icon('mic');
    const now = Date.now();
    if (input.value.trim() && now - lastTypingSent > 1500) { wsSend({ type: 'typing', conversationId: id }); lastTypingSent = now; }
  });
  const send = async () => {
    const body = input.value.trim(); if (!body && !pendingMedia) return;
    const mediaId = pendingMedia;
    const replyTo = state.replyTo?.id || null;
    input.value = ''; $('#c-send').innerHTML = icon('mic');
    pendingMedia = null; $('#c-chip').classList.add('hidden');
    state.replyTo = null; paintReplyChip();
    const temp = { id: `t${Date.now()}`, senderId: state.me.id, body, kind: 'text', mediaId, replyTo, reactions: [], createdAt: new Date().toISOString(), pending: true };
    state.messages.push(temp); appendBubble(temp); scrollToBottom();
    let wireBody = body; let enc = 0;
    if (state.e2eeKey && !mediaId) { wireBody = await e2ee.encryptText(state.e2eeKey, body); enc = 1; }
    try {
      const r = await api(`/conversations/${id}/messages`, { method: 'POST', body: { body: wireBody, mediaId, replyTo, enc } });
      const row = $(`[data-mid="${temp.id}"]`);
      state.messages = state.messages.map((m) => (m.id === temp.id ? r.message : m));
      if (row) { row.dataset.mid = r.message.id; row.querySelector('.ticks').outerHTML = ticksHTML(r.message); }
    } catch (e) { toast(e.message, true); }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  let mediaRec = null; let recChunks = [];
  const toggleRec = async () => {
    if (mediaRec) { mediaRec.stop(); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRec = new MediaRecorder(stream);
      recChunks = [];
      mediaRec.ondataavailable = (e) => recChunks.push(e.data);
      mediaRec.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(recChunks, { type: mediaRec?.mimeType || 'audio/webm' });
        mediaRec = null; $('#c-send').classList.remove('rec');
        try {
          const dataUrl = await fileToDataUrl(blob);
          const up = await api('/media', { method: 'POST', body: { dataUrl } });
          pendingMedia = up.mediaId;
          await send(); // kirim pesan suara
        } catch (e) { toast(e.message, true); }
      };
      mediaRec.start();
      $('#c-send').classList.add('rec');
      toast('🎙 Merekam… ketuk mic lagi untuk kirim');
    } catch (e) { toast('Mic tidak tersedia: ' + e.message, true); }
  };
  $('#c-send').onclick = () => { if (input.value.trim() || pendingMedia) send(); else toggleRec(); };
  chatSend = async (text) => { input.value = text; await send(); };
}

function bindBubble(el, m) {
  if (!el || m.kind === 'system') return;
  el.querySelectorAll('.msg-img').forEach((img) => img.addEventListener('click', (ev) => { ev.stopPropagation(); openMediaViewer(img.src); }));
  let timer;
  const open = () => openSheet(messageSheet(m));
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); open(); });
  el.addEventListener('touchstart', () => { timer = setTimeout(open, 450); }, { passive: true });
  el.addEventListener('touchend', () => clearTimeout(timer));
  el.addEventListener('touchmove', () => clearTimeout(timer));
  el.querySelectorAll('.cta').forEach((btn) => btn.onclick = async (ev) => {
    ev.stopPropagation();
    const b = m.buttons[Number(btn.dataset.b)];
    if (m.kind === 'csat' || b.rating) {
      try {
        await api(`/conversations/${m.conversationId}/rating`, { method: 'POST', body: { rating: b.rating } });
        toast('⭐ Terima kasih atas penilaianmu!');
        el.querySelectorAll('.cta').forEach((x) => { x.disabled = true; });
      } catch (e) { toast(e.message, true); }
      return;
    }
    if (b.url) { window.open(b.url, '_blank'); return; }
    if (typeof chatSend === 'function') chatSend(b.label);
  });
}
let chatSend = null;
function urlB64ToBytes(s) {
  s = String(s).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}
const EMOJIS = ['👍', '❤️', '😂', '😮', '😢', '🙏', '🔥'];
function messageSheet(m) {
  const mine = m.senderId === state.me.id;
  return [
    { ic: 'edit', lbl: m.senderId === state.me.id && !m.enc ? 'Edit pesan' : null, fn: () => editMessage(m) },
    { ic: 'smile', lbl: 'Reaksi…', fn: () => openSheet([...EMOJIS.map((e) => ({ ic: 'smile', lbl: e, fn: async () => { try { await api(`/messages/${m.id}/react`, { method: 'POST', body: { emoji: e } }); } catch (er) { toast(er.message, true); } } })), { ic: 'x', lbl: 'Hapus reaksi saya', fn: async () => { try { await api(`/messages/${m.id}/react`, { method: 'POST', body: { emoji: '' } }); } catch (er) { toast(er.message, true); } } }]) },
    { ic: 'back', lbl: 'Balas', fn: () => { state.replyTo = m; paintReplyChip(); $('#c-input')?.focus(); } },
    { ic: 'send', lbl: 'Teruskan', fn: () => openSheet(state.conversations.filter((c) => c.id !== state.activeChat).map((c) => ({ ic: c.type === 'group' ? 'users' : 'chat', lbl: `Ke: ${c.title}`, fn: async () => { try { await api(`/messages/${m.id}/forward`, { method: 'POST', body: { toConversationId: c.id } }); toast('↪ Diteruskan'); } catch (er) { toast(er.message, true); } } }))) },
    { ic: 'star', lbl: m.pinned ? 'Lepas sematan' : 'Sematkan', fn: async () => { try { await api(`/conversations/${m.conversationId}/pin`, { method: 'POST', body: { messageId: m.id, pinned: !m.pinned } }); toast(m.pinned ? 'Sematan dilepas' : '📌 Disematkan'); } catch (er) { toast(er.message, true); } } },
    { ic: 'copy', lbl: 'Salin', fn: () => { navigator.clipboard?.writeText(m.body); toast('Disalin'); } },
    { ic: 'star', lbl: 'Bintang (simpan pesan)', fn: async () => { try { const r = await api(`/messages/${m.id}/star`, { method: 'POST', body: {} }); toast(r.starred ? '⭐ Disimpan ke berbintang' : 'Bintang dilepas'); } catch (e) { toast(e.message, true); } } },
    ...(mine ? [{ ic: 'trash', lbl: 'Hapus', danger: true, fn: async () => { try { await api(`/messages/${m.id}`, { method: 'DELETE' }); $(`[data-mid="${m.id}"]`)?.remove(); toast('Pesan dihapus'); } catch (e) { toast(e.message, true); } } }] : []),
  ];
}
async function openProfile() {
  try {
    const { conversation, members } = await api(`/conversations/${state.activeChat}`);
    const cp = conversation.counterpart;
    if (!cp) {
      openSheet([
        { ic: 'users', lbl: `${conversation.title} · ${members.length} anggota`, fn: () => {} },
        ...members.map((m) => ({ ic: 'user', lbl: `${m.displayName}${m.id === state.me.id ? ' (kamu)' : ''} · ${state.online.has(m.id) ? '🟢' : ''}`, fn: () => {} })),
        { ic: 'plus', lbl: 'Tambah anggota (email/@username)', fn: async () => {
          const t = prompt('Email atau @username yang mau ditambah:'); if (!t) return;
          try { await api(`/conversations/${state.activeChat}/members`, { method: 'POST', body: t.includes('@') ? { email: t } : { username: t.replace(/^@/, '') } }); toast('Anggota ditambah'); } catch (e) { toast(e.message, true); }
        } },
        { ic: 'edit', lbl: 'Ganti nama grup', fn: async () => {
          const t = prompt('Nama grup baru:', conversation.title); if (!t) return;
          try { await api(`/conversations/${state.activeChat}`, { method: 'PATCH', body: { title: t } }); toast('Nama grup diganti'); renderChat(); } catch (e) { toast(e.message, true); }
        } },
      ]);
      return;
    }
    openSheet([
      { ic: 'user', lbl: `${cp.displayName}${cp.verified ? ' ✔' : ''}${cp.title ? ` — ${cp.title}` : ''}`, fn: () => {} },
      { ic: 'chat', lbl: `@${cp.username}`, fn: () => {} },
      { ic: 'help', lbl: cp.about || '—', fn: () => {} },
      { ic: 'status', lbl: 'Lihat status orang ini', fn: () => { location.hash = '#/updates'; } },
      { ic: 'shield', lbl: 'Blokir pengguna ini', danger: true, fn: async () => { try { await api('/blocks', { method: 'POST', body: { username: cp.username } }); toast('🚫 Diblokir'); } catch (e) { toast(e.message, true); } } },
    ]);
  } catch (e) { toast(e.message, true); }
}
function editMessage(m) {
  closeSheet();
  const ov = document.createElement('div'); ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>Edit pesan</h3>
    <div class="field"><textarea id="ed-body" rows="3" class="ta">${esc(m.body)}</textarea></div>
    <button class="btn-red" id="ed-go">Simpan</button></div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  $('#ed-go').onclick = async () => {
    try {
      const r = await api(`/messages/${m.id}`, { method: 'PATCH', body: { body: $('#ed-body').value } });
      m.body = r.message.body; m.edited = true;
      const row = $(`[data-mid="${m.id}"]`);
      if (row) { row.querySelector('.body').textContent = r.message.body; row.querySelector('.t').textContent = fmtTime(m.createdAt) + ' · diedit'; }
      closeSheet(); toast('Pesan diedit');
    } catch (e) { toast(e.message, true); }
  };
}
function paintReplyChip() {
  const chip = $('#reply-chip'); if (!chip) return;
  if (!state.replyTo) { chip.classList.add('hidden'); return; }
  chip.classList.remove('hidden');
  chip.innerHTML = `↩ Membalas <b>${esc(state.replyTo.senderName)}</b>: ${esc(String(state.replyTo.body).slice(0, 40))} <span class="spacer"></span><button class="iconbtn" id="reply-x">${icon('x', 'sm')}</button>`;
  $('#reply-x').onclick = () => { state.replyTo = null; paintReplyChip(); };
}
function chatMenuSheet() {
  const conv = state.conversations.find((c) => c.id === state.activeChat);
  return [
    { ic: 'star', lbl: conv?.favorite ? 'Hapus dari favorit' : 'Favoritkan', fn: async () => { try { await api(`/conversations/${state.activeChat}/favorite`, { method: 'POST', body: { favorite: !conv?.favorite } }); toast(conv?.favorite ? 'Dihapus dari favorit' : '⭐ Ditambahkan ke favorit'); loadConversations(false); } catch (e) { toast(e.message, true); } } },
    { ic: 'star', lbl: 'Pesan berbintang', fn: async () => {
      try {
        const { stars } = await api('/stars');
        openSheet(stars.length ? stars.map((s) => ({ ic: 'star', lbl: `${s.sender_name}: ${s.body.slice(0, 52)}`, fn: () => {} })) : [{ ic: 'star', lbl: 'Belum ada pesan berbintang', fn: () => {} }]);
      } catch (e) { toast(e.message, true); }
    } },
    { ic: 'bell', lbl: 'Bisukan / nyala notifikasi chat ini', fn: async () => {
      try {
        const cur = (await api(`/conversations/${state.activeChat}/mute`)).muted;
        await api(`/conversations/${state.activeChat}/mute`, { method: 'POST', body: { muted: !cur } });
        toast(!cur ? '🔕 Notifikasi chat dibisukan' : '🔔 Notifikasi chat dinyalakan');
      } catch (e) { toast(e.message, true); }
    } },
    { ic: 'users', lbl: 'Info percakapan & anggota', fn: async () => {
      try {
        const { conversation, members } = await api(`/conversations/${state.activeChat}`);
        openSheet([
          { ic: conversation.type === 'group' ? 'users' : 'user', lbl: `${conversation.title} · ${members.length} anggota`, fn: () => {} },
          ...members.map((m) => ({ ic: 'user', lbl: `${m.displayName}${m.id === state.me.id ? ' (kamu)' : ''} · ${state.online.has(m.id) ? '🟢 online' : 'offline'}`, fn: () => {} })),
        ]);
      } catch (e) { toast(e.message, true); }
    } },
  ];
}

/* ---------- sheet ---------- */
function openSheet(items) {
  closeSheet();
  items = items.filter((it) => it && it.lbl);
  const ov = document.createElement('div');
  ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet"><div class="grab"></div>${items.map((it, i) => `
    <button class="menu-row ${it.danger ? 'danger' : ''}" data-i="${i}">
      <span class="ic">${icon(it.ic)}</span><span class="lbl">${esc(it.lbl)}</span>
    </button>`).join('')}</div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  ov.querySelectorAll('.menu-row').forEach((b) => b.onclick = () => { closeSheet(); items[Number(b.dataset.i)].fn(); });
}
function closeSheet() { $('#sheet-overlay')?.remove(); }

/* ---------- new chat ---------- */
async function renderNewChat() {
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top">
        <button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button>
        <h1 style="font-size:19px">Chat baru</h1>
      </div>
      <div class="searchbar">${icon('search', 'sm')}<input id="n-search" placeholder="Cari nama / @username…" /></div>
      <div class="newchat-body" id="n-body">
        <div class="section-lbl">TAMBAH KONTAK VIA EMAIL</div>
        <div class="row" style="padding:0 16px 10px"><input id="n-email" class="sel" style="flex:1" placeholder="nama@email.com (kayak WA pakai nomor, kita pakai email)" /><button class="btn-red" id="n-add" style="width:auto;padding:10px 14px">＋</button></div>
        <div class="empty"><div class="spin"></div></div>
      </div>
      ${navHTML('chats')}
    </section>`;
  const load = async (q = '') => {
    const r = await api(`/users?q=${encodeURIComponent(q)}`);
    const body = $('#n-body');
    body.innerHTML = `<div class="section-lbl">KONTAK DI XEROPHIS</div>` + r.users.map((u) => `
      <div class="conv" data-u="${esc(u.username)}">
        <div class="avatar" data-uid="${u.id}" style="background: radial-gradient(circle at 35% 30%, ${esc(u.avatarColor)}, #170405 70%)">${u.avatarUrl ? `<img class="av-img" src="${u.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />` : esc(u.avatarText)}${state.online.has(u.id) ? '<span class="dot"></span>' : ''}</div>
        <div class="meta"><div class="line1"><span class="name">${esc(u.displayName)}</span>${u.isBot ? '<span class="bot-tag">🤖 Bot</span>' : ''}</div>
        <div class="line2"><span class="preview">@${esc(u.username)} · ${esc(u.about)}</span></div></div>
      </div>`).join('') + `
      <div class="section-lbl">GRUP BARU</div>
      <div style="padding:0 16px 8px"><div class="field" style="margin:0"><input id="n-gtitle" placeholder="Nama grup baru…" /></div></div>`;
    body.querySelectorAll('.conv').forEach((el) => el.onclick = async () => {
      try { const r2 = await api('/conversations', { method: 'POST', body: { type: 'private', username: el.dataset.u } }); location.hash = `#/chat/${r2.conversationId}`; }
      catch (e) { toast(e.message, true); }
    });
    $('#n-gtitle').addEventListener('keydown', async (e) => {
      if (e.key !== 'Enter') return;
      const title = e.target.value.trim(); if (!title) return;
      try { const r2 = await api('/conversations', { method: 'POST', body: { type: 'group', title, members: [] } }); location.hash = `#/chat/${r2.conversationId}`; }
      catch (e2) { toast(e2.message, true); }
    });
  };
  load();
  $('#n-add').onclick = async () => {
    const email = $('#n-email').value.trim();
    if (!email) return;
    try {
      const r = await api('/conversations', { method: 'POST', body: { type: 'private', email } });
      location.hash = `#/chat/${r.conversationId}`;
    } catch (e) {
      if (String(e.message).includes('tidak ditemukan')) {
        toast('Belum terdaftar — mengirim undangan email…');
        try { const iv = await api('/invite', { method: 'POST', body: { email } }); toast(iv.dev || '📨 Undangan terkirim'); }
        catch (e2) { toast(e2.message, true); }
      } else toast(e.message, true);
    }
  };
  $('#n-search').addEventListener('input', (e) => load(e.target.value.trim()));
}

/* ---------- settings ---------- */
function renderSettings() {
  const me = state.me;
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top"><h1 style="font-size:22px">Settings</h1><span class="spacer"></span><button class="iconbtn" id="s-search">${icon('search')}</button></div>
      <div class="settings-body">
        <div class="profile-card">
          <div class="avatar lg" style="background: radial-gradient(circle at 35% 30%, ${esc(me.avatarColor)}, #170405 70%)">${me.avatarUrl ? `<img class="av-img" src="${me.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />` : esc(me.avatarText)}</div>
          <div style="flex:1"><div class="name">${esc(me.displayName)} ${me.verified ? icon('vcheck', 'sm vcheck') : ''} ${me.title ? `<span class="title-chip">${esc(me.title)}</span>` : ''} ${me.isAdmin ? `<span class="bot-tag">👑 ${esc(me.role)}</span>` : ''}</div><div class="about">${esc(me.email ? me.email + ' · ' : '')}${esc(me.about)}</div></div>
          <span style="color:var(--red)">${icon('qr')}</span>
        </div>
        <div class="menu-group">
          ${[['key', 'Akun', 'Notifikasi keamanan, ganti nomor'], ['shield', 'Privasi', 'Blokir kontak, pesan sementara'], ['palette', 'Avatar', 'Buat, edit, foto profil'], ['chat', 'Chat', 'Tema, wallpaper, riwayat chat'], ['bell', 'Notifikasi', 'Pesan, grup & nada dering panggilan'], ['db', 'Penyimpanan dan Data', 'Penggunaan jaringan, unduh otomatis']].map(([ic, lbl, sub]) => `
          <button class="menu-row" data-soon="${lbl}"><span class="ic">${icon(ic)}</span><span><span class="lbl">${lbl}</span><div class="sub">${sub}</div></span><span class="chev">›</span></button>`).join('')}
        </div>
        <div class="menu-group">
          <button class="menu-row" id="s-apk"><span class="ic">${icon('phone')}</span><span><span class="lbl">Download Aplikasi Android (.apk)</span><div class="sub">Biar jadi aplikasi beneran, bukan website</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="s-install"><span class="ic">${icon('plus')}</span><span><span class="lbl">Install sebagai Aplikasi</span><div class="sub">Pasang di HP: fullscreen tanpa address bar</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="s-push"><span class="ic">${icon('bell')}</span><span><span class="lbl">Notifikasi push</span><div class="sub">Terima pesan saat aplikasi tertutup</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="s-devices"><span class="ic">${icon('phone')}</span><span><span class="lbl">Perangkat tertaut</span><div class="sub">APK = utama · web = sesi tertaut (kayak WhatsApp Web)</div></span><span class="chev">›</span></button>
          <button class="menu-row" data-soon="Bantuan"><span class="ic">${icon('help')}</span><span><span class="lbl">Bantuan</span><div class="sub">Pusat bantuan, hubungi kami</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="s-invite"><span class="ic">${icon('users')}</span><span><span class="lbl">Undang teman</span><div class="sub">Bagikan Xerophis ke temanmu</div></span><span class="chev">›</span></button>
        </div>
        <div class="menu-group">
          <button class="menu-row danger" id="s-logout"><span class="ic">${icon('x')}</span><span class="lbl">Keluar</span></button>
        </div>
        <div style="text-align:center;color:var(--muted-2);font-size:11.5px;line-height:1.7;padding:8px 0 4px">
          <div style="color:var(--red);font-weight:800;font-size:15px">Xerophis</div>
          Xerophis Team Dev · v0.1.0<br/>Developed with ♥ by Pall<br/>All rights reserved.
        </div>
      </div>
      ${navHTML('settings')}
    </section>`;
  document.querySelectorAll('[data-soon]').forEach((b) => b.onclick = () => openSettings(b.dataset.soon));
  $('#s-search').onclick = () => { location.hash = '#/newchat'; };
  $('#s-devices').onclick = async () => {
    try {
      const { sessions } = await api('/sessions');
      openSheet([
        { ic: 'phone', lbl: 'Aplikasi utama = APK Android · web ini = perangkat tertaut (kayak WhatsApp Web)', fn: () => {} },
        ...sessions.map((s) => ({
          ic: (s.device || '').includes('APP') ? 'phone' : 'gear',
          lbl: `${s.device || 'Perangkat'} — ${new Date(s.created_at).toLocaleString('id-ID')}`,
          fn: async () => { try { await api(`/sessions/${s.token}`, { method: 'DELETE' }); toast('Perangkat dicabut'); } catch (e) { toast(e.message, true); } },
        })),
        { ic: 'x', lbl: 'Tutup', fn: () => {} },
      ]);
    } catch (e) { toast(e.message, true); }
  };
  $('#s-invite').onclick = () => { navigator.clipboard?.writeText('Yuk pakai Xerophis — messaging black/red premium! 🔥'); toast('Tautan undangan disalin'); };
  $('#s-apk').onclick = () => { location.href = '/xerophis.apk'; };
  $('#s-install').onclick = async () => {
    if (deferredInstall) { deferredInstall.prompt(); const r = await deferredInstall.userChoice; toast(r.outcome === 'accepted' ? '📲 Terpasang!' : 'Install dibatalkan'); deferredInstall = null; }
    else toast('Browser: menu ⋮ → "Tambahkan ke layar utama" / "Install app" (atau pakai APK di deploy/)');
  };
  $('#s-push').onclick = async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return toast('Browser tidak mendukung push', true);
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return toast('Izin notifikasi ditolak', true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const { publicKey } = await api('/push/vapid');
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToBytes(publicKey) });
      await api('/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } });
      toast('🔔 Notifikasi push aktif');
    } catch (e) { toast(e.message, true); }
  };
  $('#s-logout').onclick = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => {});
    state.token = ''; state.me = null; localStorage.removeItem('xerophis.token');
    try { state.ws?.close(); } catch {}
    location.hash = '#/login'; route();
  };
}

/* ---------- empty tabs ---------- */
function renderEmptyTab() {
  const which = routeName();
  const data = {
    updates: ['status', 'Updates', 'Bagikan momen kamu sebagai status. Fitur status/updates hadir di milestone berikutnya.'],
    communities: ['users', 'Communities', 'Satukan grup-grup kamu dalam satu komunitas. Segera hadir.'],
    calls: ['phone', 'Calls', 'Riwayat panggilan suara & video terenkripsi. Segera hadir.'],
  }[which];
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top"><h1 style="font-size:22px">${data[1]}</h1></div>
      <div class="empty"><div class="ring">${icon(data[0])}</div><h3>${data[1]}</h3><p>${data[2]}</p></div>
      ${navHTML(which)}
    </section>`;
}

/* ---------- panel admin tersembunyi (#/admin, trigger: "kingpall") ---------- */
let admTab = 'ringkasan';
const TAGS = ['Prospek', 'Lunas', 'Komplain', 'VIP'];
const ROLES = ['member', 'agent', 'moderator', 'keuangan', 'super', 'owner'];

async function renderAdmin() {
  if (!state.me.isAdmin) {
    $('#view').innerHTML = `
      <section class="screen active">
        <div class="top"><button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button><h1 style="font-size:19px">403</h1></div>
        <div class="empty"><div class="ring">${icon('shield')}</div><h3>Akses ditolak</h3><p>Halaman ini tidak terdaftar untuk akun kamu.</p></div>
      </section>`;
    return;
  }
  const tabs = [['ringkasan', 'Ringkasan'], ['inbox', 'Inbox'], ['users', 'Pengguna'], ['msgs', 'Pesan'], ['siaran', 'Siaran'], ['otomasi', 'Otomasi'], ['analitik', 'Analitik'], ['sistem', 'Sistem'], ['logs', 'Log']];
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top">
        <button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button>
        <span style="color:var(--red)">${icon('crown')}</span>
        <h1 style="font-size:19px">King Panel</h1>
        <span class="spacer"></span>
        <span class="bot-tag">👑 ${esc(state.me.role)}</span>
      </div>
      <div class="chips" id="adm-tabs">${tabs.map(([id, lbl]) => `<button class="chip ${admTab === id ? 'active' : ''}" data-t="${id}">${lbl}</button>`).join('')}</div>
      <div class="settings-body" id="adm-body"></div>
    </section>`;
  $('#adm-tabs').querySelectorAll('.chip').forEach((c) => c.onclick = () => { admTab = c.dataset.t; renderAdmin(); });
  await admLoad();
}

async function admLoad() {
  const body = $('#adm-body'); if (!body) return;
  body.innerHTML = '<div class="empty"><div class="spin"></div></div>';
  try {
    if (admTab === 'ringkasan') {
      const r = await api('/admin/stats');
      const s = r.stats;
      body.innerHTML = `
        <div class="stat-grid">
          ${[['Pengguna', s.users, 'users'], ['Online', s.online, 'broadcast'], ['Percakapan', s.conversations, 'chat'], ['Pesan', s.messages, 'edit'], ['Admin', s.admins, 'crown'], ['Sesi', s.sessions, 'key']].map(([l, v, ic]) => `
          <div class="stat-card"><span class="ic">${icon(ic)}</span><div class="v">${v}</div><div class="l">${l}</div></div>`).join('')}
        </div>
        <div class="menu-group">${(r.perms || []).map((p) => `<span class="perm-chip">${esc(p)}</span>`).join('')}</div>
        <div class="menu-group">
          <button class="menu-row" id="adm-shift"><span class="ic">${icon('bell')}</span><span><span class="lbl">Status agen saya</span><div class="sub">Sekarang: ${esc(state.me.agentStatus)}</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="adm-quick-broadcast"><span class="ic">${icon('broadcast')}</span><span><span class="lbl">Kirim / jadwalkan siaran</span></span><span class="chev">›</span></button>
        </div>
        <div class="menu-group">
          <div class="menu-row"><span class="ic">${icon('help')}</span><span><span class="lbl">Roadmap (tak berlaku di app standalone)</span><div class="sub">Anti-ban rotasi nomor, integrasi WooCommerce/Shopify, CSAT survei, revenue tracking, interactive message builder</div></span></div>
        </div>`;
      $('#adm-shift').onclick = async () => {
        const order = ['online', 'shift', 'offline'];
        const next = order[(order.indexOf(state.me.agentStatus) + 1) % order.length];
        await api(`/admin/users/${state.me.id}`, { method: 'PATCH', body: { agentStatus: next } });
        state.me.agentStatus = next; toast(`Status agen: ${next}`); admLoad();
      };
      $('#adm-quick-broadcast').onclick = () => { admTab = 'siaran'; renderAdmin(); };
    }
    if (admTab === 'inbox') {
      const { conversations } = await api('/admin/conversations');
      body.innerHTML = `
        <div class="searchbar" style="margin:0 0 10px">${icon('search', 'sm')}<input id="ibx-q" placeholder="Filter inbox…" /></div>
        <div id="ibx-list"></div>`;
      const paint = (list) => {
        $('#ibx-list').innerHTML = list.map((c) => `
          <div class="menu-group" style="margin-bottom:8px"><button class="menu-row" data-open="${c.id}">
            <span class="ic">${icon(c.type === 'group' ? 'users' : 'chat')}</span>
            <span style="flex:1;min-width:0;text-align:left"><span class="lbl">${esc(c.label || c.title || `#${c.id}`)}</span>
            <div class="sub">${c.msgs} pesan · ${c.assignedName ? `➜ ${esc(c.assignedName)}` : 'belum_assigned'}</div></span>
            ${c.tag ? `<span class="tag-chip">${esc(c.tag)}</span>` : ''}
          </button></div>`).join('') || '<div class="empty"><p>Inbox kosong.</p></div>';
        $('#ibx-list').querySelectorAll('[data-open]').forEach((b) => b.onclick = () => admInbox(Number(b.dataset.open)));
      };
      paint(conversations);
      $('#ibx-q').addEventListener('input', (e) => paint(conversations.filter((c) => (c.label || '').toLowerCase().includes(e.target.value.toLowerCase()))));
    }
    if (admTab === 'users') {
      body.innerHTML = `
        <div class="searchbar" style="margin:0 0 10px">${icon('search', 'sm')}<input id="adm-uq" placeholder="Cari pengguna…" /></div>
        <button class="btn-red" id="adm-uadd" style="margin-bottom:12px">+ Tambah pengguna</button>
        <div id="adm-ulist"></div>`;
      const loadU = async (q = '') => {
        const { users } = await api(`/admin/users?q=${encodeURIComponent(q)}`);
        $('#adm-ulist').innerHTML = users.map((u) => `
          <div class="menu-group" style="margin-bottom:8px">
            <div class="menu-row">
              <div class="avatar" style="width:40px;height:40px;font-size:13px;background:radial-gradient(circle at 35% 30%, ${esc(u.avatarColor)}, #170405 70%)">${esc(u.avatarText)}</div>
              <span style="flex:1;min-width:0">
                <span class="lbl">${esc(u.displayName)} ${u.verified ? icon('vcheck', 'sm vcheck') : ''} ${u.title ? `<span class="title-chip">${esc(u.title)}</span>` : ''} <span class="bot-tag">${esc(u.role)}</span> ${u.isBot ? '<span class="bot-tag"> Bot</span>' : ''} ${u.blocked ? '<span class="tag-chip">diblokir</span>' : ''} ${u.flagged ? '<span class="tag-chip">spam</span>' : ''}</span>
                <div class="sub">@${esc(u.username)} · ${esc(u.about)}</div>
              </span>
              <button class="iconbtn" data-act="${u.id}">${icon('gear', 'sm')}</button>
            </div>
          </div>`).join('') || '<div class="empty"><p>Tidak ada pengguna.</p></div>';
        $('#adm-ulist').querySelectorAll('[data-act]').forEach((b) => b.onclick = () => {
          const u = users.find((x) => x.id === Number(b.dataset.act));
          openSheet([
            { ic: 'edit', lbl: 'Edit profil / role / CRM', fn: () => admEditUser(u) },
            { ic: 'vcheck', lbl: u.verified ? 'Hapus centang verifikasi' : 'Beri centang verifikasi', fn: async () => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { verified: !u.verified } }); toast('✔ tersimpan'); admLoad(); } },
            { ic: 'shield', lbl: u.blocked ? 'Buka blokir' : 'Blokir (blacklist)', fn: async () => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { blocked: !u.blocked } }); toast(u.blocked ? 'Blokir dibuka' : 'Diblokir'); admLoad(); } },
            { ic: 'bolt', lbl: u.flagged ? 'Bersihkan tanda spam' : 'Tandai spam', fn: async () => { await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { flagged: !u.flagged } }); admLoad(); } },
            { ic: 'trash', lbl: 'Hapus pengguna', danger: true, fn: () => confirmSheet(`Hapus @${u.username}? Semua pesan & chat ikut terhapus.`, async () => { await api(`/admin/users/${u.id}`, { method: 'DELETE' }); toast('Pengguna dihapus'); admLoad(); }) },
          ]);
        });
      };
      loadU();
      $('#adm-uq').addEventListener('input', (e) => loadU(e.target.value.trim()));
      $('#adm-uadd').onclick = () => admEditUser(null);
    }
    if (admTab === 'msgs') {
      const [{ messages }, { filters }] = await Promise.all([api('/admin/messages'), api('/admin/filters')]);
      body.innerHTML = `
        <div class="row" style="margin-bottom:10px"><input id="flt-in" placeholder="Tambah kata terlarang…" style="flex:1;background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px" />
        <button class="btn-outline" id="flt-add" style="width:auto;padding:10px 14px">+ Filter</button></div>
        <div class="menu-group" style="margin-bottom:12px">${filters.map((f) => `<span class="tag-chip" data-fd="${f.id}" style="cursor:pointer">♥ ${esc(f.word)} ✕</span>`).join('') || '<div class="sub" style="padding:10px">Belum ada filter kata.</div>'}</div>
        ${messages.map((m) => `
        <div class="menu-group" style="margin-bottom:8px">
          <div class="menu-row">
            <span style="flex:1;min-width:0"><span class="lbl">${esc(m.sender_name)} <span class="sub">→ ${esc(m.conv_type === 'group' ? (m.conv_title || `#${m.conversation_id}`) : `privat #${m.conversation_id}`)}</span></span>
            <div class="sub">${esc(m.body.slice(0, 90))} · ${fmtTime(m.createdAt)}</div></span>
            ${m.kind === 'text' ? `<button class="iconbtn" data-del="${m.id}">${icon('trash', 'sm')}</button>` : ''}
          </div>
        </div>`).join('') || '<div class="empty"><p>Tidak ada pesan.</p></div>'}`;
      $('#flt-add').onclick = async () => { const w = $('#flt-in').value.trim(); if (!w) return; await api('/admin/filters', { method: 'POST', body: { word: w } }); toast('Filter aktif'); admLoad(); };
      body.querySelectorAll('[data-fd]').forEach((t) => t.onclick = async () => { await api(`/admin/filters/${t.dataset.fd}`, { method: 'DELETE' }); admLoad(); });
      body.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirmSheet('Hapus pesan ini (moderasi)?', async () => { await api(`/admin/messages/${b.dataset.del}`, { method: 'DELETE' }); toast('Pesan dihapus'); admLoad(); }));
    }
    if (admTab === 'siaran') {
      const { broadcasts } = await api('/admin/broadcasts');
      body.innerHTML = `
        <div class="field"><label>Teks siaran / pengumuman</label><textarea id="adm-btext" rows="3" class="ta"></textarea></div>
        <div class="row" style="margin-bottom:10px">
          <select id="adm-btarget" class="sel"><option value="all">Semua pengguna</option><option value="admins">Admin saja</option><option value="agents">Agen saja</option>${TAGS.map((t) => `<option value="tag:${t}">Segmen: tag ${t}</option>`).join('')}</select>
          <input id="adm-bwhen" type="datetime-local" class="sel" style="flex:1" />
        </div>
        <div class="row"><button class="btn-red" id="adm-bsend" style="flex:1">Kirim sekarang</button><button class="btn-outline" id="adm-bsched" style="flex:1">Jadwalkan</button></div>
        <div class="section-lbl" style="padding-left:0">PENGUMUMAN DARURAT (banner semua layar)</div>
        <div class="row"><input id="adm-ann" class="sel" style="flex:1" placeholder="Teks banner…" value="${esc(state.announcement || '')}" /><button class="btn-outline" id="adm-annset" style="width:auto;padding:10px 14px">Set</button></div>
        <div class="section-lbl" style="padding-left:0">RIWAYAT & LAPORAN PENGIRIMAN</div>
        ${broadcasts.map((b) => `
          <div class="menu-group" style="margin-bottom:8px"><div class="menu-row">
            <span class="ic">${icon('broadcast')}</span>
            <span style="flex:1"><span class="lbl">${esc(b.text.slice(0, 60))}</span>
            <div class="sub">${b.status === 'scheduled' ? `⏰ terjadwal ${String(b.send_at).replace('T', ' ').slice(0, 16)}` : `✓ terkirim ${b.sent_count} · dibaca ${b.read_count}`} · target ${esc(b.target)}</div></span>
          </div></div>`).join('') || '<div class="empty"><p>Belum ada siaran.</p></div>'}`;
      $('#adm-bsend').onclick = async () => { const t = $('#adm-btext').value.trim(); if (!t) return toast('Teks kosong', true); const r = await api('/admin/broadcast', { method: 'POST', body: { text: t, target: $('#adm-btarget').value } }); toast(`📢 terkirim ke ${r.count} pengguna`); admLoad(); };
      $('#adm-bsched').onclick = async () => { const t = $('#adm-btext').value.trim(); const w = $('#adm-bwhen').value; if (!t || !w) return toast('Isi teks & jadwal', true); await api('/admin/broadcast', { method: 'POST', body: { text: t, target: $('#adm-btarget').value, sendAt: new Date(w).toISOString() } }); toast('⏰ siaran dijadwalkan'); admLoad(); };
      $('#adm-annset').onclick = async () => { await api('/admin/announce', { method: 'POST', body: { text: $('#adm-ann').value.trim() } }); toast('Banner diset'); };
    }
    if (admTab === 'otomasi') {
      const [{ rules }, { quick }, { url }] = await Promise.all([api('/admin/autorules'), api('/admin/quickreplies'), api('/admin/webhook')]);
      body.innerHTML = `
        <div class="section-lbl" style="padding-left:0">AUTO-REPLY KEYWORD (bot)</div>
        <div class="row" style="margin-bottom:8px"><input id="ar-k" class="sel" placeholder="keyword" style="flex:1" /><input id="ar-r" class="sel" placeholder="balasan" style="flex:2" /><button class="btn-outline" id="ar-add" style="width:auto;padding:10px">+</button></div>
        ${rules.map((r) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span style="flex:1"><span class="lbl">"${esc(r.keyword)}"</span><div class="sub">→ ${esc(r.reply)}</div></span><button class="iconbtn" data-ard="${r.id}">${icon('trash', 'sm')}</button></div></div>`).join('')}
        <div class="section-lbl" style="padding-left:0">QUICK REPLIES (tombol ⚡ di composer admin)</div>
        <div class="row" style="margin-bottom:8px"><input id="qr-t" class="sel" placeholder="judul" style="flex:1" /><input id="qr-b" class="sel" placeholder="isi template" style="flex:2" /><button class="btn-outline" id="qr-add" style="width:auto;padding:10px">+</button></div>
        ${quick.map((q) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span style="flex:1"><span class="lbl">${esc(q.title)}</span><div class="sub">${esc(q.body)}</div></span><button class="iconbtn" data-qrd="${q.id}">${icon('trash', 'sm')}</button></div></div>`).join('')}
        <div class="section-lbl" style="padding-left:0">WEBHOOK (event message.new)</div>
        <div class="row"><input id="wh-url" class="sel" style="flex:1" value="${esc(url || '')}" placeholder="https://…/hook" /><button class="btn-outline" id="wh-save" style="width:auto;padding:10px">Simpan</button><button class="btn-outline" id="wh-test" style="width:auto;padding:10px">Test</button></div>`;
      $('#ar-add').onclick = async () => { await api('/admin/autorules', { method: 'POST', body: { keyword: $('#ar-k').value.trim(), reply: $('#ar-r').value.trim() } }); admLoad(); };
      body.querySelectorAll('[data-ard]').forEach((b) => b.onclick = async () => { await api(`/admin/autorules/${b.dataset.ard}`, { method: 'DELETE' }); admLoad(); });
      $('#qr-add').onclick = async () => { await api('/admin/quickreplies', { method: 'POST', body: { title: $('#qr-t').value.trim(), body: $('#qr-b').value.trim() } }); admLoad(); };
      body.querySelectorAll('[data-qrd]').forEach((b) => b.onclick = async () => { await api(`/admin/quickreplies/${b.dataset.qrd}`, { method: 'DELETE' }); admLoad(); });
      $('#wh-save').onclick = async () => { await api('/admin/webhook', { method: 'POST', body: { url: $('#wh-url').value.trim() } }); toast('Webhook disimpan'); };
      $('#wh-test').onclick = async () => { try { const r = await api('/admin/webhook/test', { method: 'POST' }); toast(`Webhook OK (HTTP ${r.status})`); } catch (e) { toast(e.message, true); } };
    }
    if (admTab === 'analitik') {
      const { analytics } = await api('/analytics');
      const max = Math.max(1, ...analytics.perHour);
      body.innerHTML = `
        <div class="section-lbl" style="padding-left:0">TRAFFIC 24 JAM (pesan per jam)</div>
        <div class="bars">${analytics.perHour.map((n, h) => `<div class="bar" title="${h}:00 = ${n}"><i style="height:${Math.round((n / max) * 100)}%"></i><span>${h % 6 === 0 ? h : ''}</span></div>`).join('')}</div>
        <div class="section-lbl" style="padding-left:0">KINERJA AGEN / BOT</div>
        ${analytics.agents.map((a) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span class="ic">${icon('user')}</span><span style="flex:1"><span class="lbl">${esc(a.display_name)} <span class="bot-tag">${esc(a.role)}</span></span><div class="sub">${a.messages_sent} pesan · ${a.assigned} chat dipegang · status ${esc(a.agent_status)}</div></span></div></div>`).join('')}
        <div class="section-lbl" style="padding-left:0">REVENUE & TRANSAKSI</div>
        <div class="menu-group" style="margin-bottom:12px"><div class="menu-row"><span class="ic">${icon('star')}</span><span><span class="lbl" style="color:var(--red)">Rp${Number(analytics.revenue.total).toLocaleString('id-ID')}</span><div class="sub">${analytics.revenue.n} transaksi tercatat</div></span></div></div>
        <div class="section-lbl" style="padding-left:0">CSAT & KECEPATAN RESPON</div>
        ${analytics.csat.map((c) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span class="ic">${icon('smile')}</span><span style="flex:1"><span class="lbl">${esc(c.agent || 'tanpa agen')} — ⭐ ${c.avg}</span><div class="sub">${c.n} penilaian</div></span></div></div>`).join('') || '<div class="sub" style="margin-bottom:6px">Belum ada penilaian CSAT.</div>'}
        ${analytics.response.map((r) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span class="ic">${icon('clock')}</span><span style="flex:1"><span class="lbl">${esc(r.agent)}</span><div class="sub">rata-rata balas ${r.avgMin} menit (${r.n} respon)</div></span></div></div>`).join('') || '<div class="sub">Belum ada data respon.</div>'}
        <div class="section-lbl" style="padding-left:0">TAG PERCAKAPAN</div>
        ${analytics.tagCounts.map((t) => `<span class="tag-chip">${esc(t.tag)} × ${t.n}</span>`).join('') || '<div class="sub">Belum ada tag.</div>'}`;
    }
    if (admTab === 'sistem') {
      const [{ system }, { sessions }] = await Promise.all([api('/admin/system'), api('/admin/sessions')]);
      const mb = (b) => `${(b / 1048576).toFixed(1)} MB`;
      body.innerHTML = `
        <div class="stat-grid">
          <div class="stat-card"><span class="ic">${icon('db')}</span><div class="v" style="font-size:14px">${mb(system.dbSize)}</div><div class="l">Ukuran DB</div></div>
          <div class="stat-card"><span class="ic">${icon('key')}</span><div class="v" style="font-size:14px">${mb(system.memory.rss)}</div><div class="l">Memori RSS</div></div>
          <div class="stat-card"><span class="ic">${icon('clock')}</span><div class="v" style="font-size:14px">${Math.round(system.uptimeSec / 60)}m</div><div class="l">Uptime</div></div>
        </div>
        <div class="menu-group"><div class="menu-row"><span class="ic">${icon('gear')}</span><span><span class="lbl">Node ${esc(system.node)} · ${system.cpus} CPU · pid ${system.pid}</span><div class="sub">${esc(system.hostname)} · heap ${mb(system.memory.heapUsed)}/${mb(system.memory.heapTotal)}</div></span></div></div>
        <div class="section-lbl" style="padding-left:0">LOG ERROR REALTIME</div>
        <div class="menu-group" style="margin-bottom:12px">${system.errors.slice(0, 8).map((e) => `<div class="menu-row"><span class="sub" style="font-family:monospace">${esc(e.at.slice(11, 19))} ${esc(e.message)}</span></div>`).join('') || '<div class="sub" style="padding:10px">Tidak ada error. ✅</div>'}</div>
        <div class="row" style="margin-bottom:12px">
          <button class="btn-outline" id="sys-backup" style="flex:1">⬇ Backup JSON</button>
          <button class="btn-outline" id="sys-csv" style="flex:1">⬇ Kontak CSV</button>
        </div>
        <div class="field"><label>Impor kontak (CSV: username,display_name,phone,about)</label><textarea id="sys-imp" rows="3" class="ta" placeholder="budi,Budi Santoso,+62…,Halo"></textarea></div>
        <button class="btn-red" id="sys-impor" style="margin-bottom:12px">Impor</button>
        <div class="section-lbl" style="padding-left:0">ANTI-BAN ROTATION & OTOMASI SISTEM</div>
        <div id="sys-set"></div>
        <div class="row" style="margin-bottom:12px">
          <button class="btn-outline" id="sys-bk-run" style="flex:1"> Backup sekarang</button>
        </div>
        <div id="sys-bk-list"></div>
        <div class="section-lbl" style="padding-left:0">SESI TERHUBUNG (multi-device control)</div>
        ${sessions.map((s) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span class="ic">${icon('phone')}</span><span style="flex:1"><span class="lbl">${esc(s.display_name)} <span class="sub">@${esc(s.username)}</span></span><div class="sub">${esc(s.token.slice(0, 8))}… · ${new Date(s.created_at).toLocaleString('id-ID')}</div></span><button class="iconbtn" data-sd="${esc(s.token)}">${icon('x', 'sm')}</button></div></div>`).join('')}`;
      $('#sys-backup').onclick = async () => { const r = await fetch('/api/admin/backup', { headers: { Authorization: `Bearer ${state.token}`, 'x-admin-pin': state.pin || '' } }); const blob = await r.blob(); dl(blob, 'xerophis-backup.json'); };
      $('#sys-csv').onclick = async () => { const r = await fetch('/api/admin/export/users.csv', { headers: { Authorization: `Bearer ${state.token}`, 'x-admin-pin': state.pin || '' } }); dl(await r.blob(), 'xerophis-contacts.csv'); };
      $('#sys-impor').onclick = async () => { const r = await api('/admin/import/users', { method: 'POST', body: { csv: $('#sys-imp').value } }); toast(`Impor: +${r.created}, skip ${r.skipped}`); };
      body.querySelectorAll('[data-sd]').forEach((b) => b.onclick = () => confirmSheet('Cabut sesi ini?', async () => { await api(`/admin/sessions/${encodeURIComponent(b.dataset.sd)}`, { method: 'DELETE' }); toast('Sesi dicabut'); admLoad(); }));
      const { settings } = await api('/admin/settings');
      $('#sys-set').innerHTML = `
        <div class="menu-group" style="margin-bottom:8px;padding:10px">
          <label class="row" style="margin-bottom:8px"><input type="checkbox" id="st-bl" ${settings.blockLinks ? 'checked' : ''} style="accent-color:var(--red)" /> Blokir tautan (anti-phising) untuk non-admin</label>
          <label class="row" style="margin-bottom:8px"><input type="checkbox" id="st-bh" ${settings.businessHours?.enabled ? 'checked' : ''} style="accent-color:var(--red)" /> Auto-reply di luar jam kerja</label>
          <div class="row" style="margin-bottom:8px"><input id="st-bs" type="time" class="sel" value="${esc(settings.businessHours?.start || '08:00')}" /><input id="st-be" type="time" class="sel" value="${esc(settings.businessHours?.end || '17:00')}" /></div>
          <div class="field" style="margin:0 0 8px"><label>Teks balasan luar jam kerja</label><input id="st-br" class="sel" style="width:100%" value="${esc(settings.businessHours?.reply || '')}" placeholder="Kami di luar jam kerja…" /></div>
          <div class="field" style="margin:0"><label>Pool rotasi pengirim siaran — anti-ban (username dipisah koma)</label><input id="st-rp" class="sel" style="width:100%" value="${esc((settings.rotationPool || []).join(', '))}" placeholder="xerophis, +000999" /></div>
        </div>
        <button class="btn-red" id="st-save" style="margin-bottom:12px">Simpan setelan sistem</button>`;
      $('#st-save').onclick = async () => {
        await api('/admin/settings', { method: 'POST', body: {
          blockLinks: $('#st-bl').checked,
          businessHours: { enabled: $('#st-bh').checked, start: $('#st-bs').value, end: $('#st-be').value, reply: $('#st-br').value.trim() },
          rotationPool: $('#st-rp').value.split(',').map((s) => s.trim()).filter(Boolean),
        } });
        toast('Setelan sistem tersimpan');
      };
      const loadBk = async () => { const { backups } = await api('/admin/backups'); $('#sys-bk-list').innerHTML = backups.slice(0, 6).map((b) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span class="ic">${icon('db')}</span><span style="flex:1"><span class="lbl" style="font-size:12px;font-family:monospace">${esc(b.name)}</span><div class="sub">${(b.size / 1024).toFixed(1)} KB · otomatis tiap 6 jam</div></span></div></div>`).join(''); };
      $('#sys-bk-run').onclick = async () => { await api('/admin/backup/run', { method: 'POST' }); toast('Backup ditulis'); loadBk(); };
      loadBk();
    }
    if (admTab === 'logs') {
      const { logs } = await api('/admin/logs');
      body.innerHTML = logs.map((l) => `
        <div class="menu-group" style="margin-bottom:8px"><div class="menu-row">
          <span class="ic">${icon('db')}</span>
          <span style="flex:1"><span class="lbl" style="font-family:monospace;font-size:13px">${esc(l.action)}</span>
          <div class="sub">${esc(l.admin_name || 'sistem')} · ${esc(l.target)} · ${fmtTime(l.created_at)}</div></span>
        </div></div>`).join('') || '<div class="empty"><p>Belum ada aksi admin.</p></div>';
    }
  } catch (e) { body.innerHTML = `<div class="empty"><p>${esc(e.message)}</p></div>`; }
}
function dl(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

/* ---------- inbox viewer: unified inbox + handover + notes + pin ---------- */
async function admInbox(id) {
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet" style="max-height:92%"><div class="grab"></div><div id="ibx"></div></div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  const load = async () => {
    const [{ messages, notes }, { conversations }, { users }] = await Promise.all([
      api(`/admin/conversations/${id}/messages`), api('/admin/conversations'), api('/admin/users')]);
    const c = conversations.find((x) => x.id === id);
    const admins = users.filter((u) => u.isAdmin);
    $('#ibx').innerHTML = `
      <h3>${esc(c?.label || `#${id}`)} ${c?.tag ? `<span class="tag-chip">${esc(c.tag)}</span>` : ''}</h3>
      <div class="row" style="margin:6px 0 10px;flex-wrap:wrap">
        <select id="ibx-assign" class="sel" style="flex:1"><option value="">— belum ditugaskan —</option>${admins.map((a) => `<option value="${a.id}" ${c?.assignedTo === a.id ? 'selected' : ''}>${esc(a.displayName)}</option>`).join('')}</select>
        <select id="ibx-tag" class="sel" style="flex:1"><option value="">— tag —</option>${TAGS.map((t) => `<option ${c?.tag === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
      </div>
      <div style="max-height:34vh;overflow-y:auto;display:flex;flex-direction:column;gap:6px;margin-bottom:10px">
        ${messages.map((m) => `<div class="msgrow ${m.senderId === state.me.id ? 'out' : ''}" style="position:static"><div class="bubble" style="animation:none"><div class="sender">${esc(m.senderName)} ${m.pinned ? '📌' : ''}</div><div class="body">${esc(m.body)}</div><div class="tail"><span class="t">${fmtTime(m.createdAt)}</span> <button class="iconbtn" data-pin="${m.id}" data-p="${m.pinned ? 0 : 1}" style="padding:2px">${icon('star', 'sm')}</button></div></div></div>`).join('') || '<div class="sub">Kosong.</div>'}
      </div>
      <div class="row" style="margin-bottom:6px"><input id="ibx-reply" class="sel" style="flex:1" placeholder="Balas sebagai admin…" /><button class="micbtn" id="ibx-send" style="width:40px;height:40px">${icon('send', 'sm')}</button></div>
      <div class="row" style="margin-bottom:10px"><input id="ibx-btns" class="sel" style="flex:1" placeholder="🧩 Tombol interaktif (pisahkan dgn |) cth: Beli Sekarang|Lihat Katalog" /><button class="btn-outline" id="ibx-csat" style="width:auto;padding:10px">⭐ CSAT</button></div>
      <div class="section-lbl" style="padding-left:0">CATATAN INTERNAL (hanya admin)</div>
      ${notes.map((n) => `<div class="menu-group" style="margin-bottom:6px"><div class="menu-row"><span style="flex:1"><span class="sub"><b>${esc(n.admin_name || '?')}</b>: ${esc(n.body)}</span></span><button class="iconbtn" data-nd="${n.id}">${icon('x', 'sm')}</button></div></div>`).join('')}
      <div class="row"><input id="ibx-note" class="sel" style="flex:1" placeholder="Tulis catatan internal…" /><button class="btn-outline" id="ibx-noteadd" style="width:auto;padding:10px">+</button></div>`;
    $('#ibx-assign').onchange = async (e) => { await api(`/admin/conversations/${id}/assign`, { method: 'POST', body: { adminId: Number(e.target.value) || 0 } }); toast('🤝 Chat ditransfer'); };
    $('#ibx-tag').onchange = async (e) => { await api(`/admin/conversations/${id}/tag`, { method: 'POST', body: { tag: e.target.value } }); toast('Tag disimpan'); };
    $('#ibx').querySelectorAll('[data-pin]').forEach((b) => b.onclick = async () => { await api(`/admin/messages/${b.dataset.pin}/pin`, { method: 'POST', body: { pinned: Number(b.dataset.p) } }); toast(Number(b.dataset.p) ? '📌 disematkan' : 'pin dilepas'); load(); });
    const send = async () => {
      const t = $('#ibx-reply').value.trim(); if (!t) return;
      const buttons = $('#ibx-btns').value.split('|').map((s) => s.trim()).filter(Boolean).map((label) => ({ label }));
      await api(`/admin/conversations/${id}/reply`, { method: 'POST', body: { body: t, buttons: buttons.length ? buttons : undefined } });
      $('#ibx-reply').value = ''; $('#ibx-btns').value = ''; load();
    };
    $('#ibx-send').onclick = send;
    $('#ibx-csat').onclick = async () => { await api(`/admin/conversations/${id}/csat`, { method: 'POST' }); toast('⭐ Survei CSAT terkirim'); load(); };
    $('#ibx-reply').addEventListener('keydown', (e) => e.key === 'Enter' && send());
    $('#ibx-noteadd').onclick = async () => { const t = $('#ibx-note').value.trim(); if (!t) return; await api(`/admin/conversations/${id}/notes`, { method: 'POST', body: { body: t } }); load(); };
    $('#ibx').querySelectorAll('[data-nd]').forEach((b) => b.onclick = async () => { await api(`/admin/notes/${b.dataset.nd}`, { method: 'DELETE' }); load(); });
  };
  load();
}

function admEditUser(u) {
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet"><div class="grab"></div>
    <h3>${u ? `Edit @${esc(u.username)}` : 'Tambah pengguna'}</h3>
    ${u ? '' : '<div class="field"><label>Username</label><input id="ae-user" /></div>'}
    ${u ? '' : '<div class="field"><label>Password awal</label><input id="ae-pass" type="text" placeholder="min. 4 karakter" /></div>'}
    <div class="field"><label>Nama tampilan</label><input id="ae-name" value="${u ? esc(u.displayName) : ''}" /></div>
    <div class="field"><label>Tentang</label><input id="ae-about" value="${u ? esc(u.about) : ''}" /></div>
    <div class="field"><label>Catatan CRM (internal)</label><input id="ae-crm" value="${u ? esc(u.crmNote || '') : ''}" placeholder="riwayat pembelian, dll" /></div>
    <div class="field"><label>Kolom kustom CRM (per baris: label=nilai)</label><textarea id="ae-cf" rows="2" class="ta" placeholder="tanggal_lahir=1999-01-01&#10;alamat=Bandung">${u ? esc(Object.entries(u.customFields || {}).map(([k, v]) => `${k}=${v}`).join('\n')) : ''}</textarea></div>
    <div class="row" style="margin-bottom:10px"><div class="field" style="flex:1;margin:0"><label>Jadwal shift mulai</label><input id="ae-shs" type="time" value="${esc(u?.shiftStart || '')}" /></div><div class="field" style="flex:1;margin:0"><label>Selesai</label><input id="ae-she" type="time" value="${esc(u?.shiftEnd || '')}" /></div></div>
    <div class="field"><label>Title khusus (badge profil)</label><input id="ae-title" value="${u ? esc(u.title) : ''}" placeholder="cth: Developer Xerophis" /></div>
    ${u ? `<div class="section-lbl" style="padding-left:0">TRANSAKSI (revenue tracking)</div>
    <div class="row" style="margin-bottom:6px"><input id="ae-tr-amt" class="sel" inputmode="numeric" placeholder="Nominal (Rp)" style="flex:1" /><input id="ae-tr-note" class="sel" placeholder="catatan" style="flex:1" /><button class="btn-outline" id="ae-tr-add" style="width:auto;padding:10px">+</button></div>
    <div id="ae-tr-list"></div>` : ''}
    <div class="field"><label>Role hierarchy</label><select id="ae-role" class="sel">${ROLES.map((r) => `<option ${u?.role === r ? 'selected' : ''}>${r}</option>`).join('')}</select></div>
    <label style="display:flex;gap:10px;align-items:center;margin:6px 0;color:var(--muted);font-size:14px"><input type="checkbox" id="ae-admin" ${u?.isAdmin ? 'checked' : ''} style="accent-color:var(--red);width:18px;height:18px" /> Akses panel admin</label>
    <label style="display:flex;gap:10px;align-items:center;margin:6px 0 14px;color:var(--muted);font-size:14px"><input type="checkbox" id="ae-ver" ${u?.verified ? 'checked' : ''} style="accent-color:var(--red);width:18px;height:18px" /> Centang verifikasi ✔</label>
    <button class="btn-red" id="ae-save">Simpan</button>
  </div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  const parseCF = () => {
    const cf = {};
    for (const line of $('#ae-cf').value.split('\n')) {
      const i = line.indexOf('=');
      if (i > 0) cf[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    }
    return cf;
  };
  if (u) {
    const loadTr = async () => {
      const { transactions } = await api(`/admin/transactions?userId=${u.id}`);
      const total = transactions.reduce((n, t) => n + Number(t.amount), 0);
      $('#ae-tr-list').innerHTML = `<div class="sub" style="margin-bottom:6px">Total: <b style="color:var(--red)">Rp${total.toLocaleString('id-ID')}</b></div>` +
        transactions.map((t) => `<div class="sub" style="padding:3px 0">Rp${Number(t.amount).toLocaleString('id-ID')} — ${esc(t.note || '')} <span style="color:var(--muted-2)">(${fmtTime(t.created_at)})</span></div>`).join('');
    };
    $('#ae-tr-add').onclick = async () => {
      try { await api('/admin/transactions', { method: 'POST', body: { userId: u.id, amount: Number($('#ae-tr-amt').value), note: $('#ae-tr-note').value.trim() } }); $('#ae-tr-amt').value = ''; $('#ae-tr-note').value = ''; loadTr(); } catch (e) { toast(e.message, true); }
    };
    loadTr();
  }
  $('#ae-save').onclick = async () => {
    try {
      if (u) {
        await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { displayName: $('#ae-name').value.trim(), about: $('#ae-about').value.trim(), crmNote: $('#ae-crm').value.trim(), customFields: parseCF(), title: $('#ae-title').value.trim(), role: $('#ae-role').value, isAdmin: $('#ae-admin').checked, verified: $('#ae-ver').checked, shiftStart: $('#ae-shs').value, shiftEnd: $('#ae-she').value } });
        toast('Perubahan disimpan');
      } else {
        await api('/admin/users', { method: 'POST', body: { username: $('#ae-user').value.trim(), password: $('#ae-pass').value, displayName: $('#ae-name').value.trim() || undefined, about: $('#ae-about').value.trim() || undefined, isAdmin: $('#ae-admin').checked, role: $('#ae-role').value } });
        toast('Pengguna dibuat');
      }
      closeSheet(); admLoad();
    } catch (e) { toast(e.message, true); }
  };
}

function confirmSheet(text, fn) {
  openSheet([
    { ic: 'trash', lbl: text, danger: true, fn },
    { ic: 'x', lbl: 'Batal', fn: () => {} },
  ]);
}
/* ---------- sub-halaman Settings (beneran, bukan stub) ---------- */
const AV_COLORS = ['#8c1218', '#5c0f13', '#7a1216', '#a3121a', '#4a1010', '#6d1a1a'];
function applyChatPrefs() {
  const w = localStorage.getItem('xero.wall') || 'dark';
  const f = localStorage.getItem('xero.font') || '14.5';
  document.documentElement.style.setProperty('--chat-font', `${f}px`);
  document.body.dataset.wall = w;
}
function beep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(ctx.destination);
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);
    o.start(); o.stop(ctx.currentTime + 0.36);
  } catch {}
}
async function openSettings(key) {
  if (key === 'Akun') {
    openSheet([
      { ic: 'key', lbl: 'Ganti password', fn: () => {
        const ov = document.createElement('div'); ov.className = 'overlay open'; ov.id = 'sheet-overlay';
        ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>Ganti password</h3>
          <div class="field"><label>Password saat ini</label><input id="pw-cur" type="password" placeholder="(kosongkan bila akun OTP)" /></div>
          <div class="field"><label>Password baru</label><input id="pw-new" type="password" /></div>
          <button class="btn-red" id="pw-go">Simpan</button></div>`;
        $('#app').appendChild(ov);
        $('#pw-go').onclick = async () => { try { await api('/auth/password', { method: 'POST', body: { current: $('#pw-cur').value, next: $('#pw-new').value } }); closeSheet(); toast('🔑 Password diganti'); } catch (e) { toast(e.message, true); } };
      } },
      { ic: 'phone', lbl: 'Perangkat terhubung', fn: () => $('#s-devices').click() },
      { ic: 'x', lbl: 'Keluar dari akun', danger: true, fn: () => $('#s-logout').click() },
    ]);
  }
  if (key === 'Privasi') {
    const { blocks } = await api('/blocks');
    openSheet([
      ...blocks.map((b) => ({ ic: 'shield', lbl: `Buka blokir ${b.displayName}`, fn: async () => { await api('/blocks', { method: 'POST', body: { email: b.email || b.username, on: false } }).catch(async () => { await api('/blocks', { method: 'POST', body: { username: b.username, on: false } }); }); toast('Blokir dibuka'); } })),
      { ic: 'shield', lbl: 'Blokir pengguna (via email/username)', fn: () => {
        const t = prompt('Email / username yang mau diblokir:'); if (!t) return;
        api('/blocks', { method: 'POST', body: t.includes('@') ? { email: t } : { username: t } }).then(() => toast('🚫 Diblokir')).catch((e) => toast(e.message, true));
      } },
    ]);
  }
  if (key === 'Avatar') {
    const ov = document.createElement('div'); ov.className = 'overlay open'; ov.id = 'sheet-overlay';
    ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>Avatar</h3>
      <div class="field"><label>Inisial (maks 2)</label><input id="av-t" maxlength="2" value="${esc(state.me.avatarText)}" /></div>
    <button class="btn-outline" id="av-up" style="margin-bottom:12px">📷 Unggah foto profil</button>
    <input type="file" id="av-file" accept="image/*" hidden />
      <div class="row" style="margin-bottom:12px">${AV_COLORS.map((c) => `<button class="swatch ${state.me.avatarColor === c ? 'on' : ''}" data-c="${c}" style="background:${c}"></button>`).join('')}</div>
      <button class="btn-red" id="av-go">Simpan</button></div>`;
    $('#app').appendChild(ov);
    let color = state.me.avatarColor;
    ov.querySelectorAll('.swatch').forEach((s) => s.onclick = () => { color = s.dataset.c; ov.querySelectorAll('.swatch').forEach((x) => x.classList.remove('on')); s.classList.add('on'); });
    $('#av-up').onclick = () => $('#av-file').click();
    $('#av-file').onchange = async () => {
      const f = $('#av-file').files[0]; if (!f) return;
      try {
        const dataUrl = await imageToUpload(f);
        const up = await api('/media', { method: 'POST', body: { dataUrl } });
        const r = await api('/me', { method: 'PATCH', body: { avatarUrl: `/media/${up.mediaId}` } });
        state.me = { ...state.me, ...r.user };
        toast('Foto profil dipasang'); closeSheet(); renderSettings();
      } catch (e) { toast(e.message, true); }
    };
    $('#av-go').onclick = async () => {
      const r = await api('/me', { method: 'PATCH', body: { avatarText: $('#av-t').value.toUpperCase() || 'X', avatarColor: color } });
      state.me = { ...state.me, ...r.user }; closeSheet(); toast('Avatar disimpan'); renderSettings();
    };
  }
  if (key === 'Chat') {
    openSheet([
      { ic: 'palette', lbl: `Wallpaper: ${localStorage.getItem('xero.wall') === 'red' ? 'merah gelap' : 'hitam'} (ketuk untuk ganti)`, fn: () => { localStorage.setItem('xero.wall', localStorage.getItem('xero.wall') === 'red' ? 'dark' : 'red'); applyChatPrefs(); toast('Wallpaper diganti'); } },
      { ic: 'edit', lbl: 'Ukuran font: kecil', fn: () => { localStorage.setItem('xero.font', '13'); applyChatPrefs(); toast('Font kecil'); } },
      { ic: 'edit', lbl: 'Ukuran font: sedang', fn: () => { localStorage.setItem('xero.font', '14.5'); applyChatPrefs(); toast('Font sedang'); } },
      { ic: 'edit', lbl: 'Ukuran font: besar', fn: () => { localStorage.setItem('xero.font', '16.5'); applyChatPrefs(); toast('Font besar'); } },
    ]);
  }
  if (key === 'Notifikasi') {
    openSheet([
      { ic: 'bell', lbl: 'Aktifkan notifikasi push', fn: () => $('#s-push').click() },
      { ic: 'bell', lbl: `Suara saat pesan masuk: ${localStorage.getItem('xero.sound') === '1' ? 'NYALA' : 'MATI'}`, fn: () => { const on = localStorage.getItem('xero.sound') === '1'; localStorage.setItem('xero.sound', on ? '0' : '1'); if (!on) beep(); toast(on ? 'Suara mati' : 'Suara nyala'); } },
    ]);
  }
  if (key === 'Penyimpanan dan Data') {
    let txt = '—';
    try { const est = await navigator.storage?.estimate(); if (est) txt = `${((est.usage || 0) / 1024).toFixed(0)} KB dari ${((est.quota || 0) / 1048576).toFixed(0)} MB`; } catch {}
    openSheet([
      { ic: 'db', lbl: `Pemakaian lokal: ${txt}`, fn: () => {} },
      { ic: 'trash', lbl: 'Bersihkan cache aplikasi', danger: true, fn: async () => { try { (await caches.keys()).forEach((k) => caches.delete(k)); } catch {} toast('Cache dibersihkan'); } },
    ]);
  }
  if (key === 'Bantuan') {
    openSheet([
      { ic: 'help', lbl: 'Xerophis v1.2 — developed with ♥ by Pall', fn: () => {} },
      { ic: 'chat', lbl: 'FAQ: login bisa password atau email OTP', fn: () => {} },
      { ic: 'shield', lbl: 'Privasi: E2EE aktif di chat privat antar-manusia', fn: () => {} },
      { ic: 'users', lbl: 'Undang teman via email (menu + → tambah kontak)', fn: () => {} },
    ]);
  }
}

/* ---------- updates / status / saluran ---------- */
async function renderUpdates() {
  const r = await api('/updates');
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top"><h1 style="font-size:22px">Updates</h1><span class="spacer"></span><button class="iconbtn" id="u-cam" title="Status baru">${icon('camera')}</button></div>
      <div class="settings-body">
        <div class="section-lbl" style="padding-left:0">STATUS</div>
        <div class="conv" id="u-mine">
          <div class="avatar" style="background:radial-gradient(circle at 35% 30%, ${esc(state.me.avatarColor)}, #170405 70%)">${esc(state.me.avatarText)}<span class="plus-dot">+</span></div>
          <div class="meta"><div class="line1"><span class="name">Status saya</span></div><div class="line2"><span class="preview">Ketuk untuk tambah update</span></div></div>
        </div>
        ${r.mine.map((s) => `<div class="conv" data-myst="${s.id}"><div class="avatar" style="width:40px;height:40px;font-size:12px">✍️</div><div class="meta"><div class="line1"><span class="preview">${esc(s.body)}</span><span class="time">${fmtTime(s.created_at)}</span></div></div><button class="iconbtn" data-mystd="${s.id}">${icon('trash', 'sm')}</button></div>`).join('')}
        <div class="section-lbl" style="padding-left:0">PEMBARUAN TERBARU</div>
        ${r.contacts.map((c, i) => `
          <div class="conv" data-stc="${i}">
            <div class="avatar ${c.unseen ? 'status-unseen' : 'status-seen'}" data-uid="${c.user.id}" style="background:radial-gradient(circle at 35% 30%, ${esc(c.user.avatarColor)}, #170405 70%)">${c.user.avatarUrl ? `<img class="av-img" src="${c.user.avatarUrl}?token=${encodeURIComponent(state.token)}" alt="" />` : esc(c.user.avatarText)}${state.online.has(c.user.id) ? '<span class="dot"></span>' : ''}</div>
            <div class="meta"><div class="line1"><span class="name">${esc(c.user.displayName)}</span><span class="spacer"></span><span class="time">${fmtTime(c.statuses[c.statuses.length - 1].created_at)}</span></div>
            <div class="line2"><span class="preview">${esc(c.statuses[c.statuses.length - 1].body)}</span></div></div>
          </div>`).join('') || '<div class="empty" style="padding:12px"><p>Kontak kamu belum membagikan status.</p></div>'}
        <div class="section-lbl" style="padding-left:0">SALURAN</div>
        ${r.channels.map((ch, i) => `
          <div class="conv" data-ch="${ch.id}">
            <div class="avatar" style="background:radial-gradient(circle at 35% 30%, #5c0f13, #170405 70%)">${esc((ch.title || 'X').slice(0, 1).toUpperCase())}</div>
            <div class="meta"><div class="line1"><span class="name">${esc(ch.title)}</span>${ch.following ? '' : '<span class="bot-tag">ikuti</span>'}<span class="spacer"></span><span class="time">${ch.posts} post</span></div>
            <div class="line2"><span class="preview">${esc(ch.about)} · ${ch.followers} pengikut</span></div></div>
          </div>`).join('') || '<div class="empty" style="padding:12px"><p>Belum ada saluran.</p></div>'}
      </div>
      <button class="fab" id="u-newch" title="Saluran baru">${icon('broadcast')}</button>
      ${navHTML('updates')}
    </section>`;
  const postStatus = () => postStatusSheet();
  $('#u-mine').onclick = postStatus;
  $('#u-cam').onclick = postStatus;
  $('#u-newch').onclick = () => openSheet([{ ic: 'broadcast', lbl: 'Buat saluran baru', fn: async () => {
    const t = prompt('Nama saluran:'); if (!t) return;
    try { const r2 = await api('/channels', { method: 'POST', body: { title: t, about: '' } }); toast('Saluran dibuat'); openChannel(r2.channelId); } catch (e) { toast(e.message, true); }
  } }]);
  r.contacts.forEach((c, i) => { $(`[data-stc="${i}"]`).onclick = () => openStatusViewer(c); });
  r.mine.forEach((s) => {
    $(`[data-myst="${s.id}"]`)?.addEventListener('click', (e) => { if (e.target.closest('[data-mystd]')) return; openStatusViewer({ user: state.me, statuses: r.mine.slice().reverse(), mine: true }); });
  });
  document.querySelectorAll('[data-mystd]').forEach((b) => b.onclick = async () => { await api(`/status/${b.dataset.mystd}`, { method: 'DELETE' }); toast('Status dihapus'); renderUpdates(); });
  r.channels.forEach((ch) => { $(`[data-ch="${ch.id}"]`).onclick = () => openChannel(ch.id); });
}
function postStatusSheet() {
  closeSheet();
  const ov = document.createElement('div'); ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet"><div class="grab"></div><h3>Status baru</h3><div class="field"><textarea id="st-body" rows="3" class="ta" placeholder="Apa yang terjadi?"></textarea></div><button class="btn-red" id="st-go">Bagikan</button></div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  $('#st-go').onclick = async () => { try { await api('/status', { method: 'POST', body: { body: $('#st-body').value } }); closeSheet(); toast('Status dibagikan'); renderUpdates(); } catch (e) { toast(e.message, true); } };
  setTimeout(() => $('#st-body')?.focus(), 60);
}

let svTimer = null;
function openStatusViewer(c) {
  closeSheet();
  clearInterval(svTimer);
  let idx = 0;
  const ov = document.createElement('div');
  ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="status-view">
    <div class="status-top"><div class="progress">${c.statuses.map(() => '<i></i>').join('')}</div>
    <div class="row" style="margin-top:10px"><div class="avatar" style="width:40px;height:40px;font-size:13px">${esc(c.user.avatarText || '•')}</div>
    <div><div style="font-weight:700">${esc(c.user.displayName)}</div><div class="sub" id="sv-time"></div></div>
    <span class="spacer"></span><button class="iconbtn" id="sv-x" style="color:#fff">${icon('x')}</button></div></div>
    <div class="status-body" id="sv-body"></div>
    <div class="status-nav"><button id="sv-prev" style="flex:1;height:100%"></button><button id="sv-next" style="flex:1;height:100%"></button></div>
  </div>`;
  $('#app').appendChild(ov);
  const show = () => {
    const s = c.statuses[idx];
    $('#sv-body').textContent = s.body;
    $('#sv-time').textContent = dayLabel(s.created_at) + ' ' + fmtTime(s.created_at);
    ov.querySelectorAll('.progress i').forEach((el, i2) => el.classList.toggle('on', i2 <= idx));
    if (!c.mine) api(`/status/${s.id}/view`, { method: 'POST' }).catch(() => {});
  };
  show();
  /* auto-advance 5 detik kayak story */
  svTimer = setInterval(() => {
    if (idx < c.statuses.length - 1) { idx++; show(); }
    else { clearInterval(svTimer); closeSheet(); if (routeName() === 'updates') renderUpdates(); }
  }, 5000);
  const svClose = () => { clearInterval(svTimer); closeSheet(); if (routeName() === 'updates') renderUpdates(); };
  $('#sv-x').onclick = svClose;
  ov.addEventListener('click', (e) => { if (e.target === ov) svClose(); });
  $('#sv-prev').onclick = () => { if (idx > 0) { idx--; show(); } };
  $('#sv-next').onclick = () => { if (idx < c.statuses.length - 1) { idx++; show(); } else svClose(); };
}

async function openChannel(id) {
  const [{ posts }, { channels }] = await Promise.all([api(`/channels/${id}/posts`), api('/channels')]);
  const ch = channels.find((x) => x.id === id);
  closeSheet();
  const ov = document.createElement('div');
  ov.className = 'overlay open'; ov.id = 'sheet-overlay';
  ov.innerHTML = `<div class="sheet" style="max-height:90%"><div class="grab"></div>
    <div class="row" style="margin-bottom:8px"><div class="avatar" style="background:radial-gradient(circle at 35% 30%, #5c0f13, #170405 70%)">${esc((ch?.title || 'X').slice(0, 1))}</div>
    <div style="flex:1"><div style="font-weight:800">${esc(ch?.title || '')} ${ch?.following ? '' : '<span class="bot-tag">belum diikuti</span>'}</div><div class="sub">${ch?.followers || 0} pengikut · ${esc(ch?.about || '')}</div></div>
    <button class="btn-outline" id="ch-fl" style="width:auto;padding:8px 12px">${ch?.following ? 'Berhenti' : 'Ikuti'}</button></div>
    ${ch?.createdBy === state.me.id ? `<div class="row" style="margin-bottom:8px"><input id="ch-in" class="sel" style="flex:1" placeholder="Tulis postingan…" /><button class="micbtn" id="ch-send" style="width:38px;height:38px">${icon('send', 'sm')}</button></div>` : ''}
    <div id="ch-posts" style="display:flex;flex-direction:column;gap:8px"></div></div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  const paint = () => { $('#ch-posts').innerHTML = posts.map((p) => `<div class="bubble" style="animation:none;max-width:100%"><div class="sender">${esc(p.author_name)}</div><div class="body">${esc(p.body)}</div><div class="tail"><span class="t">${dayLabel(p.created_at)} ${fmtTime(p.created_at)}</span></div></div>`).join('') || '<div class="sub">Belum ada postingan.</div>'; };
  paint();
  $('#ch-fl').onclick = async () => { await api(`/channels/${id}/follow`, { method: 'POST', body: { on: !ch.following } }); toast(ch.following ? 'Berhenti mengikuti' : 'Mengikuti saluran'); closeSheet(); openChannel(id); };
  if (ch?.createdBy === state.me.id) $('#ch-send').onclick = async () => { const t = $('#ch-in').value.trim(); if (!t) return; await api(`/channels/${id}/posts`, { method: 'POST', body: { body: t } }); $('#ch-in').value = ''; const r2 = await api(`/channels/${id}/posts`); posts.length = 0; posts.push(...r2.posts); paint(); };
}

/* ---------- communities ---------- */
async function renderCommunities() {
  const { communities } = await api('/communities');
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top"><h1 style="font-size:22px">Communities</h1><span class="spacer"></span><button class="iconbtn" id="cm-new">${icon('plus')}</button></div>
      <div class="settings-body">
        <div class="empty" style="padding:8px 0 16px"><div class="ring">${icon('users')}</div><p>Satukan grup-grup kamu dalam satu komunitas.</p></div>
        ${communities.map((c, i) => `
          <div class="menu-group" style="margin-bottom:10px"><div class="menu-row" data-cm="${c.id}">
            <div class="avatar" style="background:radial-gradient(circle at 35% 30%, #5c0f13, #170405 70%)">${esc((c.title || 'C').slice(0, 2).toUpperCase())}</div>
            <span style="flex:1;min-width:0"><span class="lbl">${esc(c.title)}</span><div class="sub">${c.groups} grup · ${c.members} anggota · ${c.joined ? 'anggota ✓' : 'belum bergabung'}</div></span>
            <span class="chev">›</span>
          </div></div>`).join('')}
      </div>
      ${navHTML('communities')}
    </section>`;
  $('#cm-new').onclick = async () => {
    const t = prompt('Nama komunitas:'); if (!t) return;
    const myGroups = state.conversations.filter((c) => c.type === 'group').map((c) => c.id);
    try { await api('/communities', { method: 'POST', body: { title: t, about: '', groups: myGroups } }); toast('Komunitas dibuat'); renderCommunities(); } catch (e) { toast(e.message, true); }
  };
  document.querySelectorAll('[data-cm]').forEach((el) => el.onclick = async () => {
    const { community } = await api(`/communities/${el.dataset.cm}`);
    openSheet([
      ...community.groups.map((g) => ({ ic: 'users', lbl: `${g.title} (${g.members} peserta)`, fn: () => { location.hash = `#/chat/${g.id}`; } })),
      { ic: community.joined ? 'x' : 'users', lbl: community.joined ? 'Keluar komunitas' : 'Gabung komunitas', danger: community.joined, fn: async () => { await api(`/communities/${community.id}/join`, { method: 'POST', body: { on: !community.joined } }); toast(community.joined ? 'Keluar' : 'Bergabung'); } },
    ]);
  });
}

/* ---------- calls ---------- */
async function renderCalls() {
  const { calls } = await api('/calls');
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top"><h1 style="font-size:22px">Calls</h1></div>
      <div class="settings-body">
        ${calls.map((c) => {
          const mine = c.caller_id === state.me.id;
          const other = mine ? c.callee_name : c.caller_name;
          const ic = c.status === 'missed' || c.status === 'rejected' ? 'x' : 'phone';
          return `<div class="menu-group" style="margin-bottom:8px"><div class="menu-row" data-call="${c.id}" data-other="${mine ? c.callee_id : c.caller_id}" data-kind="${c.kind}">
            <span class="ic" style="${c.status === 'missed' || c.status === 'rejected' ? 'color:var(--red)' : ''}">${icon(ic)}</span>
            <span style="flex:1"><span class="lbl">${esc(other)}</span>
            <div class="sub">${mine ? '↗ keluar' : '↙ masuk'} · ${c.kind === 'video' ? '🎥 video' : '📞 suara'} · ${c.status}${c.duration_sec ? ` · ${c.duration_sec} dtk` : ''}</div></span>
            <span class="time">${fmtTime(c.created_at)}</span>
          </div></div>`;
        }).join('') || '<div class="empty"><div class="ring">' + icon('phone') + '</div><h3>Belum ada panggilan</h3><p>Mulai panggilan suara atau video dari halaman chat.</p></div>'}
      </div>
      ${navHTML('calls')}
    </section>`;
  document.querySelectorAll('[data-call]').forEach((el) => el.onclick = () => {
    const kind = el.dataset.kind === 'video' ? 'video' : 'voice';
    toast(kind === 'video' ? '🎥 Memanggil…' : '📞 Memanggil…');
    startCall(Number(el.dataset.other), kind);
  });
}

/* ---------- UI panggilan realtime ---------- */
let callTimerInt = null;
async function startCall(calleeId, kind) {
  try { const r = await api('/calls/offer', { method: 'POST', body: { calleeId, kind } }); startCallUI('caller', r.call); }
  catch (e) { toast(e.message, true); }
}
function startCallUI(role, call, active = false) {
  closeCallUI();
  state.call = { role, call };
  const other = role === 'caller' ? call.callee_name : call.caller_name;
  const ov = document.createElement('div');
  ov.id = 'call-overlay'; ov.className = 'call-overlay';
  ov.innerHTML = `
    <div class="avatar lg" style="background:radial-gradient(circle at 35% 30%, #7a1216, #170405 70%)">${esc((other || '?').slice(0, 2).toUpperCase())}</div>
    <div style="font-size:20px;font-weight:800">${esc(other)}</div>
    <div class="sub" id="call-sub">${call.kind === 'video' ? '🎥 Panggilan video' : '📞 Panggilan suara'} · ${active ? '' : (role === 'callee' ? 'panggilan masuk…' : 'memanggil…')}</div>
    <video id="rv" class="call-video" autoplay playsinline></video>
    <div class="call-actions">
      ${role === 'callee' && !active ? `
        <button class="call-btn deny" id="call-rej">${icon('x')}</button>
        <button class="call-btn ok" id="call-acc">${icon('phone')}</button>` : `
        <button class="call-btn deny" id="call-end">${icon('phone')}</button>`}
    </div>`;
  $('#app').appendChild(ov);
  const tick = () => {
    const st = state.call?.call.started_at ? Date.parse(state.call.call.started_at) : Date.now();
    const s = Math.floor((Date.now() - st) / 1000);
    const el = $('#call-sub'); if (el) el.textContent = `${call.kind === 'video' ? '🎥' : '📞'} ${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  };
  if (active) { state.call.call.started_at = call.started_at || new Date().toISOString(); callTimerInt = setInterval(tick, 1000); tick(); }
  $('#call-acc')?.addEventListener('click', async () => {
    const r = await api(`/calls/${call.id}/accept`, { method: 'POST' });
    startCallUI('callee', r.call, true);
    setupRTC(false, r.call.caller_id);
  });
  $('#call-rej')?.addEventListener('click', async () => { await api(`/calls/${call.id}/reject`, { method: 'POST' }); closeCallUI(); });
  $('#call-end')?.addEventListener('click', async () => { await api(`/calls/${call.id}/end`, { method: 'POST' }); closeCallUI(); toast('📞 Panggilan berakhir'); if (routeName() === 'calls') renderCalls(); });
}
function closeCallUI() {
  clearInterval(callTimerInt); callTimerInt = null;
  try { state.localStream?.getTracks().forEach((t) => t.stop()); } catch {}
  try { state.pc?.close(); } catch {}
  state.localStream = null; state.pc = null; state.rtcHandler = null;
  $('#call-overlay')?.remove();
  state.call = null;
}

/* ---------- WebRTC audio/video ---------- */
async function setupRTC(isCaller, peerId) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  state.pc = pc;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: state.call?.call.kind === 'video' });
    state.localStream = stream;
    stream.getTracks().forEach((t) => pc.addTrack(t, stream));
  } catch (e) { toast('Mic/kamera tidak tersedia: ' + e.message, true); }
  pc.ontrack = (e) => { const rv = $('#rv'); if (rv) rv.srcObject = e.streams[0]; };
  pc.onicecandidate = (e) => { if (e.candidate) wsSend({ type: 'rtc', to: peerId, payload: { t: 'ice', c: e.candidate.toJSON() } }); };
  const sendSdp = async (desc) => { await pc.setLocalDescription(desc); wsSend({ type: 'rtc', to: peerId, payload: { t: desc.type, sdp: desc.sdp } }); };
  state.rtcHandler = async (p) => {
    try {
      if (p.t === 'offer') { await pc.setRemoteDescription({ type: 'offer', sdp: p.sdp }); await sendSdp(await pc.createAnswer()); }
      if (p.t === 'answer') await pc.setRemoteDescription({ type: 'answer', sdp: p.sdp });
      if (p.t === 'ice' && p.c) await pc.addIceCandidate(p.c).catch(() => {});
    } catch (e) { console.warn('[rtc]', e.message); }
  };
  if (isCaller) await sendSdp(await pc.createOffer());
}

/* ---------- boot ---------- */
async function boot() {
  if (!state.token) { $('#splash').classList.add('gone'); route(); return; }
  try {
    const r = await api('/me');
    state.me = r.user; state.online = new Set(r.online); state.announcement = r.announcement || '';
    try {
      const kp = await e2ee.ensureKeyPair();
      state.myPriv = kp.priv; state.myPub = kp.pubB64;
      api('/keys', { method: 'POST', body: { pubkey: kp.pubB64 } }).catch(() => {});
    } catch {}
    await loadConversations(false);
    connectWS();
    api('/calls').then((r) => { if (r.pending.length) startCallUI('callee', r.pending[0]); }).catch(() => {});
  } catch {
    state.token = ''; localStorage.removeItem('xerophis.token');
  }
  $('#splash').classList.add('gone');
  applyChatPrefs();
  route();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('/sw.js').catch(() => {});
  /* auto refresh berkala (1 detik) biar semua selalu segar tanpa reload manual */
  setInterval(() => { if (state.token && state.me && !document.hidden) loadConversations(routeName() === 'main').catch(() => {}); }, 1000);
}
boot();
