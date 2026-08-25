'use strict';
/** Xerophis auth — register / login / logout + bearer middleware. */
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const express = require('express');
const dbx = require('./db');

const router = express.Router();

/* tiny in-memory rate limit (spec 76) */
const hits = new Map();
setInterval(() => { const now = Date.now(); for (const [k, v] of hits) if (now - v.t > 120_000) hits.delete(k); }, 60_000);
function limited(req, max = 30, windowMs = 60_000, bucket = 'auth') {
  const key = `${req.ip}:${bucket}`; const now = Date.now();
  const rec = hits.get(key) || { t: now, n: 0 };
  if (now - rec.t > windowMs) { rec.t = now; rec.n = 0; }
  rec.n += 1; hits.set(key, rec);
  return rec.n > max;
}

const VALID_USERNAME = /^[a-zA-Z0-9+._-]{3,24}$/;

router.post('/register', async (req, res) => {
  if (limited(req)) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  let { username, password, displayName, phone } = req.body || {};
  username = String(username || '');
  if (!username || !VALID_USERNAME.test(username)) return res.status(400).json({ error: 'Username 3-24 karakter (huruf, angka, + . _ -).' });
  if (!password || String(password).length < 4) return res.status(400).json({ error: 'Password minimal 4 karakter.' });
  if (dbx.OWNER_USERNAMES.includes(username.toLowerCase())) username = `${username}${crypto.randomInt(100, 999)}`; // cegah klaim/escalation akun owner
  if (await dbx.getUserByUsername(username)) return res.status(409).json({ error: 'Username sudah dipakai.' });
  const hash = await bcrypt.hash(String(password), 10);
  const user = await dbx.createUser({ username, passwordHash: hash, displayName: displayName || username, phone });
  await dbx.ensureOwners(); // registrasi pall/noval/vall otomatis jadi owner + "Developer Xerophis"
  const fresh = (await dbx.getUserById(user.id)) || user;
  await require('./bots').onboardUser(fresh); // welcome DM + Lounge + channel biar akun langsung hidup
  const token = crypto.randomUUID();
  await dbx.createSession(fresh.id, token, deviceOf(req));
  res.status(201).json({ token, user: fresh });
});

router.post('/login', async (req, res) => {
  if (limited(req)) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi nanti.' });
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  const user = await dbx.getUserByUsername(String(username));
  const row = user && await dbx.db.prepare('SELECT password_hash, blocked FROM users WHERE id = ?').get(user.id);
  if (!user || !row || !(await bcrypt.compare(String(password), row.password_hash))) {
    return res.status(401).json({ error: 'Username atau password salah.' });
  }
  if (row.blocked) return res.status(403).json({ error: 'Akun kamu diblokir oleh admin Xerophis.' });
  const token = crypto.randomUUID();
  await dbx.createSession(user.id, token, deviceOf(req));
  res.json({ token, user });
});

router.post('/logout', async (req, res) => {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  if (token) await dbx.deleteSession(token);
  res.json({ ok: true });
});

/* middleware for /api routes */
async function requireAuth(req, res, next) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '');
  const user = token ? await dbx.getUserByToken(token) : null;
  if (!user) return res.status(401).json({ error: 'Sesi berakhir. Masuk lagi.' });
  req.user = user; req.token = token;
  next();
}

/* ---------- login email OTP (passwordless) + blokir temp-mail ---------- */
const { isDisposable } = require('./disposable');
const mail = require('./mail');
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/* deskripsi perangkat tertaut: APK Android vs browser web */
function deviceOf(req) {
  if ((req.headers['x-client'] || '') === 'app') return 'Android APP (utama)';
  const ua = String(req.headers['user-agent'] || '');
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows' : /Mac/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Perangkat';
  const br = /Edg\//.test(ua) ? 'Edge' : /OPR/.test(ua) ? 'Opera' : /Firefox/.test(ua) ? 'Firefox' : /Chrome/.test(ua) ? 'Chrome' : /Safari/.test(ua) ? 'Safari' : 'Browser';
  return `${os} · ${br} (web tertaut)`;
}

router.post('/otp/request', async (req, res) => {
  if (limited(req, 10, 60_000, 'otp')) return res.status(429).json({ error: 'Terlalu banyak permintaan OTP.' });
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'Format email tidak valid.' });
  if (isDisposable(email)) return res.status(403).json({ error: 'Email sekali pakai (temp mail) tidak diizinkan.' });
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  await dbx.addOtp(email, sha(code), new Date(Date.now() + 5 * 60000).toISOString());
  try {
    const r = await mail.sendOtpEmail(email, code);
    res.json({ ok: true, dev: r.devCode || null });
  } catch (e) { res.status(503).json({ error: e.message }); }
});

router.post('/otp/verify', async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const code = String((req.body || {}).code || '').trim();
  const otp = await dbx.takeOtp(email);
  if (!otp) return res.status(400).json({ error: 'Kode OTP tidak ditemukan. Minta ulang.' });
  if (Date.parse(otp.expires_at) < Date.now()) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Kode OTP kedaluwarsa.' }); }
  if (otp.attempts >= 5) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Terlalu banyak percobaan. Minta kode baru.' }); }
  if (sha(code) !== otp.code_hash) { await dbx.otpAttempts(otp.id); return res.status(400).json({ error: 'Kode OTP salah.' }); }
  await dbx.deleteOtp(otp.id);
  let user = await dbx.getUserByEmail(email);
  if (!user) {
    let base = email.split('@')[0].replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20) || 'user';
    if (dbx.OWNER_USERNAMES.includes(base.toLowerCase())) base = `${base}${crypto.randomInt(100, 999)}`; // cegah klaim akun owner via OTP
    let username = base;
    while (await dbx.getUserByUsername(username)) username = `${base}${crypto.randomInt(10, 99)}`;
    user = await dbx.createUserWithEmail({ username, email, displayName: base });
    dbx.ensureOwners();
    await require('./bots').onboardUser(user);
  }
  if (user.blocked) return res.status(403).json({ error: 'Akun kamu diblokir oleh admin Xerophis.' });
  const token = crypto.randomUUID();
  await dbx.createSession(user.id, token, deviceOf(req));
  res.json({ token, user: { ...user, email } });
});

router.post('/password', requireAuth, async (req, res) => {
  const { current, next } = req.body || {};
  if (!next || String(next).length < 4) return res.status(400).json({ error: 'Password baru minimal 4 karakter.' });
  const row = await dbx.db.prepare('SELECT password_hash FROM users WHERE id = ?').get(req.user.id);
  if (row?.password_hash && !(await bcrypt.compare(String(current || ''), row.password_hash))) {
    return res.status(400).json({ error: 'Password saat ini salah.' });
  }
  await dbx.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(String(next), 10), req.user.id);
  res.json({ ok: true });
});

/* lupa password via OTP email */
router.post('/reset', async (req, res) => {
  const email = String((req.body || {}).email || '').trim().toLowerCase();
  const code = String((req.body || {}).code || '').trim();
  const next = String((req.body || {}).newPassword || '');
  if (next.length < 4) return res.status(400).json({ error: 'Password baru minimal 4 karakter.' });
  const otp = await dbx.takeOtp(email);
  if (!otp) return res.status(400).json({ error: 'Kode OTP tidak ditemukan. Minta ulang.' });
  if (Date.parse(otp.expires_at) < Date.now()) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Kode OTP kedaluwarsa.' }); }
  if (otp.attempts >= 5) { await dbx.deleteOtp(otp.id); return res.status(400).json({ error: 'Terlalu banyak percobaan.' }); }
  if (sha(code) !== otp.code_hash) { await dbx.otpAttempts(otp.id); return res.status(400).json({ error: 'Kode OTP salah.' }); }
  const user = await dbx.getUserByEmail(email);
  if (!user) return res.status(404).json({ error: 'Akun dengan email ini tidak ditemukan.' });
  await dbx.deleteOtp(otp.id);
  await dbx.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(await bcrypt.hash(next, 10), user.id);
  res.json({ ok: true });
});

module.exports = { router, requireAuth, limited };
