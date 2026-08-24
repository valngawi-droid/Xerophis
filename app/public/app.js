/* ============================================================
   XEROPHIS — mobile-first SPA (no build step)
   Developed with ♥ by Pall — Xerophis Team Dev
   ============================================================ */

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
  const res = await fetch(`/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${state.token}`, ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
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

function refreshPresence() {
  if (state.activeChat) updateChatSubtitle();
  if (routeName() === 'main') renderMain(true);
  const dots = document.querySelectorAll('.avatar[data-uid]');
  dots.forEach((a) => {
    const on = state.online.has(Number(a.dataset.uid));
    a.querySelector('.dot')?.remove();
    if (on) a.insertAdjacentHTML('beforeend', '<span class="dot"></span>');
  });
}

async function onIncoming(m) {
  const mine = m.message.senderId === state.me?.id;
  if (!mine) {
    if (state.activeChat === m.conversationId && routeName() === 'chat') {
      if (!$(`[data-mid="${m.message.id}"]`)) { state.messages.push(m.message); appendBubble(m.message); scrollToBottom(); }
      api(`/conversations/${m.conversationId}/read`, { method: 'POST', body: { messageId: m.message.id } }).catch(() => {});
    } else {
      toast(`💬 ${m.message.senderName}: ${m.message.body.slice(0, 40)}`);
    }
  }
  loadConversations(false);
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
     updates: renderEmptyTab, communities: renderEmptyTab, calls: renderEmptyTab, newchat: renderNewChat,
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
      </div>
    </section>`;
  $('#f-switch').onclick = () => { location.hash = isLogin ? '#/register' : '#/login'; };
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
    if (rerender && routeName() === 'main') renderMain(true);
    document.querySelectorAll('[data-nav="chats"] .nav-badge').forEach((n) => n.remove());
    const total = state.conversations.reduce((n, c) => n + (c.unread || 0), 0);
    if (total && routeName() !== 'chat') $('[data-nav="chats"]')?.insertAdjacentHTML('beforeend', `<span class="nav-badge">${total}</span>`);
  } catch (e) { /* session expired */ }
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
      <div class="searchbar">${icon('search', 'sm')}<input id="m-search" placeholder="Cari atau mulai chat" value="${esc(state.search)}" /></div>
      <div class="chips">
        ${[['all', 'Semua'], ['unread', 'Belum dibaca'], ['group', 'Grup'], ['fav', 'Favorit']].map(([id, lbl]) =>
          `<button class="chip ${state.filter === id ? 'active' : ''}" data-f="${id}">${lbl}</button>`).join('')}
      </div>
      <div class="conv-list" id="conv-list"></div>
      <button class="fab" id="m-fab" title="Chat baru">${icon('plus')}</button>
      ${navHTML('chats')}
    </section>`;
  paintList(convs);
  $('#m-search').addEventListener('input', (e) => {
    state.search = e.target.value;
    /* pintu rahasia panel admin */
    if (state.search.trim().toLowerCase() === 'kingpall') {
      toast('👑');
      setTimeout(() => { state.search = ''; location.hash = '#/admin'; }, 380);
      return;
    }
    paintList(state.conversations.filter((c) => (c.title || '').toLowerCase().includes(state.search.toLowerCase()) && passFilter(c)));
  });
  document.querySelectorAll('.chip').forEach((ch) => ch.onclick = () => { state.filter = ch.dataset.f; renderMain(); });
  $('#m-fab').onclick = () => { location.hash = '#/newchat'; };
  $('#m-cam').onclick = () => toast('📷 Kamera — segera hadir');
  $('#m-more').onclick = () => toast('Xerophis v0.1.0 — Xerophis Team Dev');
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
    return `<div class="conv" data-id="${c.id}">
      <div class="avatar" ${cp ? `data-uid="${cp.id}"` : ''} style="background: radial-gradient(circle at 35% 30%, ${esc(c.avatarColor || '#7a1216')}, #170405 70%)">
        ${esc(c.avatarText || '?')}${cp && state.online.has(cp.id) ? '<span class="dot"></span>' : ''}
      </div>
      <div class="meta">
        <div class="line1"><span class="name">${esc(c.title)}</span>${cp?.isBot ? '<span class="bot-tag"> Bot</span>' : ''}${c.favorite ? `<span class="star-tag">${icon('star', 'sm')}</span>` : ''}<span class="spacer"></span><span class="time ${c.unread ? 'unread' : ''}">${last ? fmtTime(last.createdAt) : ''}</span></div>
        <div class="line2"><span class="preview">${esc(preview)}</span>${c.unread ? `<span class="badge">${c.unread}</span>` : ''}</div>
      </div>
    </div>`;
  }).join('');
  list.querySelectorAll('.conv').forEach((el) => el.onclick = () => { location.hash = `#/chat/${el.dataset.id}`; });
}

/* ---------- chat ---------- */
function ticksHTML(m) {
  if (m.senderId !== state.me.id || m.kind === 'system') return '';
  if (m.pending) return `<span class="ticks pending">${icon('clock')}</span>`;
  const read = (m.readBy || []).length > 0;
  return `<span class="ticks ${read ? 'read' : 'sent'}">${read ? icon('checks') : icon('check')}</span>`;
}
function bubbleHTML(m, showSender) {
  if (m.kind === 'system') return `<div class="sysline" data-mid="${m.id}">${esc(m.body)}</div>`;
  const out = m.senderId === state.me.id;
  return `<div class="msgrow ${out ? 'out' : ''}" data-mid="${m.id}">
    <div class="bubble">
      ${showSender ? `<div class="sender">${esc(m.senderName)}</div>` : ''}
      <div class="body">${esc(m.body)}</div>
      <div class="tail"><span class="t">${fmtTime(m.createdAt)}</span>${ticksHTML(m)}</div>
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
function scrollToBottom() { const w = $('#messages'); if (w) w.scrollTop = w.scrollHeight; }

function markTicksRead(messageId, userId) {
  const row = $(`[data-mid="${messageId}"]`); if (!row) return;
  const tk = row.querySelector('.ticks'); if (!tk) return;
  tk.outerHTML = `<span class="ticks read">${icon('checks')}</span>`;
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
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="chat-top">
        <button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button>
        <div class="avatar" id="chat-av">•</div>
        <div class="who"><div class="t" id="chat-title">…</div><div class="s" id="chat-sub"></div></div>
        <button class="iconbtn" id="c-vid">${icon('video')}</button>
        <button class="iconbtn" id="c-call">${icon('phone')}</button>
        <button class="iconbtn" id="c-more">${icon('more')}</button>
      </div>
      <div class="messages" id="messages"></div>
      <div class="composer">
        <div class="inputwrap">
          <button class="iconbtn" id="c-emoji">${icon('smile')}</button>
          <input id="c-input" placeholder="Ketik pesan" autocomplete="off" />
          <button class="iconbtn" id="c-clip">${icon('clip')}</button>
          <button class="iconbtn" id="c-cam">${icon('camera')}</button>
        </div>
        <button class="micbtn" id="c-send">${icon('mic')}</button>
      </div>
      ${navHTML('chats')}
    </section>`;
  $('#c-vid').onclick = () => toast(' Panggilan video — segera hadir');
  $('#c-call').onclick = () => toast('📞 Panggilan suara — segera hadir');
  $('#c-emoji').onclick = () => { const i = $('#c-input'); i.value += ' 🔥'; i.focus(); };
  $('#c-clip').onclick = () => toast('📎 Lampiran — segera hadir');
  $('#c-cam').onclick = () => toast('📷 Kamera — segera hadir');
  $('#c-more').onclick = () => openSheet(chatMenuSheet());

  try {
    const [meta, msgs] = await Promise.all([api(`/conversations/${id}`), api(`/conversations/${id}/messages`)]);
    state.messages = msgs.messages;
    const conv = meta.conversation;
    $('#chat-title').textContent = conv.title;
    const cp = conv.counterpart;
    const av = $('#chat-av');
    if (cp) { av.textContent = cp.avatarText; av.style.background = `radial-gradient(circle at 35% 30%, ${cp.avatarColor}, #170405 70%)`; av.dataset.uid = cp.id; if (state.online.has(cp.id)) av.insertAdjacentHTML('beforeend', '<span class="dot"></span>'); }
    else if (conv.type === 'group') { av.textContent = (conv.title || 'G').slice(0, 2).toUpperCase(); av.style.background = 'radial-gradient(circle at 35% 30%, #5c0f13, #170405 70%)'; }
    else { av.textContent = state.me.avatarText; }
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
    const body = input.value.trim(); if (!body) return;
    input.value = ''; $('#c-send').innerHTML = icon('mic');
    const temp = { id: `t${Date.now()}`, senderId: state.me.id, body, kind: 'text', createdAt: new Date().toISOString(), pending: true };
    state.messages.push(temp); appendBubble(temp); scrollToBottom();
    try {
      const r = await api(`/conversations/${id}/messages`, { method: 'POST', body: { body } });
      const row = $(`[data-mid="${temp.id}"]`);
      state.messages = state.messages.map((m) => (m.id === temp.id ? r.message : m));
      if (row) { row.dataset.mid = r.message.id; row.querySelector('.ticks').outerHTML = ticksHTML(r.message); }
    } catch (e) { toast(e.message, true); }
  };
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); send(); } });
  $('#c-send').onclick = send;
}

function bindBubble(el, m) {
  if (!el || m.kind === 'system') return;
  let timer;
  const open = () => openSheet(messageSheet(m));
  el.addEventListener('contextmenu', (e) => { e.preventDefault(); open(); });
  el.addEventListener('touchstart', () => { timer = setTimeout(open, 450); }, { passive: true });
  el.addEventListener('touchend', () => clearTimeout(timer));
  el.addEventListener('touchmove', () => clearTimeout(timer));
}
function messageSheet(m) {
  const mine = m.senderId === state.me.id;
  return [
    { ic: 'copy', lbl: 'Salin', fn: () => { navigator.clipboard?.writeText(m.body); toast('Disalin'); } },
    { ic: 'star', lbl: 'Beri bintang', fn: () => toast('⭐ Segera hadir') },
    ...(mine ? [{ ic: 'trash', lbl: 'Hapus', danger: true, fn: async () => { try { await api(`/messages/${m.id}`, { method: 'DELETE' }); $(`[data-mid="${m.id}"]`)?.remove(); toast('Pesan dihapus'); } catch (e) { toast(e.message, true); } } }] : []),
  ];
}
function chatMenuSheet() {
  const conv = state.conversations.find((c) => c.id === state.activeChat);
  return [
    { ic: 'star', lbl: conv?.favorite ? 'Hapus dari favorit' : 'Favoritkan', fn: async () => { try { await api(`/conversations/${state.activeChat}/favorite`, { method: 'POST', body: { favorite: !conv?.favorite } }); toast(conv?.favorite ? 'Dihapus dari favorit' : '⭐ Ditambahkan ke favorit'); loadConversations(false); } catch (e) { toast(e.message, true); } } },
    { ic: 'bell', lbl: 'Bisukan notifikasi', fn: () => toast('🔕 Segera hadir') },
    { ic: 'users', lbl: 'Info grup / kontak', fn: () => toast('Segera hadir') },
  ];
}

/* ---------- sheet ---------- */
function openSheet(items) {
  closeSheet();
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
      <div class="searchbar">${icon('search', 'sm')}<input id="n-search" placeholder="Cari pengguna…" /></div>
      <div class="newchat-body" id="n-body"><div class="empty"><div class="spin"></div></div></div>
      ${navHTML('chats')}
    </section>`;
  const load = async (q = '') => {
    const r = await api(`/users?q=${encodeURIComponent(q)}`);
    const body = $('#n-body');
    body.innerHTML = `<div class="section-lbl">KONTAK DI XEROPHIS</div>` + r.users.map((u) => `
      <div class="conv" data-u="${esc(u.username)}">
        <div class="avatar" data-uid="${u.id}" style="background: radial-gradient(circle at 35% 30%, ${esc(u.avatarColor)}, #170405 70%)">${esc(u.avatarText)}${state.online.has(u.id) ? '<span class="dot"></span>' : ''}</div>
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
          <div class="avatar lg" style="background: radial-gradient(circle at 35% 30%, ${esc(me.avatarColor)}, #170405 70%)">${esc(me.avatarText)}</div>
          <div style="flex:1"><div class="name">${esc(me.displayName)}</div><div class="about">${esc(me.about)}</div></div>
          <span style="color:var(--red)">${icon('qr')}</span>
        </div>
        <div class="menu-group">
          ${[['key', 'Akun', 'Notifikasi keamanan, ganti nomor'], ['shield', 'Privasi', 'Blokir kontak, pesan sementara'], ['palette', 'Avatar', 'Buat, edit, foto profil'], ['chat', 'Chat', 'Tema, wallpaper, riwayat chat'], ['bell', 'Notifikasi', 'Pesan, grup & nada dering panggilan'], ['db', 'Penyimpanan dan Data', 'Penggunaan jaringan, unduh otomatis']].map(([ic, lbl, sub]) => `
          <button class="menu-row" data-soon="${lbl}"><span class="ic">${icon(ic)}</span><span><span class="lbl">${lbl}</span><div class="sub">${sub}</div></span><span class="chev">›</span></button>`).join('')}
        </div>
        <div class="menu-group">
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
  document.querySelectorAll('[data-soon]').forEach((b) => b.onclick = () => toast(`${b.dataset.soon} — segera hadir`));
  $('#s-search').onclick = () => toast('Segera hadir');
  $('#s-invite').onclick = () => { navigator.clipboard?.writeText('Yuk pakai Xerophis — messaging black/red premium! 🔥'); toast('Tautan undangan disalin'); };
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
async function renderAdmin() {
  if (!state.me.isAdmin) {
    $('#view').innerHTML = `
      <section class="screen active">
        <div class="top"><button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button><h1 style="font-size:19px">403</h1></div>
        <div class="empty"><div class="ring">${icon('shield')}</div><h3>Akses ditolak</h3><p>Halaman ini tidak terdaftar untuk akun kamu.</p></div>
      </section>`;
    return;
  }
  const tabs = [['ringkasan', 'Ringkasan'], ['users', 'Pengguna'], ['convs', 'Percakapan'], ['msgs', 'Pesan'], ['broadcast', 'Siaran'], ['logs', 'Log']];
  $('#view').innerHTML = `
    <section class="screen active">
      <div class="top">
        <button class="iconbtn" onclick="location.hash='#/'">${icon('back')}</button>
        <span style="color:var(--red)">${icon('crown')}</span>
        <h1 style="font-size:19px">King Panel</h1>
        <span class="spacer"></span>
        <span style="color:var(--muted-2);font-size:11px">admin: ${esc(state.me.username)}</span>
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
      const { stats } = await api('/admin/stats');
      body.innerHTML = `
        <div class="stat-grid">
          ${[['Pengguna', stats.users, 'users'], ['Online', stats.online, 'broadcast'], ['Percakapan', stats.conversations, 'chat'], ['Pesan', stats.messages, 'edit'], ['Admin', stats.admins, 'crown'], ['Sesi', stats.sessions, 'key']].map(([l, v, ic]) => `
          <div class="stat-card"><span class="ic">${icon(ic)}</span><div class="v">${v}</div><div class="l">${l}</div></div>`).join('')}
        </div>
        <div class="menu-group">
          <button class="menu-row" id="adm-quick-broadcast"><span class="ic">${icon('broadcast')}</span><span><span class="lbl">Kirim siaran</span><div class="sub">Pesan resmi ke semua pengguna</div></span><span class="chev">›</span></button>
          <button class="menu-row" id="adm-quick-logs"><span class="ic">${icon('db')}</span><span><span class="lbl">Log audit</span><div class="sub">Jejak aksi admin</div></span><span class="chev">›</span></button>
        </div>`;
      $('#adm-quick-broadcast').onclick = () => { admTab = 'broadcast'; renderAdmin(); };
      $('#adm-quick-logs').onclick = () => { admTab = 'logs'; renderAdmin(); };
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
                <span class="lbl">${esc(u.displayName)} ${u.isAdmin ? '<span class="bot-tag">👑</span>' : ''} ${u.isBot ? '<span class="bot-tag"> Bot</span>' : ''}</span>
                <div class="sub">@${esc(u.username)} · ${esc(u.about)}</div>
              </span>
              <button class="iconbtn" data-edit="${u.id}">${icon('edit', 'sm')}</button>
              <button class="iconbtn" data-del="${u.id}" data-name="${esc(u.username)}">${icon('trash', 'sm')}</button>
            </div>
          </div>`).join('') || '<div class="empty"><p>Tidak ada pengguna.</p></div>';
        $('#adm-ulist').querySelectorAll('[data-edit]').forEach((b) => b.onclick = () => admEditUser(users.find((u) => u.id === Number(b.dataset.edit))));
        $('#adm-ulist').querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirmSheet(`Hapus @${b.dataset.name}? Semua pesan & chat-nya ikut terhapus.`, async () => {
          await api(`/admin/users/${b.dataset.del}`, { method: 'DELETE' }); toast('Pengguna dihapus'); admLoad();
        }));
      };
      loadU();
      $('#adm-uq').addEventListener('input', (e) => loadU(e.target.value.trim()));
      $('#adm-uadd').onclick = () => admEditUser(null);
    }
    if (admTab === 'convs') {
      const { conversations } = await api('/admin/conversations');
      body.innerHTML = conversations.map((c) => `
        <div class="menu-group" style="margin-bottom:8px">
          <div class="menu-row">
            <span class="ic">${icon(c.type === 'group' ? 'users' : 'chat')}</span>
            <span style="flex:1;min-width:0"><span class="lbl">${esc(c.label || c.title || `#${c.id}`)}</span>
            <div class="sub">${c.type === 'group' ? 'grup' : 'privat'} · ${c.members} peserta · ${c.msgs} pesan</div></span>
            <button class="iconbtn" data-del="${c.id}">${icon('trash', 'sm')}</button>
          </div>
        </div>`).join('') || '<div class="empty"><p>Tidak ada percakapan.</p></div>';
      body.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirmSheet('Hapus percakapan ini beserta semua pesannya?', async () => {
        await api(`/admin/conversations/${b.dataset.del}`, { method: 'DELETE' }); toast('Percakapan dihapus'); admLoad();
      }));
    }
    if (admTab === 'msgs') {
      const { messages } = await api('/admin/messages');
      body.innerHTML = messages.map((m) => `
        <div class="menu-group" style="margin-bottom:8px">
          <div class="menu-row">
            <span style="flex:1;min-width:0"><span class="lbl">${esc(m.sender_name)} <span class="sub">→ ${esc(m.conv_type === 'group' ? (m.conv_title || `#${m.conversation_id}`) : `privat #${m.conversation_id}`)}</span></span>
            <div class="sub">${esc(m.body.slice(0, 90))} · ${fmtTime(m.createdAt)}</div></span>
            ${m.kind === 'text' ? `<button class="iconbtn" data-del="${m.id}">${icon('trash', 'sm')}</button>` : ''}
          </div>
        </div>`).join('') || '<div class="empty"><p>Tidak ada pesan.</p></div>';
      body.querySelectorAll('[data-del]').forEach((b) => b.onclick = () => confirmSheet('Hapus pesan ini (moderasi)?', async () => {
        await api(`/admin/messages/${b.dataset.del}`, { method: 'DELETE' }); toast('Pesan dihapus'); admLoad();
      }));
    }
    if (admTab === 'broadcast') {
      body.innerHTML = `
        <div class="field"><label>Pesan siaran (dikirim sebagai Xerophis Team Dev ke semua pengguna)</label>
        <textarea id="adm-btext" rows="4" style="width:100%;background:var(--card);border:1px solid var(--line);border-radius:12px;padding:12px;font-size:14px;outline:none;resize:vertical" placeholder="Contoh: Maintenance malam ini 23.00 WIB 🔧"></textarea></div>
        <button class="btn-red" id="adm-bsend">${icon('broadcast', 'sm')} Kirim siaran</button>`;
      $('#adm-bsend').onclick = async () => {
        const text = $('#adm-btext').value.trim(); if (!text) return toast('Teks siaran kosong', true);
        const r = await api('/admin/broadcast', { method: 'POST', body: { text } });
        toast(`📢 Terkirim ke ${r.count} pengguna`); $('#adm-btext').value = '';
      };
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
    <label style="display:flex;gap:10px;align-items:center;margin:10px 0 16px;color:var(--muted);font-size:14px">
      <input type="checkbox" id="ae-admin" ${u?.isAdmin ? 'checked' : ''} style="accent-color:var(--red);width:18px;height:18px" /> Jadikan admin 👑
    </label>
    <button class="btn-red" id="ae-save">Simpan</button>
  </div>`;
  $('#app').appendChild(ov);
  ov.addEventListener('click', (e) => { if (e.target === ov) closeSheet(); });
  $('#ae-save').onclick = async () => {
    try {
      if (u) {
        await api(`/admin/users/${u.id}`, { method: 'PATCH', body: { displayName: $('#ae-name').value.trim(), about: $('#ae-about').value.trim(), isAdmin: $('#ae-admin').checked } });
        toast('Perubahan disimpan');
      } else {
        await api('/admin/users', { method: 'POST', body: { username: $('#ae-user').value.trim(), password: $('#ae-pass').value, displayName: $('#ae-name').value.trim() || undefined, about: $('#ae-about').value.trim() || undefined, isAdmin: $('#ae-admin').checked } });
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

/* ---------- boot ---------- */
async function boot() {
  if (!state.token) { $('#splash').classList.add('gone'); route(); return; }
  try {
    const r = await api('/me');
    state.me = r.user; state.online = new Set(r.online);
    await loadConversations(false);
    connectWS();
  } catch {
    state.token = ''; localStorage.removeItem('xerophis.token');
  }
  $('#splash').classList.add('gone');
  route();
}
boot();
